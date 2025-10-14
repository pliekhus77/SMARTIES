using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public interface IOpenFoodFactsService
{
    Task<Product?> GetProductAsync(string barcode, CancellationToken cancellationToken = default);
    Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default);
}