using Moq;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Tests.Helpers;

public static class MockServiceFactory
{
    public static Mock<IOpenFoodFactsService> CreateOpenFoodFactsService()
    {
        var mock = new Mock<IOpenFoodFactsService>();
        
        mock.Setup(x => x.GetProductAsync(It.IsAny<string>()))
            .ReturnsAsync(ProductBuilder.Create()
                .WithBarcode("123456789")
                .WithName("Test Product")
                .WithIngredients("water", "sugar")
                .Build());
                
        return mock;
    }

    public static Mock<IDietaryAnalysisService> CreateDietaryAnalysisService()
    {
        var mock = new Mock<IDietaryAnalysisService>();
        
        mock.Setup(x => x.AnalyzeProductAsync(It.IsAny<string>(), It.IsAny<List<string>>(), It.IsAny<List<DietaryRestrictionType>>()))
            .ReturnsAsync(DietaryAnalysisBuilder.Create()
                .WithCompliance(ComplianceLevel.Safe)
                .Build());
                
        return mock;
    }

    public static Mock<IUserProfileService> CreateUserProfileService()
    {
        var mock = new Mock<IUserProfileService>();
        
        mock.Setup(x => x.GetCurrentProfileAsync())
            .ReturnsAsync(UserProfileBuilder.Create()
                .WithName("Test User")
                .WithRestrictions(DietaryRestrictionType.Milk)
                .Build());
                
        return mock;
    }

    public static Mock<IProductCacheService> CreateProductCacheService()
    {
        var mock = new Mock<IProductCacheService>();
        
        mock.Setup(x => x.GetCachedProductAsync(It.IsAny<string>()))
            .ReturnsAsync((Product?)null);
            
        return mock;
    }

    public static Mock<IBarcodeService> CreateBarcodeService()
    {
        var mock = new Mock<IBarcodeService>();
        
        mock.Setup(x => x.StartScanningAsync())
            .Returns(Task.CompletedTask);
            
        return mock;
    }
}
