using System.ComponentModel.DataAnnotations;

namespace SMARTIES.MAUI.Models;

public enum ComplianceLevel
{
    Safe = 0,
    Caution = 1,
    Violation = 2
}

public enum ViolationType
{
    Allergen,
    Religious,
    Medical,
    Lifestyle
}

public enum SeverityLevel
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public enum DietaryRestrictionType
{
    // Allergens
    Milk, Eggs, Fish, Shellfish, TreeNuts, Peanuts, Wheat, Soybeans, Sesame,
    
    // Religious
    Halal, Kosher, HinduVegetarian, Jain, Buddhist,
    
    // Medical
    Diabetes, Hypertension, Celiac, KidneyDisease,
    
    // Lifestyle
    Vegan, Vegetarian, Keto, Paleo, Organic, NonGMO
}

public class DietaryViolation
{
    public ViolationType Type { get; set; }
    public SeverityLevel Severity { get; set; }
    public string Ingredient { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
}

public class DietaryWarning
{
    public string Message { get; set; } = string.Empty;
    public SeverityLevel Severity { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class DietaryAnalysis
{
    public string ProductBarcode { get; set; } = string.Empty;
    public ComplianceLevel OverallCompliance { get; set; }
    public List<DietaryViolation> Violations { get; set; } = new();
    public List<DietaryWarning> Warnings { get; set; } = new();
    public List<string> PositiveAspects { get; set; } = new();
    public double ConfidenceScore { get; set; }
    public string AnalysisMethod { get; set; } = string.Empty;
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}

public class AIAnalysisRequest
{
    public string ProductName { get; set; } = string.Empty;
    public List<string> Ingredients { get; set; } = new();
    public Dictionary<string, object> NutritionFacts { get; set; } = new();
    public List<DietaryRestrictionType> Restrictions { get; set; } = new();
}

public class AIAnalysisResponse
{
    public DietaryAnalysis Analysis { get; set; } = new();
    public bool Success { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public double ProcessingTimeMs { get; set; }
}
