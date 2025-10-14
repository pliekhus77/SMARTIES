using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public interface IRuleBasedAnalysisService
{
    Task<DietaryAnalysis> AnalyzeProductAsync(AIAnalysisRequest request);
}

public class RuleBasedAnalysisService : IRuleBasedAnalysisService
{
    private readonly ILogger<RuleBasedAnalysisService> _logger;
    
    private readonly Dictionary<DietaryRestrictionType, string[]> _allergenKeywords = new()
    {
        [DietaryRestrictionType.Milk] = new[] { "milk", "dairy", "lactose", "casein", "whey", "butter", "cheese", "cream" },
        [DietaryRestrictionType.Eggs] = new[] { "egg", "albumin", "lecithin", "mayonnaise" },
        [DietaryRestrictionType.Fish] = new[] { "fish", "salmon", "tuna", "cod", "anchovy" },
        [DietaryRestrictionType.Shellfish] = new[] { "shrimp", "crab", "lobster", "shellfish", "mollusc" },
        [DietaryRestrictionType.TreeNuts] = new[] { "almond", "walnut", "pecan", "cashew", "pistachio", "hazelnut" },
        [DietaryRestrictionType.Peanuts] = new[] { "peanut", "groundnut" },
        [DietaryRestrictionType.Wheat] = new[] { "wheat", "flour", "gluten", "bread", "pasta" },
        [DietaryRestrictionType.Soybeans] = new[] { "soy", "soybean", "tofu", "tempeh" },
        [DietaryRestrictionType.Sesame] = new[] { "sesame", "tahini" }
    };

    private readonly Dictionary<DietaryRestrictionType, string[]> _religiousKeywords = new()
    {
        [DietaryRestrictionType.Halal] = new[] { "pork", "alcohol", "wine", "beer", "gelatin", "lard" },
        [DietaryRestrictionType.Kosher] = new[] { "pork", "shellfish", "mixing dairy and meat" },
        [DietaryRestrictionType.HinduVegetarian] = new[] { "beef", "meat", "chicken", "fish", "egg" }
    };

    public RuleBasedAnalysisService(ILogger<RuleBasedAnalysisService> logger)
    {
        _logger = logger;
    }

    public async Task<DietaryAnalysis> AnalyzeProductAsync(AIAnalysisRequest request)
    {
        var analysis = new DietaryAnalysis
        {
            ProductBarcode = "",
            AnalysisMethod = "Rule-Based",
            ConfidenceScore = 0.8
        };

        var ingredientText = string.Join(" ", request.Ingredients).ToLower();
        
        foreach (var restriction in request.Restrictions)
        {
            CheckRestriction(restriction, ingredientText, analysis);
        }

        analysis.OverallCompliance = DetermineOverallCompliance(analysis.Violations);
        
        return analysis;
    }

    private void CheckRestriction(DietaryRestrictionType restriction, string ingredientText, DietaryAnalysis analysis)
    {
        if (_allergenKeywords.ContainsKey(restriction))
        {
            CheckAllergen(restriction, ingredientText, analysis);
        }
        else if (_religiousKeywords.ContainsKey(restriction))
        {
            CheckReligious(restriction, ingredientText, analysis);
        }
        else
        {
            CheckLifestyle(restriction, ingredientText, analysis);
        }
    }

    private void CheckAllergen(DietaryRestrictionType allergen, string ingredientText, DietaryAnalysis analysis)
    {
        var keywords = _allergenKeywords[allergen];
        var foundKeywords = keywords.Where(k => ingredientText.Contains(k)).ToList();
        
        if (foundKeywords.Any())
        {
            analysis.Violations.Add(new DietaryViolation
            {
                Type = ViolationType.Allergen,
                Severity = SeverityLevel.Critical,
                Ingredient = foundKeywords.First(),
                Description = $"Contains {allergen}",
                Recommendation = "Avoid this product"
            });
        }
    }

    private void CheckReligious(DietaryRestrictionType restriction, string ingredientText, DietaryAnalysis analysis)
    {
        var keywords = _religiousKeywords[restriction];
        var foundKeywords = keywords.Where(k => ingredientText.Contains(k)).ToList();
        
        if (foundKeywords.Any())
        {
            analysis.Violations.Add(new DietaryViolation
            {
                Type = ViolationType.Religious,
                Severity = SeverityLevel.High,
                Ingredient = foundKeywords.First(),
                Description = $"Not compliant with {restriction}",
                Recommendation = "Check certification"
            });
        }
    }

    private void CheckLifestyle(DietaryRestrictionType lifestyle, string ingredientText, DietaryAnalysis analysis)
    {
        var animalProducts = new[] { "meat", "chicken", "beef", "pork", "fish", "dairy", "egg", "honey" };
        
        if (lifestyle == DietaryRestrictionType.Vegan)
        {
            var found = animalProducts.Where(p => ingredientText.Contains(p)).ToList();
            if (found.Any())
            {
                analysis.Violations.Add(new DietaryViolation
                {
                    Type = ViolationType.Lifestyle,
                    Severity = SeverityLevel.Medium,
                    Ingredient = found.First(),
                    Description = "Contains animal products",
                    Recommendation = "Look for vegan alternatives"
                });
            }
        }
    }

    private ComplianceLevel DetermineOverallCompliance(List<DietaryViolation> violations)
    {
        if (!violations.Any()) return ComplianceLevel.Safe;
        
        var maxSeverity = violations.Max(v => v.Severity);
        return maxSeverity >= SeverityLevel.High ? ComplianceLevel.Violation : ComplianceLevel.Caution;
    }
}
