using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public interface IAnthropicService
{
    Task<AIAnalysisResponse> AnalyzeProductAsync(AIAnalysisRequest request);
}

public class AnthropicService : IAnthropicService
{
    private readonly HttpClient _httpClient;
    private readonly ISecureConfigurationService _configService;
    private readonly ILogger<AnthropicService> _logger;
    private const string BaseUrl = "https://api.anthropic.com/v1/messages";

    public AnthropicService(HttpClient httpClient, ISecureConfigurationService configService, ILogger<AnthropicService> logger)
    {
        _httpClient = httpClient;
        _configService = configService;
        _logger = logger;
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<AIAnalysisResponse> AnalyzeProductAsync(AIAnalysisRequest request)
    {
        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            var apiKey = await _configService.GetApiKeyAsync("anthropic");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return new AIAnalysisResponse
                {
                    Success = false,
                    ErrorMessage = "Anthropic API key not configured"
                };
            }

            var prompt = BuildAnalysisPrompt(request);
            var requestBody = new
            {
                model = "claude-3-sonnet-20240229",
                max_tokens = 1000,
                messages = new[]
                {
                    new { role = "user", content = prompt }
                }
            };

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("x-api-key", apiKey);
            _httpClient.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(BaseUrl, content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            var anthropicResponse = JsonSerializer.Deserialize<AnthropicResponse>(responseJson);

            var analysis = ParseAnalysisResponse(anthropicResponse?.Content?.FirstOrDefault()?.Text ?? "");
            
            return new AIAnalysisResponse
            {
                Analysis = analysis,
                Success = true,
                ProcessingTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Anthropic analysis failed for product {ProductName}", request.ProductName);
            return new AIAnalysisResponse
            {
                Success = false,
                ErrorMessage = ex.Message,
                ProcessingTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
    }

    private string BuildAnalysisPrompt(AIAnalysisRequest request)
    {
        var restrictions = string.Join(", ", request.Restrictions);
        var ingredients = string.Join(", ", request.Ingredients);
        
        return $@"You are a dietary analysis expert. Analyze this product for dietary compliance:

Product: {request.ProductName}
Ingredients: {ingredients}
Dietary Restrictions: {restrictions}

Return only valid JSON with this structure:
{{
  ""overallCompliance"": 0,
  ""violations"": [],
  ""warnings"": [],
  ""positiveAspects"": [],
  ""confidenceScore"": 0.95,
  ""analysisMethod"": ""AI""
}}

Where:
- overallCompliance: 0=Safe, 1=Caution, 2=Violation
- violations: array of {{""type"": ""Allergen"", ""severity"": 2, ""ingredient"": ""milk"", ""description"": ""Contains milk"", ""recommendation"": ""Avoid""}}
- warnings: array of {{""message"": ""May contain traces"", ""severity"": 1, ""reason"": ""Cross-contamination""}}
- positiveAspects: array of positive compliance aspects
- confidenceScore: 0-1 based on data quality";
    }

    private DietaryAnalysis ParseAnalysisResponse(string content)
    {
        try
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<DietaryAnalysis>(content, options) ?? new DietaryAnalysis();
        }
        catch
        {
            return new DietaryAnalysis
            {
                OverallCompliance = ComplianceLevel.Caution,
                ConfidenceScore = 0.5,
                AnalysisMethod = "AI-Fallback"
            };
        }
    }

    private class AnthropicResponse
    {
        public ContentItem[]? Content { get; set; }
    }

    private class ContentItem
    {
        public string? Text { get; set; }
    }
}
