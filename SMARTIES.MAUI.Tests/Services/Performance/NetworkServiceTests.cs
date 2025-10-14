using Microsoft.Extensions.DependencyInjection;
using SMARTIES.MAUI.Services.Performance;

namespace SMARTIES.MAUI.Tests.Services.Performance;

public class NetworkServiceTests
{
    private readonly IServiceProvider _serviceProvider;

    public NetworkServiceTests()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IAdaptiveNetworkService, AdaptiveNetworkService>();
        services.AddSingleton<IDataUsageOptimizationService, DataUsageOptimizationService>();
        _serviceProvider = services.BuildServiceProvider();
    }

    [Fact]
    public async Task AssessNetworkQualityAsync_ShouldReturnValidQuality()
    {
        var service = _serviceProvider.GetRequiredService<IAdaptiveNetworkService>();
        
        var quality = await service.AssessNetworkQualityAsync();
        
        Assert.True(Enum.IsDefined(typeof(NetworkQuality), quality));
    }

    [Fact]
    public async Task GetAdaptiveTimeoutAsync_ShouldReturnPositiveTimespan()
    {
        var service = _serviceProvider.GetRequiredService<IAdaptiveNetworkService>();
        
        var timeout = await service.GetAdaptiveTimeoutAsync();
        
        Assert.True(timeout.TotalSeconds > 0);
    }

    [Fact]
    public async Task CompressRequestAsync_ShouldReduceDataSize()
    {
        var service = _serviceProvider.GetRequiredService<IDataUsageOptimizationService>();
        var testData = new string('A', 1000); // 1000 character string
        
        var compressed = await service.CompressRequestAsync(testData);
        
        Assert.True(compressed.Length < testData.Length);
    }

    [Fact]
    public async Task DecompressResponseAsync_ShouldRestoreOriginalData()
    {
        var service = _serviceProvider.GetRequiredService<IDataUsageOptimizationService>();
        var originalData = "Test data for compression";
        
        var compressed = await service.CompressRequestAsync(originalData);
        var decompressed = await service.DecompressResponseAsync(compressed);
        
        Assert.Equal(originalData, decompressed);
    }
}
