using SMARTIES.Console.Models;

namespace SMARTIES.Console.Services;

public interface IDietaryAnalysisService
{
    Task<DietaryAnalysis> AnalyzeProductAsync(Product product, UserProfile userProfile, CancellationToken cancellationToken = default);
    Task<DietaryAnalysis> AnalyzeProductOfflineAsync(Product product, UserProfile userProfile);
}