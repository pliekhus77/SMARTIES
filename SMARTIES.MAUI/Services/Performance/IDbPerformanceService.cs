using SMARTIES.MAUI.Models.Performance;

namespace SMARTIES.MAUI.Services.Performance;

public interface IDbPerformanceService
{
    Task<T> ExecuteWithMonitoringAsync<T>(Func<Task<T>> dbOperation, string operationName);
    Task OptimizeConnectionPoolAsync();
    Task<IEnumerable<T>> GetPagedResultsAsync<T>(Func<int, int, Task<IEnumerable<T>>> query, int pageSize = 50);
    Task<DbPerformanceMetrics> GetDbMetricsAsync();
}

public class DbPerformanceMetrics
{
    public double AverageQueryTime { get; set; }
    public int ActiveConnections { get; set; }
    public int TotalQueries { get; set; }
    public int SlowQueries { get; set; }
}

public class DbPerformanceService : IDbPerformanceService
{
    private readonly IPerformanceService _performanceService;
    private readonly List<double> _queryTimes = new();
    private int _activeConnections = 0;
    private int _totalQueries = 0;
    private int _slowQueries = 0;
    private readonly double _slowQueryThreshold = 1000; // 1 second

    public DbPerformanceService(IPerformanceService performanceService)
    {
        _performanceService = performanceService;
    }

    public async Task<T> ExecuteWithMonitoringAsync<T>(Func<Task<T>> dbOperation, string operationName)
    {
        _activeConnections++;
        _totalQueries++;

        try
        {
            var metric = await _performanceService.MeasureAsync(dbOperation, PerformanceMetricType.DatabaseQueryTime);
            
            _queryTimes.Add(metric.Value);
            
            if (metric.Value > _slowQueryThreshold)
            {
                _slowQueries++;
            }

            return await dbOperation();
        }
        finally
        {
            _activeConnections--;
        }
    }

    public Task OptimizeConnectionPoolAsync()
    {
        // Simulate connection pool optimization
        // In a real implementation, this would configure SQLite connection pooling
        return Task.CompletedTask;
    }

    public async Task<IEnumerable<T>> GetPagedResultsAsync<T>(Func<int, int, Task<IEnumerable<T>>> query, int pageSize = 50)
    {
        return await ExecuteWithMonitoringAsync(
            () => query(0, pageSize),
            "PagedQuery"
        );
    }

    public Task<DbPerformanceMetrics> GetDbMetricsAsync()
    {
        var metrics = new DbPerformanceMetrics
        {
            AverageQueryTime = _queryTimes.Count > 0 ? _queryTimes.Average() : 0,
            ActiveConnections = _activeConnections,
            TotalQueries = _totalQueries,
            SlowQueries = _slowQueries
        };

        return Task.FromResult(metrics);
    }
}
