namespace SMARTIES.MAUI.Services.Performance;

public interface IAppLifecyclePerformanceService
{
    Task HandleAppBackgroundingAsync();
    Task HandleAppResumingAsync();
    Task HandleMemoryPressureAsync();
    Task<TimeSpan> MeasureResumeTimeAsync();
}

public class AppLifecyclePerformanceService : IAppLifecyclePerformanceService
{
    private readonly IBatteryOptimizationService _batteryOptimizationService;
    private readonly IIntelligentCacheService _cacheService;
    private readonly IPerformanceService _performanceService;
    private DateTime _backgroundTime;
    private DateTime _resumeTime;

    public AppLifecyclePerformanceService(
        IBatteryOptimizationService batteryOptimizationService,
        IIntelligentCacheService cacheService,
        IPerformanceService performanceService)
    {
        _batteryOptimizationService = batteryOptimizationService;
        _cacheService = cacheService;
        _performanceService = performanceService;
    }

    public async Task HandleAppBackgroundingAsync()
    {
        _backgroundTime = DateTime.UtcNow;
        
        // Reduce background processing
        await _batteryOptimizationService.ReduceBackgroundProcessingAsync();
        
        // Optimize cache for background state
        await _cacheService.OptimizeCacheSizeAsync();
        
        // Force garbage collection to free memory
        GC.Collect();
        GC.WaitForPendingFinalizers();
    }

    public async Task HandleAppResumingAsync()
    {
        _resumeTime = DateTime.UtcNow;
        
        // Measure resume time
        var resumeTime = await MeasureResumeTimeAsync();
        
        // Record resume performance metric
        await _performanceService.RecordMetricAsync(new Models.Performance.PerformanceMetric
        {
            Type = Models.Performance.PerformanceMetricType.AppStartupTime,
            Value = resumeTime.TotalMilliseconds,
            Unit = "ms"
        });
    }

    public async Task HandleMemoryPressureAsync()
    {
        // Clear non-essential cache entries
        await _cacheService.OptimizeCacheSizeAsync();
        
        // Force garbage collection
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        
        // Reduce background processing
        await _batteryOptimizationService.ReduceBackgroundProcessingAsync();
    }

    public Task<TimeSpan> MeasureResumeTimeAsync()
    {
        if (_backgroundTime == default || _resumeTime == default)
            return Task.FromResult(TimeSpan.Zero);
            
        var resumeTime = _resumeTime - _backgroundTime;
        return Task.FromResult(resumeTime);
    }
}
