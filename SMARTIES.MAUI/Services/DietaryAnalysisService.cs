using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public interface IDietaryAnalysisService
{
    Task<DietaryAnalysis> AnalyzeProductAsync(string productName, List<string> ingredients, List<DietaryRestrictionType> restrictions);
}

public class DietaryAnalysisService : IDietaryAnalysisService
{
    private readonly IOpenAIService _openAIService;
    private readonly IAnthropicService _anthropicService;
    private readonly IRuleBasedAnalysisService _ruleBasedService;
    private readonly ILogger<DietaryAnalysisService> _logger;

    public DietaryAnalysisService(
        IOpenAIService openAIService,
        IAnthropicService anthropicService,
        IRuleBasedAnalysisService ruleBasedService,
        ILogger<DietaryAnalysisService> logger)
    {
        _openAIService = openAIService;
        _anthropicService = anthropicService;
        _ruleBasedService = ruleBasedService;
        _logger = logger;
    }

    public async Task<DietaryAnalysis> AnalyzeProductAsync(string productName, List<string> ingredients, List<DietaryRestrictionType> restrictions)
    {
        var request = new AIAnalysisRequest
        {
            ProductName = productName,
            Ingredients = ingredients,
            Restrictions = restrictions
        };

        // Try AI analysis first (OpenAI, then Anthropic)
        var aiResult = await TryAIAnalysis(request);
        if (aiResult.Success)
        {
            return aiResult.Analysis;
        }

        // Fallback to rule-based analysis
        _logger.LogInformation("AI analysis failed, falling back to rule-based analysis");
        return await _ruleBasedService.AnalyzeProductAsync(request);
    }

    private async Task<AIAnalysisResponse> TryAIAnalysis(AIAnalysisRequest request)
    {
        try
        {
            // Try OpenAI first
            var openAIResult = await _openAIService.AnalyzeProductAsync(request);
            if (openAIResult.Success)
            {
                return openAIResult;
            }

            // Try Anthropic as fallback
            var anthropicResult = await _anthropicService.AnalyzeProductAsync(request);
            if (anthropicResult.Success)
            {
                return anthropicResult;
            }

            return new AIAnalysisResponse { Success = false, ErrorMessage = "All AI providers failed" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI analysis failed");
            return new AIAnalysisResponse { Success = false, ErrorMessage = ex.Message };
        }
    }
}
