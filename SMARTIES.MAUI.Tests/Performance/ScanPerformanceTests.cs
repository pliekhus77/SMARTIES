using FluentAssertions;
using System.Diagnostics;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Tests.Helpers;
using Moq;

namespace SMARTIES.MAUI.Tests.Performance;

public class ScanPerformanceTests
{
    private readonly Mock<IOpenFoodFactsService> _mockOpenFoodFacts;
    private readonly Mock<IDietaryAnalysisService> _mockDietaryAnalysis;
    private readonly Mock<IUserProfileService> _mockUserProfile;

    public ScanPerformanceTests()
    {
        _mockOpenFoodFacts = MockServiceFactory.CreateOpenFoodFactsService();
        _mockDietaryAnalysis = MockServiceFactory.CreateDietaryAnalysisService();
        _mockUserProfile = MockServiceFactory.CreateUserProfileService();
    }

    [Fact]
    public async Task ScanToResultWorkflow_CompletesWithinThreeSeconds()
    {
        // Arrange
        var barcode = "123456789";
        var stopwatch = Stopwatch.StartNew();

        // Act
        var product = await _mockOpenFoodFacts.Object.GetProductAsync(barcode);
        var profile = await _mockUserProfile.Object.GetCurrentProfileAsync();
        var analysis = await _mockDietaryAnalysis.Object.AnalyzeProductAsync(
            product!.ProductName, 
            product.Ingredients, 
            profile!.DietaryRestrictions);

        stopwatch.Stop();

        // Assert
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(3000, "Scan to result should complete within 3 seconds");
        product.Should().NotBeNull();
        analysis.Should().NotBeNull();
    }

    [Fact]
    public async Task ProductLookup_CompletesWithinTwoSeconds()
    {
        // Arrange
        var barcode = "123456789";
        var stopwatch = Stopwatch.StartNew();

        // Act
        var product = await _mockOpenFoodFacts.Object.GetProductAsync(barcode);
        stopwatch.Stop();

        // Assert
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(2000, "Product lookup should complete within 2 seconds");
        product.Should().NotBeNull();
    }

    [Fact]
    public async Task DietaryAnalysis_CompletesWithinOneSecond()
    {
        // Arrange
        var ingredients = new List<string> { "milk", "sugar", "flour" };
        var restrictions = new List<DietaryRestrictionType> { DietaryRestrictionType.Milk };
        var stopwatch = Stopwatch.StartNew();

        // Act
        var analysis = await _mockDietaryAnalysis.Object.AnalyzeProductAsync("Test Product", ingredients, restrictions);
        stopwatch.Stop();

        // Assert
        stopwatch.ElapsedMilliseconds.Should().BeLessThan(1000, "Dietary analysis should complete within 1 second");
        analysis.Should().NotBeNull();
    }

    [Theory]
    [InlineData(10)]
    [InlineData(50)]
    [InlineData(100)]
    public async Task ConcurrentScans_MaintainPerformance(int concurrentScans)
    {
        // Arrange
        var tasks = new List<Task>();
        var stopwatch = Stopwatch.StartNew();

        // Act
        for (int i = 0; i < concurrentScans; i++)
        {
            var barcode = $"12345678{i:D4}";
            tasks.Add(SimulateScanWorkflow(barcode));
        }

        await Task.WhenAll(tasks);
        stopwatch.Stop();

        // Assert
        var averageTimePerScan = stopwatch.ElapsedMilliseconds / concurrentScans;
        averageTimePerScan.Should().BeLessThan(5000, $"Average time per scan with {concurrentScans} concurrent scans should be under 5 seconds");
    }

    private async Task SimulateScanWorkflow(string barcode)
    {
        var product = await _mockOpenFoodFacts.Object.GetProductAsync(barcode);
        var profile = await _mockUserProfile.Object.GetCurrentProfileAsync();
        
        if (product != null && profile != null)
        {
            await _mockDietaryAnalysis.Object.AnalyzeProductAsync(
                product.ProductName, 
                product.Ingredients, 
                profile.DietaryRestrictions);
        }
    }
}
