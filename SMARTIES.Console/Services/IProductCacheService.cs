using SMARTIES.Console.Models;

namespace SMARTIES.Console.Services;

public interface IProductCacheService
{
    Task<Product?> GetCachedProductAsync(string barcode);
    Task CacheProductAsync(Product product);
    Task<List<Product>> GetRecentProductsAsync(int count = 50);
    Task ClearExpiredCacheAsync();
    Task<bool> IsProductCachedAsync(string barcode);
}