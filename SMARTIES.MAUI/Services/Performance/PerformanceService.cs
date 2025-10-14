using System.Diagnostics;
using SMARTIES.MAUI.Models.Performance;

namespace SMARTIES.MAUI.Services.Performance;

public class PerformanceService : IPerformanceService
{
    private readonly List<PerformanceMetric> _metrics = new();

    public async Task<PerformanceMetric> MeasureAsync<T>(Func<Task<T>> operation, PerformanceMetricType metricType)
    {
        var stopwatch = Stopwatch.StartNew();
        await operation();
        stopwatch.Stop();

        var metric = new PerformanceMetric
        {
            Type = metricType,
            Value = stopwatch.ElapsedMilliseconds,
            Unit = "ms"
        };

        await RecordMetricAsync(metric);
        return metric;
    }

    public Task RecordMetricAsync(PerformanceMetric metric)
    {
        _metrics.Add(metric);
        return Task.CompletedTask;
    }

    public Task<IEnumerable<PerformanceMetric>> GetMetricsAsync(PerformanceMetricType? type = null, TimeSpan? timeRange = null)
    {
        var query = _metrics.AsEnumerable();
        
        if (type.HasValue)
            query = query.Where(m => m.Type == type.Value);
            
        if (timeRange.HasValue)
            query = query.Where(m => DateTime.UtcNow - m.Timestamp <= timeRange.Value);
            
        return Task.FromResult(query);
    }
}
