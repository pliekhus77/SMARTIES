using SMARTIES.Console.Models;

namespace SMARTIES.Console.Services;

public interface IOpenFoodFactsService
{
    Task<Product?> GetProductAsync(string barcode, CancellationToken cancellationToken = default);
    Task<bool> IsServiceAvailableAsync(CancellationToken cancellationToken = default);
}