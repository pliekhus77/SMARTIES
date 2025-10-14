using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SMARTIES.Console.Services;
using SMARTIES.Console.Models;

namespace SMARTIES.Console;

class Program
{
    static async Task Main(string[] args)
    {
        // Setup dependency injection
        var services = new ServiceCollection();
        
        // Add logging
        services.AddLogging(builder => builder.AddConsole().SetMinimumLevel(LogLevel.Information));
        
        // Add HTTP client
        services.AddHttpClient();
        
        // Add our services
        services.AddSingleton<IOpenFoodFactsService, OpenFoodFactsService>();
        services.AddSingleton<IDietaryAnalysisService, DietaryAnalysisService>();
        services.AddSingleton<IUserProfileService, UserProfileService>();
        services.AddSingleton<IProductCacheService, ProductCacheService>();
        
        var serviceProvider = services.BuildServiceProvider();
        var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
        
        logger.LogInformation("🚀 SMARTIES Console Application Starting...");
        
        // Test the core functionality
        await TestCoreServices(serviceProvider, logger);
        
        logger.LogInformation("✅ SMARTIES Console Application Complete!");
    }
    
    private static async Task TestCoreServices(ServiceProvider serviceProvider, ILogger logger)
    {
        try
        {
            // Test Open Food Facts API
            logger.LogInformation("🔍 Testing Open Food Facts API...");
            var openFoodFactsService = serviceProvider.GetRequiredService<IOpenFoodFactsService>();
            
            // Test with Coca Cola barcode
            var testBarcode = "5449000000996";
            var product = await openFoodFactsService.GetProductAsync(testBarcode);
            
            if (product != null)
            {
                logger.LogInformation("✅ Product found: {ProductName} by {Brand}", product.ProductName, product.Brand);
                logger.LogInformation("📋 Ingredients: {Ingredients}", product.IngredientsText);
                
                // Test user profile service
                logger.LogInformation("👤 Testing User Profile Service...");
                var userProfileService = serviceProvider.GetRequiredService<IUserProfileService>();
                var activeProfile = await userProfileService.GetActiveProfileAsync();
                
                if (activeProfile != null)
                {
                    logger.LogInformation("✅ Active profile: {ProfileName}", activeProfile.Name);
                    
                    // Test dietary analysis
                    logger.LogInformation("🧠 Testing Dietary Analysis...");
                    var dietaryAnalysisService = serviceProvider.GetRequiredService<IDietaryAnalysisService>();
                    var analysis = await dietaryAnalysisService.AnalyzeProductAsync(product, activeProfile);
                    
                    logger.LogInformation("📊 Analysis Result: {Compliance} - {Summary}", 
                        analysis.OverallCompliance, analysis.Summary);
                    
                    if (analysis.Violations.Any())
                    {
                        logger.LogWarning("⚠️ Found {ViolationCount} violations:", analysis.Violations.Count);
                        foreach (var violation in analysis.Violations)
                        {
                            logger.LogWarning("  - {RestrictionName}: {Reason}", violation.RestrictionName, violation.Reason);
                        }
                    }
                    
                    if (analysis.Warnings.Any())
                    {
                        logger.LogInformation("ℹ️ Found {WarningCount} warnings:", analysis.Warnings.Count);
                        foreach (var warning in analysis.Warnings)
                        {
                            logger.LogInformation("  - {RestrictionName}: {Message}", warning.RestrictionName, warning.Message);
                        }
                    }
                }
                else
                {
                    logger.LogWarning("❌ No active user profile found");
                }
                
                // Test product caching
                logger.LogInformation("💾 Testing Product Cache...");
                var productCacheService = serviceProvider.GetRequiredService<IProductCacheService>();
                await productCacheService.CacheProductAsync(product);
                
                var cachedProduct = await productCacheService.GetCachedProductAsync(testBarcode);
                if (cachedProduct != null)
                {
                    logger.LogInformation("✅ Product successfully cached and retrieved");
                }
                else
                {
                    logger.LogWarning("❌ Product caching failed");
                }
            }
            else
            {
                logger.LogWarning("❌ Product not found for barcode: {Barcode}", testBarcode);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Error testing core services");
        }
    }
}