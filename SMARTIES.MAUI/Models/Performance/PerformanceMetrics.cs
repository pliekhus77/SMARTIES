namespace SMARTIES.MAUI.Models.Performance;

public enum PerformanceMetricType
{
    ScanTime,
    ApiResponseTime,
    BatteryUsage,
    MemoryUsage,
    CacheHitRate,
    NetworkLatency,
    DatabaseQueryTime,
    AppStartupTime
}

public enum DeviceTier
{
    Low,
    Mid,
    High
}

public class PerformanceMetric
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public PerformanceMetricType Type { get; set; }
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Dictionary<string, object> Properties { get; set; } = new();
}

public class DeviceCapabilities
{
    public DeviceTier Tier { get; set; }
    public int MemoryMB { get; set; }
    public int CpuCores { get; set; }
    public bool HasDedicatedGpu { get; set; }
    public string Platform { get; set; } = string.Empty;
}
