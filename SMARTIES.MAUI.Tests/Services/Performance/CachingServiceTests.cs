using Microsoft.Extensions.DependencyInjection;
using SMARTIES.MAUI.Services.Performance;

namespace SMARTIES.MAUI.Tests.Services.Performance;

public class CachingServiceTests
{
    private readonly IServiceProvider _serviceProvider;

    public CachingServiceTests()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IIntelligentCacheService, IntelligentCacheService>();
        services.AddSingleton<IPredictiveCacheService, PredictiveCacheService>();
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task SetAndGetAsync_ShouldStoreAndRetrieveValue()
    {
        var service = _serviceProvider.GetRequiredService<IIntelligentCacheService>();
        
        await service.SetAsync("test-key", "test-value");
        var result = await service.GetAsync<string>("test-key");
        
        Assert.Equal("test-value", result);
    }

    [Fact]
    public async Task GetStatisticsAsync_ShouldReturnValidStatistics()
    {
        var service = _serviceProvider.GetRequiredService<IIntelligentCacheService>();
        
        await service.SetAsync("key1", "value1");
        await service.GetAsync<string>("key1"); // Hit
        await service.GetAsync<string>("key2"); // Miss
        
        var stats = await service.GetStatisticsAsync();
        
        Assert.True(stats.HitCount > 0);
        Assert.True(stats.MissCount > 0);
        Assert.True(stats.HitRate >= 0 && stats.HitRate <= 1);
    }

    [Fact]
    public async Task OptimizeCacheSizeAsync_ShouldCompleteSuccessfully()
    {
        var service = _serviceProvider.GetRequiredService<IIntelligentCacheService>();
        
        await service.OptimizeCacheSizeAsync();
        
        // Test passes if no exception is thrown
        Assert.True(true);
    }

    [Fact]
    public async Task PredictiveCacheService_ShouldTrackFrequentKeys()
    {
        var service = _serviceProvider.GetRequiredService<IPredictiveCacheService>();
        
        var keys = await service.GetFrequentlyAccessedKeysAsync();
        
        Assert.NotNull(keys);
    }
}
