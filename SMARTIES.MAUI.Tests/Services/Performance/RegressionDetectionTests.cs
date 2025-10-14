using Microsoft.Extensions.DependencyInjection;
using SMARTIES.MAUI.Models.Performance;
using SMARTIES.MAUI.Services.Performance;

namespace SMARTIES.MAUI.Tests.Services.Performance;

public class RegressionDetectionTests
{
    private readonly IServiceProvider _serviceProvider;

    public RegressionDetectionTests()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IPerformanceService, PerformanceService>();
        services.AddSingleton<IDeviceCapabilityService, DeviceCapabilityService>();
        services.AddSingleton<IScanPerformanceService, ScanPerformanceService>();
        services.AddSingleton<IPerformanceBaselineService, PerformanceBaselineService>();
        services.AddSingleton<IAutomatedPerformanceTestingService, AutomatedPerformanceTestingService>();
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task CreateBaselineAsync_ShouldCreateBaseline()
    {
        var service = _serviceProvider.GetRequiredService<IPerformanceBaselineService>();
        
        await service.CreateBaselineAsync(PerformanceMetricType.ScanTime, 2000);
        var baselines = await service.GetBaselinesAsync();
        
        Assert.True(baselines.Any());
        Assert.Contains(baselines, b => b.MetricType == PerformanceMetricType.ScanTime);
    }

    [Fact]
    public async Task DetectRegressionAsync_ShouldDetectRegression()
    {
        var service = _serviceProvider.GetRequiredService<IPerformanceBaselineService>();
        
        await service.CreateBaselineAsync(PerformanceMetricType.ScanTime, 2000);
        var result = await service.DetectRegressionAsync(PerformanceMetricType.ScanTime, 3000);
        
        Assert.True(result.IsRegression);
        Assert.Equal(2000, result.BaselineValue);
        Assert.Equal(3000, result.CurrentValue);
    }

    [Fact]
    public async Task DetectRegressionAsync_ShouldNotDetectRegressionForGoodPerformance()
    {
        var service = _serviceProvider.GetRequiredService<IPerformanceBaselineService>();
        
        await service.CreateBaselineAsync(PerformanceMetricType.ScanTime, 2000);
        var result = await service.DetectRegressionAsync(PerformanceMetricType.ScanTime, 1800);
        
        Assert.False(result.IsRegression);
    }

    [Fact]
    public async Task RunPerformanceTestSuiteAsync_ShouldReturnResults()
    {
        var service = _serviceProvider.GetRequiredService<IAutomatedPerformanceTestingService>();
        
        var results = await service.RunPerformanceTestSuiteAsync();
        
        Assert.True(results.Any());
        Assert.All(results, r => Assert.NotEmpty(r.TestName));
    }

    [Fact]
    public async Task RunScanPerformanceTestAsync_ShouldReturnValidResult()
    {
        var service = _serviceProvider.GetRequiredService<IAutomatedPerformanceTestingService>();
        
        var result = await service.RunScanPerformanceTestAsync();
        
        Assert.Equal("Scan Performance Test", result.TestName);
        Assert.True(result.ActualValue >= 0);
    }

    [Fact]
    public async Task ValidatePerformanceThresholdsAsync_ShouldReturnBoolean()
    {
        var service = _serviceProvider.GetRequiredService<IAutomatedPerformanceTestingService>();
        
        var isValid = await service.ValidatePerformanceThresholdsAsync();
        
        Assert.IsType<bool>(isValid);
    }
}
