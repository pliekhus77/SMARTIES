using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Tests.Helpers;

public class ProductBuilder
{
    private Product _product = new();

    public static ProductBuilder Create() => new();

    public ProductBuilder WithBarcode(string barcode)
    {
        _product.Barcode = barcode;
        return this;
    }

    public ProductBuilder WithName(string name)
    {
        _product.ProductName = name;
        return this;
    }

    public ProductBuilder WithIngredients(params string[] ingredients)
    {
        _product.Ingredients = ingredients.ToList();
        return this;
    }

    public ProductBuilder WithAllergens(params string[] allergens)
    {
        _product.Allergens = allergens.ToList();
        return this;
    }

    public Product Build() => _product;
}

public class UserProfileBuilder
{
    private UserProfile _profile = new();

    public static UserProfileBuilder Create() => new();

    public UserProfileBuilder WithName(string name)
    {
        _profile.Name = name;
        return this;
    }

    public UserProfileBuilder WithRestrictions(params DietaryRestrictionType[] restrictions)
    {
        _profile.DietaryRestrictions = restrictions.ToList();
        return this;
    }

    public UserProfile Build() => _profile;
}

public class DietaryAnalysisBuilder
{
    private DietaryAnalysis _analysis = new();

    public static DietaryAnalysisBuilder Create() => new();

    public DietaryAnalysisBuilder WithCompliance(ComplianceLevel level)
    {
        _analysis.OverallCompliance = level;
        return this;
    }

    public DietaryAnalysisBuilder WithViolation(ViolationType type, SeverityLevel severity, string ingredient)
    {
        _analysis.Violations.Add(new DietaryViolation
        {
            Type = type,
            Severity = severity,
            Ingredient = ingredient,
            Description = $"Contains {ingredient}",
            Recommendation = "Avoid this product"
        });
        return this;
    }

    public DietaryAnalysis Build() => _analysis;
}
