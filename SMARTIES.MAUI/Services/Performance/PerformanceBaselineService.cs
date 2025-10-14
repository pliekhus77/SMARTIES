using SMARTIES.MAUI.Models.Performance;

namespace SMARTIES.MAUI.Services.Performance;

public class PerformanceBaseline
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public PerformanceMetricType MetricType { get; set; }
    public double BaselineValue { get; set; }
    public double Tolerance { get; set; } = 0.1; // 10% tolerance
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string DeviceTier { get; set; } = string.Empty;
}

public class RegressionResult
{
    public bool IsRegression { get; set; }
    public double BaselineValue { get; set; }
    public double CurrentValue { get; set; }
    public double PercentageChange { get; set; }
    public PerformanceMetricType MetricType { get; set; }
}

public interface IPerformanceBaselineService
{
    Task CreateBaselineAsync(PerformanceMetricType metricType, double value);
    Task<RegressionResult> DetectRegressionAsync(PerformanceMetricType metricType, double currentValue);
    Task<IEnumerable<PerformanceBaseline>> GetBaselinesAsync();
    Task UpdateBaselineAsync(PerformanceMetricType metricType, double newValue);
}

public class PerformanceBaselineService : IPerformanceBaselineService
{
    private readonly IDeviceCapabilityService _deviceCapabilityService;
    private readonly List<PerformanceBaseline> _baselines = new();

    public PerformanceBaselineService(IDeviceCapabilityService deviceCapabilityService)
    {
        _deviceCapabilityService = deviceCapabilityService;
    }

    public async Task CreateBaselineAsync(PerformanceMetricType metricType, double value)
    {
        var capabilities = await _deviceCapabilityService.GetDeviceCapabilitiesAsync();
        
        var baseline = new PerformanceBaseline
        {
            MetricType = metricType,
            BaselineValue = value,
            DeviceTier = capabilities.Tier.ToString(),
            Tolerance = GetToleranceForMetric(metricType)
        };

        _baselines.Add(baseline);
    }

    public async Task<RegressionResult> DetectRegressionAsync(PerformanceMetricType metricType, double currentValue)
    {
        var capabilities = await _deviceCapabilityService.GetDeviceCapabilitiesAsync();
        var baseline = _baselines
            .Where(b => b.MetricType == metricType && b.DeviceTier == capabilities.Tier.ToString())
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefault();

        if (baseline == null)
        {
            return new RegressionResult
            {
                IsRegression = false,
                CurrentValue = currentValue,
                MetricType = metricType
            };
        }

        var percentageChange = (currentValue - baseline.BaselineValue) / baseline.BaselineValue;
        var isRegression = Math.Abs(percentageChange) > baseline.Tolerance && 
                          (IsHigherWorse(metricType) ? percentageChange > 0 : percentageChange < 0);

        return new RegressionResult
        {
            IsRegression = isRegression,
            BaselineValue = baseline.BaselineValue,
            CurrentValue = currentValue,
            PercentageChange = percentageChange,
            MetricType = metricType
        };
    }

    public Task<IEnumerable<PerformanceBaseline>> GetBaselinesAsync()
    {
        return Task.FromResult(_baselines.AsEnumerable());
    }

    public async Task UpdateBaselineAsync(PerformanceMetricType metricType, double newValue)
    {
        var capabilities = await _deviceCapabilityService.GetDeviceCapabilitiesAsync();
        var existingBaseline = _baselines
            .FirstOrDefault(b => b.MetricType == metricType && b.DeviceTier == capabilities.Tier.ToString());

        if (existingBaseline != null)
        {
            existingBaseline.BaselineValue = newValue;
            existingBaseline.CreatedAt = DateTime.UtcNow;
        }
        else
        {
            await CreateBaselineAsync(metricType, newValue);
        }
    }

    private double GetToleranceForMetric(PerformanceMetricType metricType)
    {
        return metricType switch
        {
            PerformanceMetricType.ScanTime => 0.15, // 15% tolerance for scan time
            PerformanceMetricType.ApiResponseTime => 0.20, // 20% tolerance for API calls
            PerformanceMetricType.MemoryUsage => 0.10, // 10% tolerance for memory
            PerformanceMetricType.BatteryUsage => 0.25, // 25% tolerance for battery
            PerformanceMetricType.AppStartupTime => 0.15, // 15% tolerance for startup
            _ => 0.10 // Default 10% tolerance
        };
    }

    private bool IsHigherWorse(PerformanceMetricType metricType)
    {
        return metricType switch
        {
            PerformanceMetricType.CacheHitRate => false, // Higher cache hit rate is better
            _ => true // For most metrics, higher values are worse
        };
    }
}
