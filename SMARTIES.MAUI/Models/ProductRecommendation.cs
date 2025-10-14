using System.ComponentModel.DataAnnotations;

namespace SMARTIES.MAUI.Models;

public class ProductRecommendation
{
    [Key]
    public int Id { get; set; }
    
    public int ProfileId { get; set; }
    
    [Required]
    public string ProductBarcode { get; set; } = string.Empty;
    
    [Required]
    public string ProductName { get; set; } = string.Empty;
    
    public RecommendationType Type { get; set; }
    
    public double Confidence { get; set; }
    
    public string? Reasoning { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsViewed { get; set; }
    
    public int? UserFeedback { get; set; } // -1 dislike, 0 neutral, 1 like
}

public enum RecommendationType
{
    Alternative,
    Similar,
    Complementary,
    Seasonal,
    Trending
}
