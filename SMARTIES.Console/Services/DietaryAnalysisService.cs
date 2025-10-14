using System.Text.Json;
using Microsoft.Extensions.Logging;
using SMARTIES.Console.Models;

namespace SMARTIES.Console.Services;

public class DietaryAnalysisService : IDietaryAnalysisService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DietaryAnalysisService> _logger;
    
    // In a real implementation, this would come from secure configuration
    private const string OpenAIApiKey = "your-openai-api-key";
    private const string OpenAIEndpoint = "https://api.openai.com/v1/chat/completions";

    public DietaryAnalysisService(HttpClient httpClient, ILogger<DietaryAnalysisService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<DietaryAnalysis> AnalyzeProductAsync(Product product, UserProfile userProfile, CancellationToken cancellationToken = default)
    {
        try
        {
            // First try offline analysis
            var offlineAnalysis = AnalyzeProductOfflineAsync(product, userProfile);
            
            // If we have internet and API key, enhance with AI analysis
            if (!string.IsNullOrEmpty(OpenAIApiKey) && OpenAIApiKey != "your-openai-api-key")
            {
                var aiAnalysis = await AnalyzeWithAIAsync(product, userProfile, cancellationToken);
                if (aiAnalysis != null)
                {
                    return aiAnalysis;
                }
            }

            return await offlineAnalysis;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error analyzing product {ProductName}", product.ProductName);
            return await AnalyzeProductOfflineAsync(product, userProfile);
        }
    }

    public async Task<DietaryAnalysis> AnalyzeProductOfflineAsync(Product product, UserProfile userProfile)
    {
        var analysis = new DietaryAnalysis
        {
            ProductBarcode = product.Barcode,
            ProductName = product.ProductName,
            AnalyzedAt = DateTime.UtcNow
        };

        try
        {
            // Parse user restrictions
            var allergies = ParseRestrictions<AllergyType>(userProfile.Allergies);
            var religious = ParseRestrictions<ReligiousRestriction>(userProfile.ReligiousRestrictions);
            var medical = ParseRestrictions<MedicalRestriction>(userProfile.MedicalRestrictions);
            var lifestyle = ParseRestrictions<LifestylePreference>(userProfile.LifestylePreferences);

            // Analyze allergies (highest priority)
            AnalyzeAllergies(product, allergies, analysis);
            
            // Analyze religious restrictions
            AnalyzeReligiousRestrictions(product, religious, analysis);
            
            // Analyze medical restrictions
            AnalyzeMedicalRestrictions(product, medical, analysis);
            
            // Analyze lifestyle preferences
            AnalyzeLifestylePreferences(product, lifestyle, analysis);

            // Determine overall compliance
            DetermineOverallCompliance(analysis);
            
            // Generate summary
            GenerateSummary(analysis);

            return analysis;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in offline analysis for product {ProductName}", product.ProductName);
            
            // Return safe default
            analysis.IsSafe = false;
            analysis.OverallCompliance = ComplianceLevel.Warning;
            analysis.Summary = "Unable to analyze product. Please check ingredients manually.";
            
            return analysis;
        }
    }

    private async Task<DietaryAnalysis?> AnalyzeWithAIAsync(Product product, UserProfile userProfile, CancellationToken cancellationToken)
    {
        // This would implement OpenAI API integration
        // For now, return null to fall back to offline analysis
        await Task.Delay(1, cancellationToken);
        return null;
    }

    private List<T> ParseRestrictions<T>(string jsonString) where T : struct, Enum
    {
        try
        {
            if (string.IsNullOrEmpty(jsonString) || jsonString == "[]")
                return new List<T>();

            var stringList = JsonSerializer.Deserialize<List<string>>(jsonString) ?? new List<string>();
            return stringList.Where(s => Enum.TryParse<T>(s, out _))
                           .Select(s => Enum.Parse<T>(s))
                           .ToList();
        }
        catch
        {
            return new List<T>();
        }
    }

    private void AnalyzeAllergies(Product product, List<AllergyType> allergies, DietaryAnalysis analysis)
    {
        if (!allergies.Any()) return;

        var ingredients = product.IngredientsText.ToLowerInvariant();
        var allergens = product.Allergens.ToLowerInvariant();

        foreach (var allergy in allergies)
        {
            var allergenKeywords = GetAllergenKeywords(allergy);
            
            foreach (var keyword in allergenKeywords)
            {
                if (ingredients.Contains(keyword) || allergens.Contains(keyword))
                {
                    analysis.Violations.Add(new DietaryViolation
                    {
                        RestrictionType = "Allergy",
                        RestrictionName = allergy.ToString(),
                        Severity = RestrictionSeverity.Critical,
                        Reason = $"Contains {keyword}",
                        IngredientFound = keyword,
                        Type = ViolationType.DirectIngredient
                    });
                }
            }
        }
    }

    private void AnalyzeReligiousRestrictions(Product product, List<ReligiousRestriction> restrictions, DietaryAnalysis analysis)
    {
        if (!restrictions.Any()) return;

        var ingredients = product.IngredientsText.ToLowerInvariant();
        
        foreach (var restriction in restrictions)
        {
            var forbiddenIngredients = GetReligiousForbiddenIngredients(restriction);
            
            foreach (var ingredient in forbiddenIngredients)
            {
                if (ingredients.Contains(ingredient))
                {
                    analysis.Violations.Add(new DietaryViolation
                    {
                        RestrictionType = "Religious",
                        RestrictionName = restriction.ToString(),
                        Severity = RestrictionSeverity.Severe,
                        Reason = $"Contains {ingredient}",
                        IngredientFound = ingredient,
                        Type = ViolationType.DirectIngredient
                    });
                }
            }
        }
    }

    private void AnalyzeMedicalRestrictions(Product product, List<MedicalRestriction> restrictions, DietaryAnalysis analysis)
    {
        if (!restrictions.Any()) return;

        foreach (var restriction in restrictions)
        {
            switch (restriction)
            {
                case MedicalRestriction.Diabetes:
                    AnalyzeDiabetes(product, analysis);
                    break;
                case MedicalRestriction.Hypertension:
                    AnalyzeHypertension(product, analysis);
                    break;
                case MedicalRestriction.Celiac:
                case MedicalRestriction.GlutenFree:
                    AnalyzeGluten(product, analysis);
                    break;
            }
        }
    }

    private void AnalyzeLifestylePreferences(Product product, List<LifestylePreference> preferences, DietaryAnalysis analysis)
    {
        if (!preferences.Any()) return;

        var ingredients = product.IngredientsText.ToLowerInvariant();
        
        foreach (var preference in preferences)
        {
            var conflictingIngredients = GetLifestyleConflictingIngredients(preference);
            
            foreach (var ingredient in conflictingIngredients)
            {
                if (ingredients.Contains(ingredient))
                {
                    analysis.Warnings.Add(new DietaryWarning
                    {
                        RestrictionType = "Lifestyle",
                        RestrictionName = preference.ToString(),
                        Message = $"Contains {ingredient}",
                        Reason = $"Not suitable for {preference} diet",
                        Type = WarningType.MayContain
                    });
                }
            }
        }
    }

    private void AnalyzeDiabetes(Product product, DietaryAnalysis analysis)
    {
        if (product.Sugars.HasValue && product.Sugars > 15) // High sugar content
        {
            analysis.Warnings.Add(new DietaryWarning
            {
                RestrictionType = "Medical",
                RestrictionName = "Diabetes",
                Message = $"High sugar content: {product.Sugars:F1}g per 100g",
                Reason = "May affect blood sugar levels",
                Type = WarningType.Recommendation
            });
        }
    }

    private void AnalyzeHypertension(Product product, DietaryAnalysis analysis)
    {
        if (product.Salt.HasValue && product.Salt > 1.5) // High salt content
        {
            analysis.Warnings.Add(new DietaryWarning
            {
                RestrictionType = "Medical",
                RestrictionName = "Hypertension",
                Message = $"High salt content: {product.Salt:F1}g per 100g",
                Reason = "May affect blood pressure",
                Type = WarningType.Recommendation
            });
        }
    }

    private void AnalyzeGluten(Product product, DietaryAnalysis analysis)
    {
        var ingredients = product.IngredientsText.ToLowerInvariant();
        var glutenSources = new[] { "wheat", "barley", "rye", "oats", "gluten" };
        
        foreach (var source in glutenSources)
        {
            if (ingredients.Contains(source))
            {
                analysis.Violations.Add(new DietaryViolation
                {
                    RestrictionType = "Medical",
                    RestrictionName = "Gluten-Free",
                    Severity = RestrictionSeverity.Severe,
                    Reason = $"Contains {source}",
                    IngredientFound = source,
                    Type = ViolationType.DirectIngredient
                });
            }
        }
    }

    private void DetermineOverallCompliance(DietaryAnalysis analysis)
    {
        if (analysis.Violations.Any(v => v.Severity == RestrictionSeverity.Critical))
        {
            analysis.OverallCompliance = ComplianceLevel.Critical;
            analysis.IsSafe = false;
        }
        else if (analysis.Violations.Any(v => v.Severity == RestrictionSeverity.Severe))
        {
            analysis.OverallCompliance = ComplianceLevel.Violation;
            analysis.IsSafe = false;
        }
        else if (analysis.Violations.Any() || analysis.Warnings.Count > 2)
        {
            analysis.OverallCompliance = ComplianceLevel.Warning;
            analysis.IsSafe = false;
        }
        else if (analysis.Warnings.Any())
        {
            analysis.OverallCompliance = ComplianceLevel.Caution;
            analysis.IsSafe = true;
        }
        else
        {
            analysis.OverallCompliance = ComplianceLevel.Safe;
            analysis.IsSafe = true;
        }
    }

    private void GenerateSummary(DietaryAnalysis analysis)
    {
        if (analysis.OverallCompliance == ComplianceLevel.Safe)
        {
            analysis.Summary = "✅ This product appears safe for your dietary restrictions.";
            analysis.Recommendation = "Enjoy this product!";
        }
        else if (analysis.OverallCompliance == ComplianceLevel.Critical)
        {
            analysis.Summary = "🚫 CRITICAL: This product contains ingredients that may be dangerous for you.";
            analysis.Recommendation = "DO NOT consume this product.";
        }
        else
        {
            var violationCount = analysis.Violations.Count;
            var warningCount = analysis.Warnings.Count;
            
            analysis.Summary = $"⚠️ Found {violationCount} violations and {warningCount} warnings.";
            analysis.Recommendation = "Please review the details before consuming.";
        }
    }

    private List<string> GetAllergenKeywords(AllergyType allergy)
    {
        return allergy switch
        {
            AllergyType.Milk => new[] { "milk", "dairy", "lactose", "casein", "whey" }.ToList(),
            AllergyType.Eggs => new[] { "egg", "albumin", "lecithin" }.ToList(),
            AllergyType.Fish => new[] { "fish", "salmon", "tuna", "cod" }.ToList(),
            AllergyType.Shellfish => new[] { "shellfish", "shrimp", "crab", "lobster" }.ToList(),
            AllergyType.TreeNuts => new[] { "nuts", "almond", "walnut", "cashew", "pecan" }.ToList(),
            AllergyType.Peanuts => new[] { "peanut", "groundnut" }.ToList(),
            AllergyType.Wheat => new[] { "wheat", "gluten" }.ToList(),
            AllergyType.Soybeans => new[] { "soy", "soya", "soybean" }.ToList(),
            AllergyType.Sesame => new[] { "sesame", "tahini" }.ToList(),
            _ => new List<string>()
        };
    }

    private List<string> GetReligiousForbiddenIngredients(ReligiousRestriction restriction)
    {
        return restriction switch
        {
            ReligiousRestriction.Halal => new[] { "pork", "alcohol", "wine", "beer", "gelatin" }.ToList(),
            ReligiousRestriction.Kosher => new[] { "pork", "shellfish", "mixing meat and dairy" }.ToList(),
            ReligiousRestriction.HinduVegetarian => new[] { "beef", "meat", "chicken", "fish" }.ToList(),
            _ => new List<string>()
        };
    }

    private List<string> GetLifestyleConflictingIngredients(LifestylePreference preference)
    {
        return preference switch
        {
            LifestylePreference.Vegan => new[] { "milk", "egg", "meat", "fish", "honey", "gelatin" }.ToList(),
            LifestylePreference.Vegetarian => new[] { "meat", "fish", "chicken", "beef", "pork" }.ToList(),
            LifestylePreference.DairyFree => new[] { "milk", "dairy", "lactose", "casein", "whey" }.ToList(),
            _ => new List<string>()
        };
    }
}