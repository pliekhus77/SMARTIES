using System.ComponentModel.DataAnnotations;

namespace SMARTIES.MAUI.Models;

public class CustomRestriction
{
    [Key]
    public int Id { get; set; }
    
    public int ProfileId { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public RestrictionType Type { get; set; }
    
    public string RuleDefinition { get; set; } = string.Empty; // JSON
    
    public int Priority { get; set; } = 1;
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ValidFrom { get; set; }
    
    public DateTime? ValidUntil { get; set; }
}

public enum RestrictionType
{
    Ingredient,
    Nutritional,
    Temporal,
    Brand,
    Category
}
