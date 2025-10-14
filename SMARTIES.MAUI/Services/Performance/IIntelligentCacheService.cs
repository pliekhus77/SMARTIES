namespace SMARTIES.MAUI.Services.Performance;

public interface IIntelligentCacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null);
    Task RemoveAsync(string key);
    Task<CacheStatistics> GetStatisticsAsync();
    Task OptimizeCacheSizeAsync();
}

public class CacheStatistics
{
    public int TotalItems { get; set; }
    public long TotalSizeBytes { get; set; }
    public double HitRate { get; set; }
    public int HitCount { get; set; }
    public int MissCount { get; set; }
}

public class IntelligentCacheService : IIntelligentCacheService
{
    private readonly Dictionary<string, CacheItem> _cache = new();
    private readonly int _maxItems = 1000;
    private int _hitCount = 0;
    private int _missCount = 0;

    public Task<T?> GetAsync<T>(string key)
    {
        if (_cache.TryGetValue(key, out var item) && !item.IsExpired)
        {
            item.LastAccessed = DateTime.UtcNow;
            _hitCount++;
            return Task.FromResult((T?)item.Value);
        }

        _missCount++;
        return Task.FromResult(default(T));
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        if (_cache.Count >= _maxItems)
        {
            EvictLeastRecentlyUsed();
        }

        _cache[key] = new CacheItem
        {
            Value = value,
            CreatedAt = DateTime.UtcNow,
            LastAccessed = DateTime.UtcNow,
            ExpiresAt = expiry.HasValue ? DateTime.UtcNow.Add(expiry.Value) : null
        };

        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key)
    {
        _cache.Remove(key);
        return Task.CompletedTask;
    }

    public Task<CacheStatistics> GetStatisticsAsync()
    {
        var totalRequests = _hitCount + _missCount;
        var hitRate = totalRequests > 0 ? (double)_hitCount / totalRequests : 0;

        return Task.FromResult(new CacheStatistics
        {
            TotalItems = _cache.Count,
            HitRate = hitRate,
            HitCount = _hitCount,
            MissCount = _missCount
        });
    }

    public Task OptimizeCacheSizeAsync()
    {
        // Remove expired items
        var expiredKeys = _cache.Where(kvp => kvp.Value.IsExpired).Select(kvp => kvp.Key).ToList();
        foreach (var key in expiredKeys)
        {
            _cache.Remove(key);
        }

        return Task.CompletedTask;
    }

    private void EvictLeastRecentlyUsed()
    {
        var lruKey = _cache.OrderBy(kvp => kvp.Value.LastAccessed).First().Key;
        _cache.Remove(lruKey);
    }

    private class CacheItem
    {
        public object? Value { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastAccessed { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public bool IsExpired => ExpiresAt.HasValue && DateTime.UtcNow > ExpiresAt.Value;
    }
}
