using Microsoft.Extensions.DependencyInjection;
using SMARTIES.MAUI.Models.Performance;
using SMARTIES.MAUI.Services.Performance;

namespace SMARTIES.MAUI.Tests.Services.Performance;

public class TelemetryServiceTests
{
    private readonly IServiceProvider _serviceProvider;

    public TelemetryServiceTests()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IPerformanceService, PerformanceService>();
        services.AddSingleton<IPerformanceTelemetryService, PerformanceTelemetryService>();
        services.AddSingleton<IPerformanceAlertingService, PerformanceAlertingService>();
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task CollectMetricsAsync_ShouldAddMetricsToLocal()
    {
        var service = _serviceProvider.GetRequiredService<IPerformanceTelemetryService>();
        
        await service.CollectMetricsAsync();
        var metrics = await service.GetLocalMetricsAsync();
        
        Assert.True(metrics.Any());
    }

    [Fact]
    public async Task FlushTelemetryAsync_ShouldClearLocalMetrics()
    {
        var service = _serviceProvider.GetRequiredService<IPerformanceTelemetryService>();
        
        await service.CollectMetricsAsync();
        await service.FlushTelemetryAsync();
        var metrics = await service.GetLocalMetricsAsync();
        
        Assert.False(metrics.Any());
    }

    [Fact]
    public async Task GenerateOptimizationRecommendationsAsync_ShouldReturnRecommendations()
    {
        var service = _serviceProvider.GetRequiredService<IPerformanceAlertingService>();
        
        var recommendations = await service.GenerateOptimizationRecommendationsAsync(
            PerformanceMetricType.ScanTime, 5000);
        
        Assert.True(recommendations.Any());
        Assert.Contains(recommendations, r => r.Contains("camera optimization"));
    }

    [Fact]
    public async Task GetActiveAlertsAsync_ShouldReturnEmptyInitially()
    {
        var service = _serviceProvider.GetRequiredService<IPerformanceAlertingService>();
        
        var alerts = await service.GetActiveAlertsAsync();
        
        Assert.False(alerts.Any());
    }
}
