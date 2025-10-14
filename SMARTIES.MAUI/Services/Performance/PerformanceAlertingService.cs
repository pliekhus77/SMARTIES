using SMARTIES.MAUI.Models.Performance;

namespace SMARTIES.MAUI.Services.Performance;

public enum AlertSeverity
{
    Info,
    Warning,
    Critical
}

public class PerformanceAlert
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public AlertSeverity Severity { get; set; }
    public string Message { get; set; } = string.Empty;
    public PerformanceMetricType MetricType { get; set; }
    public double ThresholdValue { get; set; }
    public double ActualValue { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public List<string> Recommendations { get; set; } = new();
}

public interface IPerformanceAlertingService
{
    Task MonitorThresholdsAsync();
    Task<IEnumerable<PerformanceAlert>> GetActiveAlertsAsync();
    Task<IEnumerable<string>> GenerateOptimizationRecommendationsAsync(PerformanceMetricType metricType, double value);
    event EventHandler<PerformanceAlert>? AlertGenerated;
}

public class PerformanceAlertingService : IPerformanceAlertingService
{
    private readonly IPerformanceService _performanceService;
    private readonly List<PerformanceAlert> _activeAlerts = new();
    
    private readonly Dictionary<PerformanceMetricType, double> _thresholds = new()
    {
        { PerformanceMetricType.ScanTime, 3000 }, // 3 seconds
        { PerformanceMetricType.ApiResponseTime, 2000 }, // 2 seconds
        { PerformanceMetricType.MemoryUsage, 512 }, // 512 MB
        { PerformanceMetricType.BatteryUsage, 10 }, // 10% per hour
        { PerformanceMetricType.AppStartupTime, 2000 } // 2 seconds
    };

    public event EventHandler<PerformanceAlert>? AlertGenerated;

    public PerformanceAlertingService(IPerformanceService performanceService)
    {
        _performanceService = performanceService;
    }

    public async Task MonitorThresholdsAsync()
    {
        var recentMetrics = await _performanceService.GetMetricsAsync(timeRange: TimeSpan.FromMinutes(5));
        
        foreach (var metricGroup in recentMetrics.GroupBy(m => m.Type))
        {
            var metricType = metricGroup.Key;
            var latestMetric = metricGroup.OrderByDescending(m => m.Timestamp).First();
            
            if (_thresholds.TryGetValue(metricType, out var threshold) && latestMetric.Value > threshold)
            {
                var alert = new PerformanceAlert
                {
                    Severity = DetermineSeverity(latestMetric.Value, threshold),
                    Message = $"{metricType} exceeded threshold: {latestMetric.Value}{latestMetric.Unit} > {threshold}{latestMetric.Unit}",
                    MetricType = metricType,
                    ThresholdValue = threshold,
                    ActualValue = latestMetric.Value,
                    Recommendations = (await GenerateOptimizationRecommendationsAsync(metricType, latestMetric.Value)).ToList()
                };

                _activeAlerts.Add(alert);
                AlertGenerated?.Invoke(this, alert);
            }
        }
    }

    public Task<IEnumerable<PerformanceAlert>> GetActiveAlertsAsync()
    {
        // Remove alerts older than 1 hour
        var cutoff = DateTime.UtcNow.AddHours(-1);
        _activeAlerts.RemoveAll(a => a.Timestamp < cutoff);
        
        return Task.FromResult(_activeAlerts.AsEnumerable());
    }

    public Task<IEnumerable<string>> GenerateOptimizationRecommendationsAsync(PerformanceMetricType metricType, double value)
    {
        var recommendations = new List<string>();

        switch (metricType)
        {
            case PerformanceMetricType.ScanTime:
                recommendations.Add("Enable camera optimization for your device tier");
                recommendations.Add("Preload barcode detection models");
                recommendations.Add("Reduce camera resolution on low-end devices");
                break;
                
            case PerformanceMetricType.ApiResponseTime:
                recommendations.Add("Enable request compression");
                recommendations.Add("Use cached data when available");
                recommendations.Add("Implement request queuing for poor network conditions");
                break;
                
            case PerformanceMetricType.MemoryUsage:
                recommendations.Add("Clear unused cache entries");
                recommendations.Add("Reduce background processing");
                recommendations.Add("Enable garbage collection optimization");
                break;
                
            case PerformanceMetricType.BatteryUsage:
                recommendations.Add("Activate power save mode");
                recommendations.Add("Reduce camera frame rate");
                recommendations.Add("Minimize background sync frequency");
                break;
                
            case PerformanceMetricType.AppStartupTime:
                recommendations.Add("Enable lazy loading for non-essential components");
                recommendations.Add("Prioritize critical path initialization");
                recommendations.Add("Preload frequently used data");
                break;
        }

        return Task.FromResult(recommendations.AsEnumerable());
    }

    private AlertSeverity DetermineSeverity(double actualValue, double threshold)
    {
        var ratio = actualValue / threshold;
        
        if (ratio > 2.0) return AlertSeverity.Critical;
        if (ratio > 1.5) return AlertSeverity.Warning;
        return AlertSeverity.Info;
    }
}
