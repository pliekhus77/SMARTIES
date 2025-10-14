using System.IO.Compression;
using System.Text;

namespace SMARTIES.MAUI.Services.Performance;

public interface IDataUsageOptimizationService
{
    Task<byte[]> CompressRequestAsync(string data);
    Task<string> DecompressResponseAsync(byte[] compressedData);
    Task PrioritizeOperationsByBandwidthAsync(IEnumerable<Func<Task>> operations);
    Task<long> EstimateDataUsageAsync(TimeSpan period);
}

public class DataUsageOptimizationService : IDataUsageOptimizationService
{
    private readonly IAdaptiveNetworkService _networkService;
    private long _totalDataUsed = 0;

    public DataUsageOptimizationService(IAdaptiveNetworkService networkService)
    {
        _networkService = networkService;
    }

    public async Task<byte[]> CompressRequestAsync(string data)
    {
        var bytes = Encoding.UTF8.GetBytes(data);
        
        using var output = new MemoryStream();
        using (var gzip = new GZipStream(output, CompressionMode.Compress))
        {
            await gzip.WriteAsync(bytes, 0, bytes.Length);
        }
        
        var compressed = output.ToArray();
        _totalDataUsed += compressed.Length;
        return compressed;
    }

    public async Task<string> DecompressResponseAsync(byte[] compressedData)
    {
        using var input = new MemoryStream(compressedData);
        using var gzip = new GZipStream(input, CompressionMode.Decompress);
        using var output = new MemoryStream();
        
        await gzip.CopyToAsync(output);
        _totalDataUsed += compressedData.Length;
        
        return Encoding.UTF8.GetString(output.ToArray());
    }

    public async Task PrioritizeOperationsByBandwidthAsync(IEnumerable<Func<Task>> operations)
    {
        var quality = await _networkService.AssessNetworkQualityAsync();
        
        if (quality == NetworkQuality.Poor)
        {
            // Execute operations sequentially to avoid overwhelming poor connection
            foreach (var operation in operations)
            {
                await operation();
                await Task.Delay(100); // Small delay between operations
            }
        }
        else
        {
            // Execute operations in parallel for good connections
            var tasks = operations.Select(op => op());
            await Task.WhenAll(tasks);
        }
    }

    public Task<long> EstimateDataUsageAsync(TimeSpan period)
    {
        // Estimate data usage based on historical usage patterns
        var hoursInPeriod = period.TotalHours;
        var estimatedUsage = (long)(hoursInPeriod * (_totalDataUsed / Math.Max(1, DateTime.UtcNow.Hour)));
        
        return Task.FromResult(estimatedUsage);
    }
}
