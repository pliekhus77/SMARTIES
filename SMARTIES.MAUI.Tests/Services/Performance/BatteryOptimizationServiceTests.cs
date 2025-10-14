using Microsoft.Extensions.DependencyInjection;
using SMARTIES.MAUI.Services.Performance;

namespace SMARTIES.MAUI.Tests.Services.Performance;

public class BatteryOptimizationServiceTests
{
    private readonly IServiceProvider _serviceProvider;

    public BatteryOptimizationServiceTests()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IDeviceCapabilityService, DeviceCapabilityService>();
        services.AddSingleton<IBatteryOptimizationService, BatteryOptimizationService>();
        services.AddSingleton<IPowerSaveModeService, PowerSaveModeService>();
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task EstimateBatteryImpactAsync_ShouldReturnValidEstimate()
    {
        var service = _serviceProvider.GetRequiredService<IBatteryOptimizationService>();
        
        var impact = await service.EstimateBatteryImpactAsync(TimeSpan.FromHours(1));
        
        Assert.True(impact >= 0 && impact <= 100);
    }

    [Fact]
    public async Task OptimizeCameraUsageAsync_ShouldCompleteSuccessfully()
    {
        var service = _serviceProvider.GetRequiredService<IBatteryOptimizationService>();
        
        await service.OptimizeCameraUsageAsync();
        
        // Test passes if no exception is thrown
        Assert.True(true);
    }

    [Fact]
    public void PowerSaveModeService_ShouldTrackActiveState()
    {
        var service = _serviceProvider.GetRequiredService<IPowerSaveModeService>();
        
        Assert.False(service.IsPowerSaveModeActive);
    }
}
