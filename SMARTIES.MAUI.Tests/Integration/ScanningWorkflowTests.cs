using Microsoft.Extensions.Logging;
using Moq;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.ViewModels;
using Xunit;

namespace SMARTIES.MAUI.Tests.Integration;

public class ScanningWorkflowTests
{
    private readonly Mock<IBarcodeService> _mockBarcodeService;
    private readonly Mock<IOpenFoodFactsService> _mockOpenFoodFactsService;
    private readonly Mock<IDietaryAnalysisService> _mockDietaryAnalysisService;
    private readonly Mock<IUserProfileService> _mockUserProfileService;
    private readonly Mock<IProductCacheService> _mockProductCacheService;
    private readonly Mock<IScannerErrorHandler> _mockErrorHandler;
    private readonly Mock<ILogger<ScannerViewModel>> _mockLogger;
    private readonly ScannerViewModel _viewModel;

    public ScanningWorkflowTests()
    {
        _mockBarcodeService = new Mock<IBarcodeService>();
        _mockOpenFoodFactsService = new Mock<IOpenFoodFactsService>();
        _mockDietaryAnalysisService = new Mock<IDietaryAnalysisService>();
        _mockUserProfileService = new Mock<IUserProfileService>();
        _mockProductCacheService = new Mock<IProductCacheService>();
        _mockErrorHandler = new Mock<IScannerErrorHandler>();
        _mockLogger = new Mock<ILogger<ScannerViewModel>>();

        _viewModel = new ScannerViewModel(
            _mockBarcodeService.Object,
            _mockOpenFoodFactsService.Object,
            _mockDietaryAnalysisService.Object,
            _mockUserProfileService.Object,
            _mockProductCacheService.Object,
            _mockErrorHandler.Object,
            _mockLogger.Object);
    }

    [Fact]
    public async Task CompleteWorkflow_ScanToAnalysis_ShouldSucceed()
    {
        // Arrange
        var testBarcode = "1234567890123";
        var testProduct = new Product
        {
            Barcode = testBarcode,
            ProductName = "Test Product",
            Brand = "Test Brand"
        };
        var testProfile = new UserProfile
        {
            Name = "Test User",
            Allergies = new List<string> { "Peanuts" }
        };
        var testAnalysis = new DietaryAnalysis
        {
            OverallCompliance = ComplianceLevel.Safe,
            Summary = "Safe to consume",
            Recommendation = "No issues found"
        };

        _mockBarcodeService.Setup(x => x.RequestCameraPermissionAsync())
            .ReturnsAsync(true);
        
        _mockUserProfileService.Setup(x => x.GetActiveProfileAsync())
            .ReturnsAsync(testProfile);
        
        _mockProductCacheService.Setup(x => x.GetCachedProductAsync(testBarcode))
            .ReturnsAsync((Product?)null);
        
        _mockOpenFoodFactsService.Setup(x => x.GetProductAsync(testBarcode))
            .ReturnsAsync(testProduct);
        
        _mockProductCacheService.Setup(x => x.CacheProductAsync(testProduct))
            .Returns(Task.CompletedTask);
        
        _mockDietaryAnalysisService.Setup(x => x.AnalyzeProductAsync(testProduct, testProfile))
            .ReturnsAsync(testAnalysis);
        
        _mockProductCacheService.Setup(x => x.GetRecentProductsAsync(It.IsAny<int>()))
            .ReturnsAsync(new List<Product>());

        // Act
        await _viewModel.StartScanningCommand.ExecuteAsync(null);
        
        // Simulate barcode detection
        _mockBarcodeService.Raise(x => x.BarcodeDetected += null, 
            new BarcodeDetectedEventArgs(testBarcode, ZXing.Net.Maui.BarcodeFormat.Ean13));

        // Wait for processing to complete
        await Task.Delay(100);

        // Assert
        Assert.True(_viewModel.IsScanning);
        Assert.NotNull(_viewModel.CurrentProduct);
        Assert.Equal(testProduct.ProductName, _viewModel.CurrentProduct.ProductName);
        Assert.NotNull(_viewModel.CurrentAnalysis);
        Assert.Equal(ComplianceLevel.Safe, _viewModel.CurrentAnalysis.OverallCompliance);
        Assert.Contains("Safe to consume", _viewModel.StatusMessage);
    }

    [Fact]
    public async Task ScanningWorkflow_ProductNotFound_ShouldShowError()
    {
        // Arrange
        var testBarcode = "9999999999999";
        
        _mockBarcodeService.Setup(x => x.RequestCameraPermissionAsync())
            .ReturnsAsync(true);
        
        _mockProductCacheService.Setup(x => x.GetCachedProductAsync(testBarcode))
            .ReturnsAsync((Product?)null);
        
        _mockOpenFoodFactsService.Setup(x => x.GetProductAsync(testBarcode))
            .ReturnsAsync((Product?)null);

        // Act
        await _viewModel.StartScanningCommand.ExecuteAsync(null);
        
        // Simulate barcode detection
        _mockBarcodeService.Raise(x => x.BarcodeDetected += null, 
            new BarcodeDetectedEventArgs(testBarcode, ZXing.Net.Maui.BarcodeFormat.Ean13));

        // Wait for processing to complete
        await Task.Delay(100);

        // Assert
        Assert.Contains("Product not found", _viewModel.StatusMessage);
        Assert.Null(_viewModel.CurrentProduct);
        Assert.Null(_viewModel.CurrentAnalysis);
    }

    [Fact]
    public async Task ScanningWorkflow_CameraPermissionDenied_ShouldHandleGracefully()
    {
        // Arrange
        _mockBarcodeService.Setup(x => x.RequestCameraPermissionAsync())
            .ReturnsAsync(false);
        
        _mockErrorHandler.Setup(x => x.HandleCameraPermissionDeniedAsync())
            .ReturnsAsync(false);

        // Act
        await _viewModel.StartScanningCommand.ExecuteAsync(null);

        // Assert
        Assert.False(_viewModel.IsScanning);
        _mockErrorHandler.Verify(x => x.HandleCameraPermissionDeniedAsync(), Times.Once);
    }
}
