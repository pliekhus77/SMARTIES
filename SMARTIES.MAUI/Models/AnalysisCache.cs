using SQLite;
using System.Text.Json;

namespace SMARTIES.MAUI.Models;

[Table("AnalysisCache")]
public class AnalysisCache
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }
    
    [Unique]
    public string CacheKey { get; set; } = string.Empty;
    
    public string ProductBarcode { get; set; } = string.Empty;
    
    public string UserProfileHash { get; set; } = string.Empty;
    
    public string AnalysisJson { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);

    [Ignore]
    public DietaryAnalysis? Analysis
    {
        get => string.IsNullOrEmpty(AnalysisJson) ? null : JsonSerializer.Deserialize<DietaryAnalysis>(AnalysisJson);
        set => AnalysisJson = value == null ? string.Empty : JsonSerializer.Serialize(value);
    }
}
