using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Services.Performance;
using Xunit;

namespace SMARTIES.MAUI.Tests;

public class SplashScreenIntegrationTests
{
    private readonly ServiceProvider _serviceProvider;

    public SplashScreenIntegrationTests()
    {
        var services = new ServiceCollection();
        
        // Register required services
        services.AddLogging(builder => builder.AddConsole());
        services.AddSingleton<ISplashScreenService, SplashScreenService>();
        services.AddSingleton<ISplashScreenAccessibilityService, SplashScreenAccessibilityService>();
        services.AddSingleton<IStartupPerformanceService, StartupPerformanceService>();
        services.AddSingleton<IPerformanceService, PerformanceService>();
        services.AddSingleton<IDeviceCapabilityService, DeviceCapabilityService>();
        
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task SplashScreen_ShouldCompleteWithinTimeLimit()
    {
        // Arrange
        var splashScreenService = _serviceProvider.GetRequiredService<ISplashScreenService>();
        var completionTcs = new TaskCompletionSource<SplashScreenEventArgs>();
        
        splashScreenService.SplashScreenCompleted += (sender, args) =>
        {
            completionTcs.SetResult(args);
        };

        // Act
        var startTime = DateTime.UtcNow;
        await splashScreenService.InitializeAsync();
        
        var showTask = splashScreenService.ShowSplashScreenAsync();
        var completionArgs = await completionTcs.Task;
        await showTask;
        
        var totalTime = DateTime.UtcNow - startTime;

        // Assert
        Assert.True(totalTime.TotalSeconds <= 5, $"Splash screen took {totalTime.TotalSeconds} seconds, expected <= 5");
        Assert.True(completionArgs.DisplayDuration.TotalSeconds >= 1, "Splash screen should display for at least 1 second");
        Assert.Null(completionArgs.Error);
    }

    [Fact]
    public async Task AccessibilityService_ShouldHandleAnnouncementsGracefully()
    {
        // Arrange
        var accessibilityService = _serviceProvider.GetRequiredService<ISplashScreenAccessibilityService>();

        // Act & Assert - Should not throw
        await accessibilityService.AnnounceAppLoadingAsync();
        await accessibilityService.AnnounceAppReadyAsync();
        
        var isHighContrast = accessibilityService.IsHighContrastModeEnabled();
        Assert.False(isHighContrast); // Default implementation returns false
    }

    public void Dispose()
    {
        _serviceProvider?.Dispose();
    }
}
