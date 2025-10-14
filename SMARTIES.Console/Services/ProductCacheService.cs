using SQLite;
using Microsoft.Extensions.Logging;
using SMARTIES.Console.Models;

namespace SMARTIES.Console.Services;

public class ProductCacheService : IProductCacheService
{
    private readonly SQLiteAsyncConnection _database;
    private readonly ILogger<ProductCacheService> _logger;
    private readonly TimeSpan _cacheExpiry = TimeSpan.FromDays(7); // Cache products for 7 days

    public ProductCacheService(ILogger<ProductCacheService> logger)
    {
        _logger = logger;
        var dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "SMARTIES", "smarties.db3");
        Directory.CreateDirectory(Path.GetDirectoryName(dbPath)!);
        _database = new SQLiteAsyncConnection(dbPath);
        
        // Initialize database
        _ = Task.Run(async () =>
        {
            await _database.CreateTableAsync<Product>();
        });
    }

    public async Task<Product?> GetCachedProductAsync(string barcode)
    {
        try
        {
            var product = await _database.Table<Product>()
                .Where(p => p.Barcode == barcode)
                .FirstOrDefaultAsync();

            if (product != null)
            {
                // Check if cache is still valid
                if (DateTime.UtcNow - product.CachedAt > _cacheExpiry)
                {
                    _logger.LogInformation("Cached product expired for barcode: {Barcode}", barcode);
                    await _database.DeleteAsync<Product>(barcode);
                    return null;
                }

                product.IsFromCache = true;
                _logger.LogInformation("Retrieved cached product: {ProductName}", product.ProductName);
                return product;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cached product for barcode: {Barcode}", barcode);
            return null;
        }
    }

    public async Task CacheProductAsync(Product product)
    {
        try
        {
            product.CachedAt = DateTime.UtcNow;
            product.IsFromCache = false;

            // Use InsertOrReplace to handle both new and updated products
            await _database.InsertOrReplaceAsync(product);
            
            _logger.LogInformation("Cached product: {ProductName} (Barcode: {Barcode})", 
                product.ProductName, product.Barcode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error caching product: {ProductName} (Barcode: {Barcode})", 
                product.ProductName, product.Barcode);
        }
    }

    public async Task<List<Product>> GetRecentProductsAsync(int count = 50)
    {
        try
        {
            var products = await _database.Table<Product>()
                .OrderByDescending(p => p.CachedAt)
                .Take(count)
                .ToListAsync();

            // Mark all as from cache
            foreach (var product in products)
            {
                product.IsFromCache = true;
            }

            return products;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving recent products");
            return new List<Product>();
        }
    }

    public async Task ClearExpiredCacheAsync()
    {
        try
        {
            var expiredDate = DateTime.UtcNow - _cacheExpiry;
            var expiredProducts = await _database.Table<Product>()
                .Where(p => p.CachedAt < expiredDate)
                .ToListAsync();

            foreach (var product in expiredProducts)
            {
                await _database.DeleteAsync<Product>(product.Barcode);
            }

            if (expiredProducts.Any())
            {
                _logger.LogInformation("Cleared {Count} expired products from cache", expiredProducts.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing expired cache");
        }
    }

    public async Task<bool> IsProductCachedAsync(string barcode)
    {
        try
        {
            var product = await _database.Table<Product>()
                .Where(p => p.Barcode == barcode)
                .FirstOrDefaultAsync();

            if (product == null)
                return false;

            // Check if cache is still valid
            return DateTime.UtcNow - product.CachedAt <= _cacheExpiry;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if product is cached for barcode: {Barcode}", barcode);
            return false;
        }
    }
}