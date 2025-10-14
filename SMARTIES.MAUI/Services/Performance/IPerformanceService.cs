using SMARTIES.MAUI.Models.Performance;

namespace SMARTIES.MAUI.Services.Performance;

public interface IPerformanceService
{
    Task<PerformanceMetric> MeasureAsync<T>(Func<Task<T>> operation, PerformanceMetricType metricType);
    Task RecordMetricAsync(PerformanceMetric metric);
    Task<IEnumerable<PerformanceMetric>> GetMetricsAsync(PerformanceMetricType? type = null, TimeSpan? timeRange = null);
}

public interface IDeviceCapabilityService
{
    Task<DeviceCapabilities> GetDeviceCapabilitiesAsync();
    DeviceTier GetDeviceTier();
    bool IsLowMemoryDevice();
}
