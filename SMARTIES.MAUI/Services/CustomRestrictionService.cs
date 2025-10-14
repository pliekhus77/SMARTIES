using SQLite;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Data;
using System.Text.Json;

namespace SMARTIES.MAUI.Services;

public interface ICustomRestrictionService
{
    Task<List<CustomRestriction>> GetRestrictionsAsync(int profileId);
    Task<CustomRestriction> CreateRestrictionAsync(int profileId, string name, RestrictionType type, object ruleDefinition);
    Task UpdateRestrictionAsync(CustomRestriction restriction);
    Task DeleteRestrictionAsync(int restrictionId);
    Task<bool> EvaluateRestrictionAsync(CustomRestriction restriction, Product product);
    Task<List<CustomRestriction>> GetViolatedRestrictionsAsync(int profileId, Product product);
}

public class CustomRestrictionService : ICustomRestrictionService
{
    private readonly SQLiteAsyncConnection _database;
    private readonly ILogger<CustomRestrictionService> _logger;

    public CustomRestrictionService(AdvancedFeaturesDbService dbService, ILogger<CustomRestrictionService> logger)
    {
        _database = dbService.Database;
        _logger = logger;
    }

    public async Task<List<CustomRestriction>> GetRestrictionsAsync(int profileId)
    {
        try
        {
            return await _database.Table<CustomRestriction>()
                .Where(r => r.ProfileId == profileId && r.IsActive)
                .OrderBy(r => r.Priority)
                .ThenBy(r => r.Name)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting restrictions for profile: {ProfileId}", profileId);
            return new List<CustomRestriction>();
        }
    }

    public async Task<CustomRestriction> CreateRestrictionAsync(int profileId, string name, RestrictionType type, object ruleDefinition)
    {
        try
        {
            var restriction = new CustomRestriction
            {
                ProfileId = profileId,
                Name = name,
                Type = type,
                RuleDefinition = JsonSerializer.Serialize(ruleDefinition),
                Priority = 1,
                IsActive = true
            };

            await _database.InsertAsync(restriction);
            _logger.LogInformation("Created custom restriction: {Name} for profile: {ProfileId}", name, profileId);
            
            return restriction;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating custom restriction: {Name}", name);
            throw;
        }
    }

    public async Task UpdateRestrictionAsync(CustomRestriction restriction)
    {
        try
        {
            await _database.UpdateAsync(restriction);
            _logger.LogInformation("Updated custom restriction: {Name}", restriction.Name);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating custom restriction: {Id}", restriction.Id);
            throw;
        }
    }

    public async Task DeleteRestrictionAsync(int restrictionId)
    {
        try
        {
            await _database.DeleteAsync<CustomRestriction>(restrictionId);
            _logger.LogInformation("Deleted custom restriction: {Id}", restrictionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting custom restriction: {Id}", restrictionId);
            throw;
        }
    }

    public async Task<bool> EvaluateRestrictionAsync(CustomRestriction restriction, Product product)
    {
        try
        {
            // Check temporal restrictions first
            if (restriction.ValidFrom.HasValue && DateTime.UtcNow < restriction.ValidFrom.Value)
                return false;
            
            if (restriction.ValidUntil.HasValue && DateTime.UtcNow > restriction.ValidUntil.Value)
                return false;

            if (string.IsNullOrEmpty(restriction.RuleDefinition))
                return false;

            var ruleData = JsonSerializer.Deserialize<Dictionary<string, object>>(restriction.RuleDefinition);
            if (ruleData == null)
                return false;

            return restriction.Type switch
            {
                RestrictionType.Ingredient => EvaluateIngredientRule(ruleData, product),
                RestrictionType.Nutritional => EvaluateNutritionalRule(ruleData, product),
                RestrictionType.Brand => EvaluateBrandRule(ruleData, product),
                RestrictionType.Category => EvaluateCategoryRule(ruleData, product),
                RestrictionType.Temporal => EvaluateTemporalRule(ruleData),
                _ => false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error evaluating restriction: {Name}", restriction.Name);
            return false;
        }
    }

    public async Task<List<CustomRestriction>> GetViolatedRestrictionsAsync(int profileId, Product product)
    {
        try
        {
            var restrictions = await GetRestrictionsAsync(profileId);
            var violatedRestrictions = new List<CustomRestriction>();

            foreach (var restriction in restrictions)
            {
                if (await EvaluateRestrictionAsync(restriction, product))
                {
                    violatedRestrictions.Add(restriction);
                }
            }

            return violatedRestrictions.OrderBy(r => r.Priority).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting violated restrictions for profile: {ProfileId}", profileId);
            return new List<CustomRestriction>();
        }
    }

    private bool EvaluateIngredientRule(Dictionary<string, object> ruleData, Product product)
    {
        if (!ruleData.ContainsKey("ingredients") || string.IsNullOrEmpty(product.IngredientsText))
            return false;

        var restrictedIngredients = JsonSerializer.Deserialize<List<string>>(ruleData["ingredients"].ToString() ?? "[]");
        if (restrictedIngredients == null)
            return false;

        var ingredientsText = product.IngredientsText.ToLowerInvariant();
        return restrictedIngredients.Any(ingredient => 
            ingredientsText.Contains(ingredient.ToLowerInvariant()));
    }

    private bool EvaluateNutritionalRule(Dictionary<string, object> ruleData, Product product)
    {
        if (string.IsNullOrEmpty(product.NutritionFactsJson))
            return false;

        try
        {
            var nutritionFacts = JsonSerializer.Deserialize<Dictionary<string, object>>(product.NutritionFactsJson);
            if (nutritionFacts == null)
                return false;

            // Check each nutritional constraint
            foreach (var rule in ruleData)
            {
                if (nutritionFacts.ContainsKey(rule.Key))
                {
                    var ruleValue = JsonSerializer.Deserialize<Dictionary<string, double>>(rule.Value.ToString() ?? "{}");
                    if (ruleValue == null)
                        continue;

                    if (double.TryParse(nutritionFacts[rule.Key].ToString(), out var actualValue))
                    {
                        if (ruleValue.ContainsKey("max") && actualValue > ruleValue["max"])
                            return true;
                        
                        if (ruleValue.ContainsKey("min") && actualValue < ruleValue["min"])
                            return true;
                    }
                }
            }

            return false;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private bool EvaluateBrandRule(Dictionary<string, object> ruleData, Product product)
    {
        if (!ruleData.ContainsKey("brands") || string.IsNullOrEmpty(product.Brand))
            return false;

        var restrictedBrands = JsonSerializer.Deserialize<List<string>>(ruleData["brands"].ToString() ?? "[]");
        if (restrictedBrands == null)
            return false;

        return restrictedBrands.Any(brand => 
            product.Brand.Contains(brand, StringComparison.OrdinalIgnoreCase));
    }

    private bool EvaluateCategoryRule(Dictionary<string, object> ruleData, Product product)
    {
        if (!ruleData.ContainsKey("categories") || string.IsNullOrEmpty(product.CategoriesJson))
            return false;

        try
        {
            var productCategories = JsonSerializer.Deserialize<List<string>>(product.CategoriesJson);
            var restrictedCategories = JsonSerializer.Deserialize<List<string>>(ruleData["categories"].ToString() ?? "[]");
            
            if (productCategories == null || restrictedCategories == null)
                return false;

            return restrictedCategories.Any(restrictedCategory =>
                productCategories.Any(productCategory =>
                    productCategory.Contains(restrictedCategory, StringComparison.OrdinalIgnoreCase)));
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private bool EvaluateTemporalRule(Dictionary<string, object> ruleData)
    {
        var now = DateTime.Now;

        // Check time-based restrictions
        if (ruleData.ContainsKey("timeStart") && ruleData.ContainsKey("timeEnd"))
        {
            if (TimeSpan.TryParse(ruleData["timeStart"].ToString(), out var startTime) &&
                TimeSpan.TryParse(ruleData["timeEnd"].ToString(), out var endTime))
            {
                var currentTime = now.TimeOfDay;
                
                if (startTime <= endTime)
                {
                    return currentTime >= startTime && currentTime <= endTime;
                }
                else
                {
                    // Overnight restriction (e.g., 22:00 to 06:00)
                    return currentTime >= startTime || currentTime <= endTime;
                }
            }
        }

        // Check day-based restrictions
        if (ruleData.ContainsKey("days"))
        {
            var restrictedDays = JsonSerializer.Deserialize<List<string>>(ruleData["days"].ToString() ?? "[]");
            if (restrictedDays != null)
            {
                return restrictedDays.Contains(now.DayOfWeek.ToString(), StringComparer.OrdinalIgnoreCase);
            }
        }

        return false;
    }
}
