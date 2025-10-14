using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public interface ISocialSharingService
{
    Task ShareScanResultAsync(Product product, DietaryAnalysisResult analysis);
    Task ShareProductListAsync(List<Product> products, string listName);
    Task RateProductAsync(string barcode, int rating, string? review = null);
}

public class SocialSharingService : ISocialSharingService
{
    private readonly ILogger<SocialSharingService> _logger;

    public SocialSharingService(ILogger<SocialSharingService> logger)
    {
        _logger = logger;
    }

    public async Task ShareScanResultAsync(Product product, DietaryAnalysisResult analysis)
    {
        try
        {
            var shareText = $"I scanned {product.ProductName} with SMARTIES - {analysis.OverallCompliance} compliance!";
            await Share.RequestAsync(new ShareTextRequest
            {
                Text = shareText,
                Title = "SMARTIES Scan Result"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sharing scan result");
        }
    }

    public async Task ShareProductListAsync(List<Product> products, string listName)
    {
        try
        {
            var productNames = string.Join(", ", products.Take(5).Select(p => p.ProductName));
            var shareText = $"Check out my {listName} list: {productNames}... (via SMARTIES app)";
            
            await Share.RequestAsync(new ShareTextRequest
            {
                Text = shareText,
                Title = listName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sharing product list");
        }
    }

    public async Task RateProductAsync(string barcode, int rating, string? review = null)
    {
        try
        {
            // In a real implementation, this would submit to a community database
            _logger.LogInformation("Product rating submitted: {Barcode} - {Rating}/5", barcode, rating);
            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rating product");
        }
    }
}
