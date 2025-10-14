using System.ComponentModel.DataAnnotations;

namespace SMARTIES.MAUI.Models;

public class FamilyProfile
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string? PhotoPath { get; set; }
    
    public string? Description { get; set; }
    
    public bool IsActive { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Dietary restrictions as JSON
    public string DietaryRestrictionsJson { get; set; } = "{}";
    
    // Preferences as JSON
    public string PreferencesJson { get; set; } = "{}";
    
    // Metadata as JSON
    public string MetadataJson { get; set; } = "{}";
}
