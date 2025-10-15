using System.Text.Json;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public class OpenFoodFactsService : IOpenFoodFactsService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenFoodFactsService> _logger;
    private const string BaseUrl = "https://world.openfoodfacts.org/api/v2/product";
    private const string UserAgent = "SMARTIES - MAUI - Version 1.0 - https://smarties.app - scan";

    public OpenFoodFactsService(HttpClient httpClient, ILogger<OpenFoodFactsService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        
        // Configure HTTP client
        _httpClient.DefaultRequestHeaders.Add("User-Agent", UserAgent);
        _httpClient.Timeout = TimeSpan.FromSeconds(10);
    }

    public async Task<Product?> GetProductAsync(string barcode, CancellationToken cancellationToken = default)
    {
        try
        {
            // Normalize barcode (pad with zeros to 13 digits)
            var normalizedBarcode = NormalizeBarcode(barcode);
            var url = $"{BaseUrl}/{normalizedBarcode}.json";

            _logger.LogInformation("Fetching product data for barcode: {Barcode}", normalizedBarcode);

            var response = await _httpClient.GetAsync(url, cancellationToken);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("API request failed with status: {StatusCode}", response.StatusCode);
                return null;
            }

            var jsonContent = await response.Content.ReadAsStringAsync(cancellationToken);
            var apiResponse = JsonSerializer.Deserialize<OpenFoodFactsResponse>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (apiResponse?.Status != 1 || apiResponse.Product == null)
            {
                _logger.LogInformation("Product not found in Open Food Facts: {Barcode}", normalizedBarcode);
                return null;
            }

            // Convert API response to our Product model
            var product = MapToProduct(normalizedBarcode, apiResponse.Product);
            
            _logger.LogInformation("Successfully retrieved product: {ProductName}", product.ProductName);
            return product;
        }
        catch (TaskCanceledException)
        {
            _logger.LogWarning("Request timeout for barcode: {Barcode}", barcode);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching product data for barcode: {Barcode}", barcode);
            return null;
        }
    }

    public async Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _httpClient.GetAsync("https://world.openfoodfacts.org", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<List<Product>> SearchProductsAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        try
        {
            // For now, return empty list - full search implementation would require different API endpoint
            _logger.LogInformation("Search not yet implemented for term: {SearchTerm}", searchTerm);
            return new List<Product>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching products for term: {SearchTerm}", searchTerm);
            return new List<Product>();
        }
    }

    private static string NormalizeBarcode(string barcode)
    {
        // Remove any non-numeric characters
        var numericBarcode = new string(barcode.Where(char.IsDigit).ToArray());
        
        // Pad with leading zeros to make it 13 digits (EAN-13 standard)
        return numericBarcode.PadLeft(13, '0');
    }

    private static Product MapToProduct(string barcode, OpenFoodFactsProduct apiProduct)
    {
        return new Product
        {
            Barcode = barcode,
            ProductName = apiProduct.ProductName ?? string.Empty,
            Brand = apiProduct.Brands ?? string.Empty,
            IngredientsText = apiProduct.IngredientsText ?? string.Empty,
            Allergens = apiProduct.Allergens ?? string.Empty,
            ImageUrl = apiProduct.ImageUrl ?? string.Empty,
            NutritionGrades = apiProduct.NutritionGrades ?? string.Empty,
            Categories = apiProduct.Categories ?? string.Empty,
            CachedAt = DateTime.UtcNow,
            IsFromCache = false,
            
            // Nutrition facts
            EnergyKcal = apiProduct.Nutriments?.EnergyKcal,
            Fat = apiProduct.Nutriments?.Fat,
            SaturatedFat = apiProduct.Nutriments?.SaturatedFat,
            Carbohydrates = apiProduct.Nutriments?.Carbohydrates,
            Sugars = apiProduct.Nutriments?.Sugars,
            Fiber = apiProduct.Nutriments?.Fiber,
            Proteins = apiProduct.Nutriments?.Proteins,
            Salt = apiProduct.Nutriments?.Salt,
            Sodium = apiProduct.Nutriments?.Sodium
        };
    }
}