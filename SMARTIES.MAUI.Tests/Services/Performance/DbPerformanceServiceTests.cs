using Microsoft.Extensions.DependencyInjection;
using SMARTIES.MAUI.Services.Performance;

namespace SMARTIES.MAUI.Tests.Services.Performance;

public class DbPerformanceServiceTests
{
    private readonly IServiceProvider _serviceProvider;

    public DbPerformanceServiceTests()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IPerformanceService, PerformanceService>();
        services.AddSingleton<IDbPerformanceService, DbPerformanceService>();
        services.AddSingleton<IDbMaintenanceService, DbMaintenanceService>();
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task ExecuteWithMonitoringAsync_ShouldTrackQueryTime()
    {
        var service = _serviceProvider.GetRequiredService<IDbPerformanceService>();
        
        var result = await service.ExecuteWithMonitoringAsync(async () =>
        {
            await Task.Delay(100);
            return "test-result";
        }, "TestQuery");
        
        Assert.Equal("test-result", result);
        
        var metrics = await service.GetDbMetricsAsync();
        Assert.True(metrics.TotalQueries > 0);
    }

    [Fact]
    public async Task GetDbMetricsAsync_ShouldReturnValidMetrics()
    {
        var service = _serviceProvider.GetRequiredService<IDbPerformanceService>();
        
        var metrics = await service.GetDbMetricsAsync();
        
        Assert.True(metrics.TotalQueries >= 0);
        Assert.True(metrics.ActiveConnections >= 0);
        Assert.True(metrics.SlowQueries >= 0);
    }

    [Fact]
    public async Task GetPagedResultsAsync_ShouldReturnResults()
    {
        var service = _serviceProvider.GetRequiredService<IDbPerformanceService>();
        
        var results = await service.GetPagedResultsAsync<string>((offset, limit) =>
        {
            return Task.FromResult(new[] { "item1", "item2", "item3" }.AsEnumerable());
        });
        
        Assert.True(results.Any());
    }

    [Fact]
    public async Task GetOptimizationRecommendationsAsync_ShouldReturnRecommendations()
    {
        var service = _serviceProvider.GetRequiredService<IDbMaintenanceService>();
        
        var recommendations = await service.GetOptimizationRecommendationsAsync();
        
        Assert.NotNull(recommendations);
    }
}
