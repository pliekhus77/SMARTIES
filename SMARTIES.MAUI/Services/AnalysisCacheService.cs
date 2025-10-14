using SQLite;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public interface IAnalysisCacheService
{
    Task<DietaryAnalysis?> GetCachedAnalysisAsync(string barcode, List<DietaryRestrictionType> restrictions);
    Task CacheAnalysisAsync(string barcode, List<DietaryRestrictionType> restrictions, DietaryAnalysis analysis);
    Task InvalidateCacheAsync(string userProfileHash);
    Task CleanExpiredCacheAsync();
}

public class AnalysisCacheService : IAnalysisCacheService
{
    private readonly SQLiteAsyncConnection _database;
    private readonly ILogger<AnalysisCacheService> _logger;

    public AnalysisCacheService(SQLiteAsyncConnection database, ILogger<AnalysisCacheService> logger)
    {
        _database = database;
        _logger = logger;
        InitializeAsync();
    }

    private async void InitializeAsync()
    {
        await _database.CreateTableAsync<AnalysisCache>();
    }

    public async Task<DietaryAnalysis?> GetCachedAnalysisAsync(string barcode, List<DietaryRestrictionType> restrictions)
    {
        try
        {
            var cacheKey = GenerateCacheKey(barcode, restrictions);
            var cached = await _database.Table<AnalysisCache>()
                .Where(c => c.CacheKey == cacheKey && c.ExpiresAt > DateTime.UtcNow)
                .FirstOrDefaultAsync();

            return cached?.Analysis;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve cached analysis for barcode {Barcode}", barcode);
            return null;
        }
    }

    public async Task CacheAnalysisAsync(string barcode, List<DietaryRestrictionType> restrictions, DietaryAnalysis analysis)
    {
        try
        {
            var cacheKey = GenerateCacheKey(barcode, restrictions);
            var userProfileHash = GenerateUserProfileHash(restrictions);

            var cacheEntry = new AnalysisCache
            {
                CacheKey = cacheKey,
                ProductBarcode = barcode,
                UserProfileHash = userProfileHash,
                Analysis = analysis,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            await _database.InsertOrReplaceAsync(cacheEntry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to cache analysis for barcode {Barcode}", barcode);
        }
    }

    public async Task InvalidateCacheAsync(string userProfileHash)
    {
        try
        {
            await _database.Table<AnalysisCache>()
                .Where(c => c.UserProfileHash == userProfileHash)
                .DeleteAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to invalidate cache for profile hash {Hash}", userProfileHash);
        }
    }

    public async Task CleanExpiredCacheAsync()
    {
        try
        {
            await _database.Table<AnalysisCache>()
                .Where(c => c.ExpiresAt <= DateTime.UtcNow)
                .DeleteAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clean expired cache entries");
        }
    }

    private string GenerateCacheKey(string barcode, List<DietaryRestrictionType> restrictions)
    {
        var restrictionsString = string.Join(",", restrictions.OrderBy(r => r));
        var input = $"{barcode}:{restrictionsString}";
        return ComputeHash(input);
    }

    private string GenerateUserProfileHash(List<DietaryRestrictionType> restrictions)
    {
        var restrictionsString = string.Join(",", restrictions.OrderBy(r => r));
        return ComputeHash(restrictionsString);
    }

    private string ComputeHash(string input)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToBase64String(bytes);
    }
}
