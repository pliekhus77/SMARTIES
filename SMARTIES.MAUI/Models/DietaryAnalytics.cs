using System.ComponentModel.DataAnnotations;

namespace SMARTIES.MAUI.Models;

public class AnalyticsEvent
{
    [Key]
    public int Id { get; set; }
    
    public int ProfileId { get; set; }
    
    [Required]
    public string EventType { get; set; } = string.Empty;
    
    public string? ProductBarcode { get; set; }
    
    public string? EventData { get; set; } // JSON
    
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    
    public ComplianceLevel? ComplianceLevel { get; set; }
}

public class DietaryAnalytics
{
    public int ProfileId { get; set; }
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }
    public int TotalScans { get; set; }
    public int CompliantScans { get; set; }
    public int ViolationScans { get; set; }
    public double ComplianceRate => TotalScans > 0 ? (double)CompliantScans / TotalScans : 0;
    public Dictionary<string, int> ViolationsByType { get; set; } = new();
    public Dictionary<string, double> NutritionalTrends { get; set; } = new();
}


