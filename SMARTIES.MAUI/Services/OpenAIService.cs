using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public interface IOpenAIService
{
    Task<AIAnalysisResponse> AnalyzeProductAsync(AIAnalysisRequest request);
}

public class OpenAIService : IOpenAIService
{
    private readonly HttpClient _httpClient;
    private readonly ISecureConfigurationService _configService;
    private readonly ILogger<OpenAIService> _logger;
    private const string BaseUrl = "https://api.openai.com/v1/chat/completions";

    public OpenAIService(HttpClient httpClient, ISecureConfigurationService configService, ILogger<OpenAIService> logger)
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
            var apiKey = await _configService.GetApiKeyAsync("openai");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return new AIAnalysisResponse
                {
                    Success = false,
                    ErrorMessage = "OpenAI API key not configured"
                };
            }

            var prompt = BuildAnalysisPrompt(request);
            var requestBody = new
            {
                model = "gpt-4",
                messages = new[]
                {
                    new { role = "system", content = "You are a dietary analysis expert. Analyze products for dietary compliance and return structured JSON." },
                    new { role = "user", content = prompt }
                },
                temperature = 0.1,
                max_tokens = 1000
            };

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(BaseUrl, content);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync();
            var openAIResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseJson);

            var analysis = ParseAnalysisResponse(openAIResponse?.Choices?.FirstOrDefault()?.Message?.Content ?? "");
            
            return new AIAnalysisResponse
            {
                Analysis = analysis,
                Success = true,
                ProcessingTimeMs = stopwatch.ElapsedMilliseconds
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OpenAI analysis failed for product {ProductName}", request.ProductName);
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
        
        return $@"Analyze this product for dietary compliance:
Product: {request.ProductName}
Ingredients: {ingredients}
Dietary Restrictions: {restrictions}

Return JSON with:
- overallCompliance: 0=Safe, 1=Caution, 2=Violation
- violations: array of {{type, severity, ingredient, description, recommendation}}
- warnings: array of {{message, severity, reason}}
- positiveAspects: array of strings
- confidenceScore: 0-1
- analysisMethod: 'AI'";
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

    private class OpenAIResponse
    {
        public Choice[]? Choices { get; set; }
    }

    private class Choice
    {
        public Message? Message { get; set; }
    }

    private class Message
    {
        public string? Content { get; set; }
    }
}
