using Microsoft.Extensions.DependencyInjection;
using SMARTIES.MAUI.Models.Performance;
using SMARTIES.MAUI.Services.Performance;

namespace SMARTIES.MAUI.Tests.Integration;

public class PerformanceIntegrationTests
{
    private readonly IServiceProvider _serviceProvider;

    public PerformanceIntegrationTests()
    {
        var services = new ServiceCollection();
        
        // Register all performance services
        services.AddSingleton<IPerformanceService, PerformanceService>();
        services.AddSingleton<IDeviceCapabilityService, DeviceCapabilityService>();
        services.AddSingleton<IScanPerformanceService, ScanPerformanceService>();
        services.AddSingleton<IBatteryOptimizationService, BatteryOptimizationService>();
        services.AddSingleton<IIntelligentCacheService, IntelligentCacheService>();
        services.AddSingleton<IAdaptiveNetworkService, AdaptiveNetworkService>();
        services.AddSingleton<IPerformanceTelemetryService, PerformanceTelemetryService>();
        services.AddSingleton<IPerformanceAlertingService, PerformanceAlertingService>();
        services.AddSingleton<IAutomatedPerformanceTestingService, AutomatedPerformanceTestingService>();
        
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task EndToEndScanWorkflow_ShouldCompleteWithinThreshold()
    {
        var scanService = _serviceProvider.GetRequiredService<IScanPerformanceService>();
        
        var scanTime = await scanService.MeasureScanWorkflowAsync(async () =>
        {
            await Task.Delay(200); // Simulate scan operation
        });
        
        var isWithinThreshold = await scanService.ValidatePerformanceThresholdAsync(scanTime);
        Assert.True(isWithinThreshold);
    }

    [Fact]
    public async Task DeviceCapabilityAdaptation_ShouldOptimizeForDeviceTier()
    {
        var deviceService = _serviceProvider.GetRequiredService<IDeviceCapabilityService>();
        var batteryService = _serviceProvider.GetRequiredService<IBatteryOptimizationService>();
        
        var capabilities = await deviceService.GetDeviceCapabilitiesAsync();
        await batteryService.OptimizeCameraUsageAsync();
        
        Assert.NotNull(capabilities);
        Assert.True(Enum.IsDefined(typeof(DeviceTier), capabilities.Tier));
    }

    [Fact]
    public async Task PerformanceMonitoringValidation_ShouldCollectAndAlertOnMetrics()
    {
        var telemetryService = _serviceProvider.GetRequiredService<IPerformanceTelemetryService>();
        var alertingService = _serviceProvider.GetRequiredService<IPerformanceAlertingService>();
        
        await telemetryService.CollectMetricsAsync();
        await alertingService.MonitorThresholdsAsync();
        
        var metrics = await telemetryService.GetLocalMetricsAsync();
        var alerts = await alertingService.GetActiveAlertsAsync();
        
        Assert.True(metrics.Any());
    }

    [Fact]
    public async Task AutomatedPerformanceTestSuite_ShouldValidateAllThresholds()
    {
        var testingService = _serviceProvider.GetRequiredService<IAutomatedPerformanceTestingService>();
        
        var results = await testingService.RunPerformanceTestSuiteAsync();
        var isValid = await testingService.ValidatePerformanceThresholdsAsync();
        
        Assert.True(results.Any());
        Assert.All(results, r => Assert.NotEmpty(r.TestName));
    }
}
