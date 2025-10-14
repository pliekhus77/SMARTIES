namespace SMARTIES.MAUI.Services.Performance;

public interface IPredictiveCacheService
{
    Task StartBackgroundRefreshAsync();
    Task PreloadFrequentDataAsync();
    Task InvalidateCacheAsync(string pattern);
    Task<IEnumerable<string>> GetFrequentlyAccessedKeysAsync();
}

public class PredictiveCacheService : IPredictiveCacheService
{
    private readonly IIntelligentCacheService _cacheService;
    private readonly Dictionary<string, int> _accessFrequency = new();
    private readonly Timer _backgroundRefreshTimer;

    public PredictiveCacheService(IIntelligentCacheService cacheService)
    {
        _cacheService = cacheService;
        _backgroundRefreshTimer = new Timer(BackgroundRefreshCallback, null, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5));
    }

    public Task StartBackgroundRefreshAsync()
    {
        // Background refresh is handled by the timer
        return Task.CompletedTask;
    }

    public async Task PreloadFrequentDataAsync()
    {
        var frequentKeys = await GetFrequentlyAccessedKeysAsync();
        
        foreach (var key in frequentKeys.Take(10)) // Preload top 10 most frequent
        {
            // Simulate preloading frequently accessed data
            await Task.Delay(10);
        }
    }

    public Task InvalidateCacheAsync(string pattern)
    {
        // Remove cache entries matching pattern
        var keysToRemove = _accessFrequency.Keys.Where(k => k.Contains(pattern)).ToList();
        
        foreach (var key in keysToRemove)
        {
            _accessFrequency.Remove(key);
        }
        
        return Task.CompletedTask;
    }

    public Task<IEnumerable<string>> GetFrequentlyAccessedKeysAsync()
    {
        var frequentKeys = _accessFrequency
            .OrderByDescending(kvp => kvp.Value)
            .Select(kvp => kvp.Key)
            .Take(20);
            
        return Task.FromResult(frequentKeys);
    }

    private async void BackgroundRefreshCallback(object? state)
    {
        try
        {
            await _cacheService.OptimizeCacheSizeAsync();
            await PreloadFrequentDataAsync();
        }
        catch
        {
            // Log error but don't crash background process
        }
    }

    public void TrackAccess(string key)
    {
        _accessFrequency[key] = _accessFrequency.GetValueOrDefault(key, 0) + 1;
    }
}
