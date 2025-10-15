using SQLite;

namespace SMARTIES.MAUI.Models;

[Table("UserProfiles")]
public class UserProfile
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Serialized as JSON strings in SQLite
    public string Allergies { get; set; } = "[]";
    public string ReligiousRestrictions { get; set; } = "[]";
    public string MedicalRestrictions { get; set; } = "[]";
    public string LifestylePreferences { get; set; } = "[]";

    public List<DietaryRestrictionType> GetAllRestrictions()
    {
        var restrictions = new List<DietaryRestrictionType>();
        
        // For now, return a basic set - this would normally parse the JSON strings
        // TODO: Implement proper JSON deserialization of restriction strings
        
        return restrictions;
    }
}

public enum AllergyType
{
    Milk,
    Eggs,
    Fish,
    Shellfish,
    TreeNuts,
    Peanuts,
    Wheat,
    Soybeans,
    Sesame,
    Sulfites,
    Mustard,
    Celery,
    Lupin,
    Molluscs
}

public enum ReligiousRestriction
{
    Halal,
    Kosher,
    HinduVegetarian,
    Jain,
    Buddhist
}

public enum MedicalRestriction
{
    Diabetes,
    Hypertension,
    Celiac,
    KidneyDisease,
    HeartDisease,
    LowSodium,
    LowSugar,
    GlutenFree
}

public enum LifestylePreference
{
    Vegan,
    Vegetarian,
    Keto,
    Paleo,
    OrganicOnly,
    NonGMO,
    LowCarb,
    HighProtein,
    DairyFree,
    SugarFree
}

public class DietaryRestriction
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // Allergy, Religious, Medical, Lifestyle
    public RestrictionSeverity Severity { get; set; } = RestrictionSeverity.Moderate;
    public bool IsActive { get; set; } = true;
}

public enum RestrictionSeverity
{
    Mild,      // Warning only
    Moderate,  // Strong warning
    Severe,    // Block with red alert
    Critical   // Absolute block (medical/allergy)
}