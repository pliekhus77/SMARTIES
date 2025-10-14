using SMARTIES.MAUI.Models.Performance;

namespace SMARTIES.MAUI.Services.Performance;

public interface IPerformanceTelemetryService
{
    Task CollectMetricsAsync();
    Task FlushTelemetryAsync();
    Task<IEnumerable<PerformanceMetric>> GetLocalMetricsAsync(TimeSpan? timeRange = null);
    Task ClearLocalMetricsAsync();
}

public class PerformanceTelemetryService : IPerformanceTelemetryService
{
    private readonly IPerformanceService _performanceService;
    private readonly List<PerformanceMetric> _localMetrics = new();
    private readonly Timer _collectionTimer;

    public PerformanceTelemetryService(IPerformanceService performanceService)
    {
        _performanceService = performanceService;
        _collectionTimer = new Timer(CollectMetricsCallback, null, TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(1));
    }

    public async Task CollectMetricsAsync()
    {
        // Collect system metrics
        var memoryMetric = new PerformanceMetric
        {
            Type = PerformanceMetricType.MemoryUsage,
            Value = GC.GetTotalMemory(false) / (1024 * 1024), // MB
            Unit = "MB"
        };

        var appStartupMetric = new PerformanceMetric
        {
            Type = PerformanceMetricType.AppStartupTime,
            Value = Environment.TickCount64,
            Unit = "ms"
        };

        _localMetrics.Add(memoryMetric);
        _localMetrics.Add(appStartupMetric);

        await _performanceService.RecordMetricAsync(memoryMetric);
        await _performanceService.RecordMetricAsync(appStartupMetric);
    }

    public async Task FlushTelemetryAsync()
    {
        if (_localMetrics.Count == 0) return;

        try
        {
            // In a real implementation, this would send to Application Insights or similar
            // For now, we'll simulate the flush operation
            await Task.Delay(100);
            
            // Clear local metrics after successful flush
            _localMetrics.Clear();
        }
        catch
        {
            // Keep metrics locally if flush fails
        }
    }

    public Task<IEnumerable<PerformanceMetric>> GetLocalMetricsAsync(TimeSpan? timeRange = null)
    {
        var query = _localMetrics.AsEnumerable();
        
        if (timeRange.HasValue)
        {
            var cutoff = DateTime.UtcNow - timeRange.Value;
            query = query.Where(m => m.Timestamp >= cutoff);
        }
        
        return Task.FromResult(query);
    }

    public Task ClearLocalMetricsAsync()
    {
        _localMetrics.Clear();
        return Task.CompletedTask;
    }

    private async void CollectMetricsCallback(object? state)
    {
        try
        {
            await CollectMetricsAsync();
            
            // Flush every 10 collections
            if (_localMetrics.Count >= 20)
            {
                await FlushTelemetryAsync();
            }
        }
        catch
        {
            // Log error but don't crash background process
        }
    }
}
