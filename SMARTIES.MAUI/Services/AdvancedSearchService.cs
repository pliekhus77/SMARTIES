using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;
using System.Text.Json;

namespace SMARTIES.MAUI.Services;

public interface IAdvancedSearchService
{
    Task<SearchResults> SearchProductsAsync(AdvancedSearchCriteria criteria, int pageSize = 20, string? pageToken = null);
    Task<List<Product>> CompareProductsAsync(List<string> barcodes);
    Task<List<Product>> GetAlternativesAsync(string barcode, int profileId);
    Task<List<Product>> SearchLocalCacheAsync(AdvancedSearchCriteria criteria);
}

public class AdvancedSearchService : IAdvancedSearchService
{
    private readonly IOpenFoodFactsService _openFoodFacts;
    private readonly IProductCacheService _productCache;
    private readonly IDietaryAnalysisService _dietaryAnalysis;
    private readonly IUserProfileService _profileService;
    private readonly ILogger<AdvancedSearchService> _logger;

    public AdvancedSearchService(
        IOpenFoodFactsService openFoodFacts,
        IProductCacheService productCache,
        IDietaryAnalysisService dietaryAnalysis,
        IUserProfileService profileService,
        ILogger<AdvancedSearchService> logger)
    {
        _openFoodFacts = openFoodFacts;
        _productCache = productCache;
        _dietaryAnalysis = dietaryAnalysis;
        _profileService = profileService;
        _logger = logger;
    }

    public async Task<SearchResults> SearchProductsAsync(AdvancedSearchCriteria criteria, int pageSize = 20, string? pageToken = null)
    {
        try
        {
            var results = new SearchResults();
            
            // First search local cache
            var localResults = await SearchLocalCacheAsync(criteria);
            
            // Then search Open Food Facts if needed
            var remoteResults = new List<Product>();
            if (!string.IsNullOrEmpty(criteria.Query))
            {
                // Use Open Food Facts search (simplified)
                var searchResults = await _openFoodFacts.SearchProductsAsync(criteria.Query);
                remoteResults = searchResults.Take(pageSize).ToList();
            }

            // Combine and filter results
            var allProducts = localResults.Concat(remoteResults)
                .GroupBy(p => p.Barcode)
                .Select(g => g.First())
                .ToList();

            // Apply dietary filtering if requested
            if (criteria.OnlyCompliant)
            {
                var activeProfile = await _profileService.GetActiveProfileAsync();
                if (activeProfile != null)
                {
                    var filteredProducts = new List<Product>();
                    foreach (var product in allProducts)
                    {
                        var analysis = await _dietaryAnalysis.AnalyzeProductAsync(product, activeProfile);
                        if (analysis.OverallCompliance != ComplianceLevel.Violation)
                        {
                            filteredProducts.Add(product);
                        }
                    }
                    allProducts = filteredProducts;
                }
            }

            // Convert to search results with scoring
            results.Products = allProducts.Select(p => new ProductSearchResult
            {
                Product = p,
                RelevanceScore = CalculateRelevanceScore(p, criteria),
                ComplianceLevel = ComplianceLevel.Safe, // Simplified
                MatchedCriteria = GetMatchedCriteria(p, criteria)
            }).OrderByDescending(r => r.RelevanceScore).ToList();

            results.TotalCount = results.Products.Count;
            
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching products with criteria");
            return new SearchResults();
        }
    }

    public async Task<List<Product>> CompareProductsAsync(List<string> barcodes)
    {
        try
        {
            var products = new List<Product>();
            
            foreach (var barcode in barcodes)
            {
                var product = await _productCache.GetCachedProductAsync(barcode);
                if (product == null)
                {
                    product = await _openFoodFacts.GetProductAsync(barcode);
                    if (product != null)
                    {
                        await _productCache.CacheProductAsync(product);
                    }
                }
                
                if (product != null)
                    products.Add(product);
            }

            return products;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error comparing products");
            return new List<Product>();
        }
    }

    public async Task<List<Product>> GetAlternativesAsync(string barcode, int profileId)
    {
        try
        {
            var originalProduct = await _productCache.GetCachedProductAsync(barcode);
            if (originalProduct == null)
                return new List<Product>();

            // Search for similar products by category
            var criteria = new AdvancedSearchCriteria
            {
                OnlyCompliant = true
            };

            // Extract categories from original product
            if (!string.IsNullOrEmpty(originalProduct.CategoriesJson))
            {
                try
                {
                    var categories = JsonSerializer.Deserialize<List<string>>(originalProduct.CategoriesJson);
                    if (categories?.Any() == true)
                    {
                        criteria.Categories = categories.Take(2).ToList(); // Use top 2 categories
                    }
                }
                catch (JsonException)
                {
                    // Ignore JSON parsing errors
                }
            }

            var searchResults = await SearchProductsAsync(criteria, 10);
            return searchResults.Products
                .Where(p => p.Product.Barcode != barcode) // Exclude original product
                .Select(p => p.Product)
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting alternatives for product: {Barcode}", barcode);
            return new List<Product>();
        }
    }

    public async Task<List<Product>> SearchLocalCacheAsync(AdvancedSearchCriteria criteria)
    {
        try
        {
            var recentProducts = await _productCache.GetRecentProductsAsync(1000);
            var filteredProducts = recentProducts.AsEnumerable();

            // Apply text search
            if (!string.IsNullOrEmpty(criteria.Query))
            {
                var query = criteria.Query.ToLowerInvariant();
                filteredProducts = filteredProducts.Where(p =>
                    (p.ProductName?.ToLowerInvariant().Contains(query) == true) ||
                    (p.Brand?.ToLowerInvariant().Contains(query) == true) ||
                    (p.IngredientsText?.ToLowerInvariant().Contains(query) == true));
            }

            // Apply brand filter
            if (criteria.Brands.Any())
            {
                filteredProducts = filteredProducts.Where(p =>
                    !string.IsNullOrEmpty(p.Brand) &&
                    criteria.Brands.Any(brand => p.Brand.Contains(brand, StringComparison.OrdinalIgnoreCase)));
            }

            return filteredProducts.Take(50).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching local cache");
            return new List<Product>();
        }
    }

    private double CalculateRelevanceScore(Product product, AdvancedSearchCriteria criteria)
    {
        double score = 0.0;

        // Text relevance
        if (!string.IsNullOrEmpty(criteria.Query))
        {
            var query = criteria.Query.ToLowerInvariant();
            if (product.ProductName?.ToLowerInvariant().Contains(query) == true)
                score += 1.0;
            if (product.Brand?.ToLowerInvariant().Contains(query) == true)
                score += 0.5;
        }

        // Brand match
        if (criteria.Brands.Any() && !string.IsNullOrEmpty(product.Brand))
        {
            if (criteria.Brands.Any(brand => product.Brand.Contains(brand, StringComparison.OrdinalIgnoreCase)))
                score += 0.8;
        }

        return Math.Max(score, 0.1); // Minimum score
    }

    private List<string> GetMatchedCriteria(Product product, AdvancedSearchCriteria criteria)
    {
        var matched = new List<string>();

        if (!string.IsNullOrEmpty(criteria.Query) &&
            (product.ProductName?.Contains(criteria.Query, StringComparison.OrdinalIgnoreCase) == true ||
             product.Brand?.Contains(criteria.Query, StringComparison.OrdinalIgnoreCase) == true))
        {
            matched.Add("Text Search");
        }

        if (criteria.Brands.Any() && !string.IsNullOrEmpty(product.Brand) &&
            criteria.Brands.Any(brand => product.Brand.Contains(brand, StringComparison.OrdinalIgnoreCase)))
        {
            matched.Add("Brand");
        }

        return matched;
    }
}
