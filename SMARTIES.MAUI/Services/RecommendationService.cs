using SQLite;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Data;

namespace SMARTIES.MAUI.Services;

public interface IRecommendationService
{
    Task<List<ProductRecommendation>> GetRecommendationsAsync(int profileId, RecommendationType? type = null);
    Task GenerateRecommendationsAsync(int profileId);
    Task RecordFeedbackAsync(int recommendationId, int feedback);
    Task<List<Product>> GetAlternativeProductsAsync(string barcode, int profileId);
}

public class RecommendationService : IRecommendationService
{
    private readonly SQLiteAsyncConnection _database;
    private readonly IProductCacheService _productCache;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(
        AdvancedFeaturesDbService dbService,
        IProductCacheService productCache,
        ILogger<RecommendationService> logger)
    {
        _database = dbService.Database;
        _productCache = productCache;
        _logger = logger;
    }

    public async Task<List<ProductRecommendation>> GetRecommendationsAsync(int profileId, RecommendationType? type = null)
    {
        try
        {
            var query = _database.Table<ProductRecommendation>()
                .Where(r => r.ProfileId == profileId);

            if (type.HasValue)
                query = query.Where(r => r.Type == type.Value);

            return await query
                .OrderByDescending(r => r.Confidence)
                .ThenByDescending(r => r.CreatedAt)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting recommendations for profile: {ProfileId}", profileId);
            return new List<ProductRecommendation>();
        }
    }

    public async Task GenerateRecommendationsAsync(int profileId)
    {
        try
        {
            // Get recent products for collaborative filtering
            var recentProducts = await _productCache.GetRecentProductsAsync(100);
            
            // Generate alternative recommendations
            var alternatives = await GenerateAlternativeRecommendations(profileId, recentProducts);
            
            // Generate similar product recommendations
            var similar = await GenerateSimilarRecommendations(profileId, recentProducts);
            
            // Store recommendations
            var allRecommendations = alternatives.Concat(similar).ToList();
            foreach (var recommendation in allRecommendations)
            {
                await _database.InsertOrReplaceAsync(recommendation);
            }

            _logger.LogInformation("Generated {Count} recommendations for profile: {ProfileId}", 
                allRecommendations.Count, profileId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating recommendations for profile: {ProfileId}", profileId);
        }
    }

    public async Task RecordFeedbackAsync(int recommendationId, int feedback)
    {
        try
        {
            var recommendation = await _database.Table<ProductRecommendation>()
                .Where(r => r.Id == recommendationId)
                .FirstOrDefaultAsync();

            if (recommendation != null)
            {
                recommendation.UserFeedback = feedback;
                await _database.UpdateAsync(recommendation);
                
                _logger.LogInformation("Recorded feedback {Feedback} for recommendation: {Id}", 
                    feedback, recommendationId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording feedback for recommendation: {Id}", recommendationId);
        }
    }

    public async Task<List<Product>> GetAlternativeProductsAsync(string barcode, int profileId)
    {
        try
        {
            var recommendations = await _database.Table<ProductRecommendation>()
                .Where(r => r.ProfileId == profileId && r.Type == RecommendationType.Alternative)
                .OrderByDescending(r => r.Confidence)
                .Take(10)
                .ToListAsync();

            var products = new List<Product>();
            foreach (var rec in recommendations)
            {
                var product = await _productCache.GetCachedProductAsync(rec.ProductBarcode);
                if (product != null)
                    products.Add(product);
            }

            return products;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting alternative products for: {Barcode}", barcode);
            return new List<Product>();
        }
    }

    private async Task<List<ProductRecommendation>> GenerateAlternativeRecommendations(int profileId, List<Product> products)
    {
        var recommendations = new List<ProductRecommendation>();
        
        // Simple algorithm: recommend products from same categories
        foreach (var product in products.Take(20))
        {
            var recommendation = new ProductRecommendation
            {
                ProfileId = profileId,
                ProductBarcode = product.Barcode,
                ProductName = product.ProductName ?? "Unknown Product",
                Type = RecommendationType.Alternative,
                Confidence = 0.7 + (Random.Shared.NextDouble() * 0.3), // 0.7-1.0
                Reasoning = "Similar category product"
            };
            
            recommendations.Add(recommendation);
        }

        return recommendations;
    }

    private async Task<List<ProductRecommendation>> GenerateSimilarRecommendations(int profileId, List<Product> products)
    {
        var recommendations = new List<ProductRecommendation>();
        
        // Simple algorithm: recommend trending products
        foreach (var product in products.Take(15))
        {
            var recommendation = new ProductRecommendation
            {
                ProfileId = profileId,
                ProductBarcode = product.Barcode,
                ProductName = product.ProductName ?? "Unknown Product",
                Type = RecommendationType.Similar,
                Confidence = 0.6 + (Random.Shared.NextDouble() * 0.3), // 0.6-0.9
                Reasoning = "Popular choice"
            };
            
            recommendations.Add(recommendation);
        }

        return recommendations;
    }
}
