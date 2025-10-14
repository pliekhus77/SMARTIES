using Microsoft.Extensions.DependencyInjection;
using SMARTIES.MAUI.Models.Performance;
using SMARTIES.MAUI.Services.Performance;

namespace SMARTIES.MAUI.Tests.Services.Performance;

public class ScanPerformanceServiceTests
{
    private readonly IServiceProvider _serviceProvider;

    public ScanPerformanceServiceTests()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IPerformanceService, PerformanceService>();
        services.AddSingleton<IDeviceCapabilityService, DeviceCapabilityService>();
        services.AddSingleton<IScanPerformanceService, ScanPerformanceService>();
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task MeasureScanWorkflowAsync_ShouldReturnValidTimeSpan()
    {
        var service = _serviceProvider.GetRequiredService<IScanPerformanceService>();
        
        var result = await service.MeasureScanWorkflowAsync(async () => await Task.Delay(100));
        
        Assert.True(result.TotalMilliseconds >= 100);
    }

    [Fact]
    public async Task ValidatePerformanceThresholdAsync_ShouldReturnTrueForFastScans()
    {
        var service = _serviceProvider.GetRequiredService<IScanPerformanceService>();
        
        var result = await service.ValidatePerformanceThresholdAsync(TimeSpan.FromSeconds(2));
        
        Assert.True(result);
    }

    [Fact]
    public async Task ValidatePerformanceThresholdAsync_ShouldReturnFalseForSlowScans()
    {
        var service = _serviceProvider.GetRequiredService<IScanPerformanceService>();
        
        var result = await service.ValidatePerformanceThresholdAsync(TimeSpan.FromSeconds(5));
        
        Assert.False(result);
    }
}
