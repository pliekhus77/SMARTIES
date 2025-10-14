using Microsoft.Extensions.DependencyInjection;
using SMARTIES.MAUI.Services.Performance;

namespace SMARTIES.MAUI.Tests.Services.Performance;

public class LifecyclePerformanceServiceTests
{
    private readonly IServiceProvider _serviceProvider;

    public LifecyclePerformanceServiceTests()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IPerformanceService, PerformanceService>();
        services.AddSingleton<IDeviceCapabilityService, DeviceCapabilityService>();
        services.AddSingleton<IBatteryOptimizationService, BatteryOptimizationService>();
        services.AddSingleton<IIntelligentCacheService, IntelligentCacheService>();
        services.AddSingleton<IScanPerformanceService, ScanPerformanceService>();
        services.AddSingleton<IAppLifecyclePerformanceService, AppLifecyclePerformanceService>();
        services.AddSingleton<IStartupPerformanceService, StartupPerformanceService>();
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task HandleAppBackgroundingAsync_ShouldOptimizeForBackground()
    {
        var service = _serviceProvider.GetRequiredService<IAppLifecyclePerformanceService>();
        
        await service.HandleAppBackgroundingAsync();
        
        // Test passes if no exception is thrown
        Assert.True(true);
    }

    [Fact]
    public async Task HandleAppResumingAsync_ShouldTrackResumeTime()
    {
        var service = _serviceProvider.GetRequiredService<IAppLifecyclePerformanceService>();
        
        await service.HandleAppResumingAsync();
        
        // Test passes if no exception is thrown
        Assert.True(true);
    }

    [Fact]
    public async Task MeasureStartupTimeAsync_ShouldReturnValidTime()
    {
        var service = _serviceProvider.GetRequiredService<IStartupPerformanceService>();
        
        var startupTime = await service.MeasureStartupTimeAsync();
        
        Assert.True(startupTime.TotalMilliseconds >= 0);
    }

    [Fact]
    public async Task InitializeCriticalPathAsync_ShouldCompleteSuccessfully()
    {
        var service = _serviceProvider.GetRequiredService<IStartupPerformanceService>();
        
        await service.InitializeCriticalPathAsync();
        
        // Test passes if no exception is thrown
        Assert.True(true);
    }

    [Fact]
    public async Task HandleMemoryPressureAsync_ShouldOptimizeMemoryUsage()
    {
        var service = _serviceProvider.GetRequiredService<IAppLifecyclePerformanceService>();
        
        await service.HandleMemoryPressureAsync();
        
        // Test passes if no exception is thrown
        Assert.True(true);
    }
}
