using SMARTIES.MAUI.Models.Performance;

namespace SMARTIES.MAUI.Services.Performance;

public interface IScanResultTrackingService
{
    Task<PerformanceMetric> TrackBarcodeRecognitionAsync(Func<Task> barcodeOperation);
    Task<PerformanceMetric> TrackApiResponseAsync(Func<Task> apiOperation);
    Task<bool> ValidateEndToEndPerformanceAsync(TimeSpan totalTime);
}

public class ScanResultTrackingService : IScanResultTrackingService
{
    private readonly IPerformanceService _performanceService;
    private readonly TimeSpan _maxApiResponseTime = TimeSpan.FromSeconds(2);
    private readonly TimeSpan _maxEndToEndTime = TimeSpan.FromSeconds(3);

    public ScanResultTrackingService(IPerformanceService performanceService)
    {
        _performanceService = performanceService;
    }

    public async Task<PerformanceMetric> TrackBarcodeRecognitionAsync(Func<Task> barcodeOperation)
    {
        return await _performanceService.MeasureAsync(async () =>
        {
            await barcodeOperation();
            return true;
        }, PerformanceMetricType.ScanTime);
    }

    public async Task<PerformanceMetric> TrackApiResponseAsync(Func<Task> apiOperation)
    {
        return await _performanceService.MeasureAsync(async () =>
        {
            await apiOperation();
            return true;
        }, PerformanceMetricType.ApiResponseTime);
    }

    public Task<bool> ValidateEndToEndPerformanceAsync(TimeSpan totalTime)
    {
        return Task.FromResult(totalTime <= _maxEndToEndTime);
    }
}
