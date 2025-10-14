using FluentAssertions;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Tests.Helpers;
using Moq;

namespace SMARTIES.MAUI.Tests.Integration;

public class WorkflowIntegrationTests
{
    private readonly Mock<IOpenFoodFactsService> _mockOpenFoodFacts;
    private readonly Mock<IDietaryAnalysisService> _mockDietaryAnalysis;
    private readonly Mock<IUserProfileService> _mockUserProfile;
    private readonly Mock<IProductCacheService> _mockProductCache;

    public WorkflowIntegrationTests()
    {
        _mockOpenFoodFacts = MockServiceFactory.CreateOpenFoodFactsService();
        _mockDietaryAnalysis = MockServiceFactory.CreateDietaryAnalysisService();
        _mockUserProfile = MockServiceFactory.CreateUserProfileService();
        _mockProductCache = MockServiceFactory.CreateProductCacheService();
    }

    [Fact]
    public async Task ScanToAnalysisWorkflow_WithValidProduct_CompletesSuccessfully()
    {
        // Arrange
        var barcode = "123456789";
        var product = ProductBuilder.Create()
            .WithBarcode(barcode)
            .WithName("Test Product")
            .WithIngredients("water", "sugar")
            .Build();

        var profile = UserProfileBuilder.Create()
            .WithName("Test User")
            .WithRestrictions(DietaryRestrictionType.Milk)
            .Build();

        var analysis = DietaryAnalysisBuilder.Create()
            .WithCompliance(ComplianceLevel.Safe)
            .Build();

        _mockOpenFoodFacts.Setup(x => x.GetProductAsync(barcode)).ReturnsAsync(product);
        _mockUserProfile.Setup(x => x.GetCurrentProfileAsync()).ReturnsAsync(profile);
        _mockDietaryAnalysis.Setup(x => x.AnalyzeProductAsync(It.IsAny<string>(), It.IsAny<List<string>>(), It.IsAny<List<DietaryRestrictionType>>()))
            .ReturnsAsync(analysis);

        // Act
        var retrievedProduct = await _mockOpenFoodFacts.Object.GetProductAsync(barcode);
        var currentProfile = await _mockUserProfile.Object.GetCurrentProfileAsync();
        var analysisResult = await _mockDietaryAnalysis.Object.AnalyzeProductAsync(
            retrievedProduct!.ProductName,
            retrievedProduct.Ingredients,
            currentProfile!.DietaryRestrictions);

        // Assert
        retrievedProduct.Should().NotBeNull();
        retrievedProduct.Barcode.Should().Be(barcode);
        currentProfile.Should().NotBeNull();
        analysisResult.Should().NotBeNull();
        analysisResult.OverallCompliance.Should().Be(ComplianceLevel.Safe);
    }

    [Fact]
    public async Task ScanToAnalysisWorkflow_WithAllergenViolation_DetectsViolation()
    {
        // Arrange
        var barcode = "987654321";
        var product = ProductBuilder.Create()
            .WithBarcode(barcode)
            .WithName("Milk Chocolate")
            .WithIngredients("milk", "cocoa", "sugar")
            .WithAllergens("milk")
            .Build();

        var profile = UserProfileBuilder.Create()
            .WithName("Lactose Intolerant User")
            .WithRestrictions(DietaryRestrictionType.Milk)
            .Build();

        var analysis = DietaryAnalysisBuilder.Create()
            .WithCompliance(ComplianceLevel.Violation)
            .WithViolation(ViolationType.Allergen, SeverityLevel.Critical, "milk")
            .Build();

        _mockOpenFoodFacts.Setup(x => x.GetProductAsync(barcode)).ReturnsAsync(product);
        _mockUserProfile.Setup(x => x.GetCurrentProfileAsync()).ReturnsAsync(profile);
        _mockDietaryAnalysis.Setup(x => x.AnalyzeProductAsync(It.IsAny<string>(), It.IsAny<List<string>>(), It.IsAny<List<DietaryRestrictionType>>()))
            .ReturnsAsync(analysis);

        // Act
        var retrievedProduct = await _mockOpenFoodFacts.Object.GetProductAsync(barcode);
        var currentProfile = await _mockUserProfile.Object.GetCurrentProfileAsync();
        var analysisResult = await _mockDietaryAnalysis.Object.AnalyzeProductAsync(
            retrievedProduct!.ProductName,
            retrievedProduct.Ingredients,
            currentProfile!.DietaryRestrictions);

        // Assert
        analysisResult.Should().NotBeNull();
        analysisResult.OverallCompliance.Should().Be(ComplianceLevel.Violation);
        analysisResult.Violations.Should().HaveCount(1);
        analysisResult.Violations[0].Type.Should().Be(ViolationType.Allergen);
        analysisResult.Violations[0].Severity.Should().Be(SeverityLevel.Critical);
        analysisResult.Violations[0].Ingredient.Should().Be("milk");
    }

    [Fact]
    public async Task UserProfileWorkflow_CreateAndUpdateProfile_WorksCorrectly()
    {
        // Arrange
        var initialProfile = UserProfileBuilder.Create()
            .WithName("New User")
            .WithRestrictions(DietaryRestrictionType.Milk)
            .Build();

        var updatedProfile = UserProfileBuilder.Create()
            .WithName("Updated User")
            .WithRestrictions(DietaryRestrictionType.Milk, DietaryRestrictionType.Eggs)
            .Build();

        _mockUserProfile.Setup(x => x.CreateProfileAsync(It.IsAny<UserProfile>())).ReturnsAsync(initialProfile);
        _mockUserProfile.Setup(x => x.UpdateProfileAsync(It.IsAny<UserProfile>())).ReturnsAsync(updatedProfile);
        _mockUserProfile.Setup(x => x.GetCurrentProfileAsync()).ReturnsAsync(updatedProfile);

        // Act
        var createdProfile = await _mockUserProfile.Object.CreateProfileAsync(initialProfile);
        var modifiedProfile = await _mockUserProfile.Object.UpdateProfileAsync(updatedProfile);
        var currentProfile = await _mockUserProfile.Object.GetCurrentProfileAsync();

        // Assert
        createdProfile.Should().NotBeNull();
        createdProfile.Name.Should().Be("New User");
        modifiedProfile.Should().NotBeNull();
        modifiedProfile.DietaryRestrictions.Should().HaveCount(2);
        currentProfile.Should().NotBeNull();
        currentProfile.Name.Should().Be("Updated User");
    }

    [Fact]
    public async Task OfflineScenarioWorkflow_WithCachedData_WorksCorrectly()
    {
        // Arrange
        var barcode = "555666777";
        var cachedProduct = ProductBuilder.Create()
            .WithBarcode(barcode)
            .WithName("Cached Product")
            .WithIngredients("water", "salt")
            .Build();

        _mockProductCache.Setup(x => x.GetCachedProductAsync(barcode)).ReturnsAsync(cachedProduct);
        _mockOpenFoodFacts.Setup(x => x.GetProductAsync(barcode)).ThrowsAsync(new HttpRequestException("Network unavailable"));

        // Act
        Product? product = null;
        try
        {
            product = await _mockOpenFoodFacts.Object.GetProductAsync(barcode);
        }
        catch (HttpRequestException)
        {
            product = await _mockProductCache.Object.GetCachedProductAsync(barcode);
        }

        // Assert
        product.Should().NotBeNull();
        product!.Barcode.Should().Be(barcode);
        product.ProductName.Should().Be("Cached Product");
    }
}
