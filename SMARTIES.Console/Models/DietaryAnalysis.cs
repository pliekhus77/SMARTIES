namespace SMARTIES.Console.Models;

public class DietaryAnalysis
{
    public string ProductBarcode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsSafe { get; set; } = true;
    public ComplianceLevel OverallCompliance { get; set; } = ComplianceLevel.Safe;
    
    public List<DietaryViolation> Violations { get; set; } = new();
    public List<DietaryWarning> Warnings { get; set; } = new();
    public List<string> SafeFor { get; set; } = new();
    
    public string Summary { get; set; } = string.Empty;
    public string Recommendation { get; set; } = string.Empty;
}

public class DietaryViolation
{
    public string RestrictionType { get; set; } = string.Empty;
    public string RestrictionName { get; set; } = string.Empty;
    public RestrictionSeverity Severity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string IngredientFound { get; set; } = string.Empty;
    public ViolationType Type { get; set; }
}

public class DietaryWarning
{
    public string RestrictionType { get; set; } = string.Empty;
    public string RestrictionName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public WarningType Type { get; set; }
}

public enum ComplianceLevel
{
    Safe,           // Green - No issues
    Caution,        // Yellow - Minor warnings
    Warning,        // Orange - Significant concerns
    Violation,      // Red - Clear violations
    Critical        // Dark Red - Severe/life-threatening
}

public enum ViolationType
{
    DirectIngredient,       // Ingredient directly listed
    CrossContamination,     // May contain traces
    ProcessingAid,          // Used in processing
    Additive,              // Food additive/preservative
    Certification          // Missing required certification
}

public enum WarningType
{
    MayContain,            // May contain traces
    ProcessedInFacility,   // Processed in same facility
    UnclearIngredient,     // Ingredient not clearly identified
    MissingInformation,    // Insufficient product data
    Recommendation         // General recommendation
}