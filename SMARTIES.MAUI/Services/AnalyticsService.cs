using SQLite;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Data;
using System.Text.Json;

namespace SMARTIES.MAUI.Services;

public interface IAnalyticsService
{
    Task RecordEventAsync(int profileId, string eventType, string? productBarcode = null, object? eventData = null, ComplianceLevel? complianceLevel = null);
    Task<DietaryAnalytics> GetAnalyticsAsync(int profileId, DateTime startDate, DateTime endDate);
    Task<List<AnalyticsEvent>> GetEventsAsync(int profileId, DateTime? startDate = null, DateTime? endDate = null);
    Task<Dictionary<string, object>> GetInsightsAsync(int profileId);
    Task<byte[]> ExportAnalyticsAsync(int profileId, DateTime startDate, DateTime endDate, string format = "json");
}

public class AnalyticsService : IAnalyticsService
{
    private readonly SQLiteAsyncConnection _database;
    private readonly ILogger<AnalyticsService> _logger;

    public AnalyticsService(AdvancedFeaturesDbService dbService, ILogger<AnalyticsService> logger)
    {
        _database = dbService.Database;
        _logger = logger;
    }

    public async Task RecordEventAsync(int profileId, string eventType, string? productBarcode = null, object? eventData = null, ComplianceLevel? complianceLevel = null)
    {
        try
        {
            var analyticsEvent = new AnalyticsEvent
            {
                ProfileId = profileId,
                EventType = eventType,
                ProductBarcode = productBarcode,
                EventData = eventData != null ? JsonSerializer.Serialize(eventData) : null,
                ComplianceLevel = complianceLevel,
                Timestamp = DateTime.UtcNow
            };

            await _database.InsertAsync(analyticsEvent);
            _logger.LogDebug("Recorded analytics event: {EventType} for profile: {ProfileId}", eventType, profileId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording analytics event: {EventType}", eventType);
        }
    }

    public async Task<DietaryAnalytics> GetAnalyticsAsync(int profileId, DateTime startDate, DateTime endDate)
    {
        try
        {
            var events = await _database.Table<AnalyticsEvent>()
                .Where(e => e.ProfileId == profileId && 
                           e.Timestamp >= startDate && 
                           e.Timestamp <= endDate)
                .ToListAsync();

            var scanEvents = events.Where(e => e.EventType == "scan").ToList();
            
            var analytics = new DietaryAnalytics
            {
                ProfileId = profileId,
                PeriodStart = startDate,
                PeriodEnd = endDate,
                TotalScans = scanEvents.Count,
                CompliantScans = scanEvents.Count(e => e.ComplianceLevel == ComplianceLevel.Compliant),
                ViolationScans = scanEvents.Count(e => e.ComplianceLevel == ComplianceLevel.Violation)
            };

            // Calculate violations by type
            var violationEvents = scanEvents.Where(e => e.ComplianceLevel == ComplianceLevel.Violation);
            foreach (var violation in violationEvents)
            {
                if (!string.IsNullOrEmpty(violation.EventData))
                {
                    try
                    {
                        var data = JsonSerializer.Deserialize<Dictionary<string, object>>(violation.EventData);
                        if (data?.ContainsKey("violationType") == true)
                        {
                            var violationType = data["violationType"].ToString() ?? "Unknown";
                            analytics.ViolationsByType[violationType] = 
                                analytics.ViolationsByType.GetValueOrDefault(violationType, 0) + 1;
                        }
                    }
                    catch (JsonException)
                    {
                        // Ignore JSON parsing errors
                    }
                }
            }

            return analytics;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting analytics for profile: {ProfileId}", profileId);
            return new DietaryAnalytics { ProfileId = profileId, PeriodStart = startDate, PeriodEnd = endDate };
        }
    }

    public async Task<List<AnalyticsEvent>> GetEventsAsync(int profileId, DateTime? startDate = null, DateTime? endDate = null)
    {
        try
        {
            var query = _database.Table<AnalyticsEvent>()
                .Where(e => e.ProfileId == profileId);

            if (startDate.HasValue)
                query = query.Where(e => e.Timestamp >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(e => e.Timestamp <= endDate.Value);

            return await query
                .OrderByDescending(e => e.Timestamp)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting events for profile: {ProfileId}", profileId);
            return new List<AnalyticsEvent>();
        }
    }

    public async Task<Dictionary<string, object>> GetInsightsAsync(int profileId)
    {
        try
        {
            var insights = new Dictionary<string, object>();
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            
            var analytics = await GetAnalyticsAsync(profileId, thirtyDaysAgo, DateTime.UtcNow);
            
            insights["complianceRate"] = analytics.ComplianceRate;
            insights["totalScans"] = analytics.TotalScans;
            insights["trendDirection"] = analytics.ComplianceRate > 0.8 ? "improving" : "needs_attention";
            insights["topViolations"] = analytics.ViolationsByType
                .OrderByDescending(kvp => kvp.Value)
                .Take(3)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);

            return insights;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting insights for profile: {ProfileId}", profileId);
            return new Dictionary<string, object>();
        }
    }

    public async Task<byte[]> ExportAnalyticsAsync(int profileId, DateTime startDate, DateTime endDate, string format = "json")
    {
        try
        {
            var analytics = await GetAnalyticsAsync(profileId, startDate, endDate);
            var events = await GetEventsAsync(profileId, startDate, endDate);

            var exportData = new
            {
                Analytics = analytics,
                Events = events,
                ExportedAt = DateTime.UtcNow,
                Format = format
            };

            var json = JsonSerializer.Serialize(exportData, new JsonSerializerOptions { WriteIndented = true });
            return System.Text.Encoding.UTF8.GetBytes(json);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting analytics for profile: {ProfileId}", profileId);
            throw;
        }
    }
}
