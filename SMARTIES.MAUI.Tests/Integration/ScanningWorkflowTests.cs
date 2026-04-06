using Microsoft.Extensions.Logging;
using Moq;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Models.Performance;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Services.Performance;
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
    private readonly Mock<IScanPerformanceService> _mockScanPerformance;
    private readonly Mock<IPerformanceAlertingService> _mockPerformanceAlerting;
    private readonly Mock<IScanResultTrackingService> _mockScanResultTracking;

    public ScanningWorkflowTests()
    {
        _mockBarcodeService = new Mock<IBarcodeService>();
        _mockOpenFoodFactsService = new Mock<IOpenFoodFactsService>();
        _mockDietaryAnalysisService = new Mock<IDietaryAnalysisService>();
        _mockUserProfileService = new Mock<IUserProfileService>();
        _mockProductCacheService = new Mock<IProductCacheService>();
        _mockErrorHandler = new Mock<IScannerErrorHandler>();
        _mockLogger = new Mock<ILogger<ScannerViewModel>>();
        _mockScanPerformance = new Mock<IScanPerformanceService>();
        _mockPerformanceAlerting = new Mock<IPerformanceAlertingService>();
        _mockScanResultTracking = new Mock<IScanResultTrackingService>();

        _mockPerformanceAlerting.SetupAdd(x => x.AlertGenerated += It.IsAny<EventHandler<PerformanceAlert>>());

        _mockScanPerformance.Setup(x => x.OptimizeCameraSettingsAsync()).Returns(Task.CompletedTask);
        _mockScanPerformance.Setup(x => x.PreloadCriticalResourcesAsync()).Returns(Task.CompletedTask);
        _mockScanPerformance.Setup(x => x.ValidatePerformanceThresholdAsync(It.IsAny<TimeSpan>())).ReturnsAsync(true);
        _mockScanPerformance
            .Setup(x => x.MeasureScanWorkflowAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(async f =>
            {
                await f();
                return TimeSpan.FromMilliseconds(10);
            });

        _mockScanResultTracking
            .Setup(x => x.TrackApiResponseAsync(It.IsAny<Func<Task>>()))
            .Returns<Func<Task>>(async f =>
            {
                await f();
                return new PerformanceMetric { Type = PerformanceMetricType.ApiResponseTime, Value = 0 };
            });

        _mockUserProfileService
            .Setup(x => x.GetActiveProfileAsync())
            .ReturnsAsync(new UserProfile { Name = "Default", Allergies = "[]" });

        _mockProductCacheService.Setup(x => x.GetRecentProductsAsync(It.IsAny<int>()))
            .ReturnsAsync(new List<Product>());
    }

    private ScannerViewModel CreateViewModel() =>
        new ScannerViewModel(
            _mockBarcodeService.Object,
            _mockOpenFoodFactsService.Object,
            _mockDietaryAnalysisService.Object,
            _mockUserProfileService.Object,
            _mockProductCacheService.Object,
            _mockErrorHandler.Object,
            _mockLogger.Object,
            _mockScanPerformance.Object,
            _mockPerformanceAlerting.Object,
            _mockScanResultTracking.Object);

    [Fact]
    public async Task CompleteWorkflow_ScanToAnalysis_ShouldSucceed()
    {
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
            Allergies = "[\"Peanuts\"]"
        };
        var testAnalysis = new DietaryAnalysis
        {
            OverallCompliance = ComplianceLevel.Safe,
            Summary = "Safe to consume",
            Recommendation = "No issues found"
        };

        _mockUserProfileService.Setup(x => x.GetActiveProfileAsync()).ReturnsAsync(testProfile);

        _mockBarcodeService.Setup(x => x.RequestCameraPermissionAsync())
            .ReturnsAsync(true);

        _mockProductCacheService.Setup(x => x.GetCachedProductAsync(testBarcode))
            .ReturnsAsync((Product?)null);

        _mockOpenFoodFactsService.Setup(x => x.GetProductAsync(testBarcode, It.IsAny<CancellationToken>()))
            .ReturnsAsync(testProduct);

        _mockProductCacheService.Setup(x => x.CacheProductAsync(testProduct))
            .Returns(Task.CompletedTask);

        _mockDietaryAnalysisService
            .Setup(x => x.AnalyzeProductAsync(testProduct, testProfile, It.IsAny<CancellationToken>()))
            .ReturnsAsync(testAnalysis);

        var viewModel = CreateViewModel();

        await viewModel.StartScanningCommand.ExecuteAsync(null);

        _mockBarcodeService.Raise(x => x.BarcodeDetected += null,
            new BarcodeDetectedEventArgs(testBarcode, ZXing.Net.Maui.BarcodeFormat.Ean13));

        await Task.Delay(200);

        Assert.True(viewModel.IsScanning);
        Assert.NotNull(viewModel.CurrentProduct);
        Assert.Equal(testProduct.ProductName, viewModel.CurrentProduct.ProductName);
        Assert.NotNull(viewModel.CurrentAnalysis);
        Assert.Equal(ComplianceLevel.Safe, viewModel.CurrentAnalysis.OverallCompliance);
        Assert.Contains("Safe to consume", viewModel.StatusMessage);
    }

    [Fact]
    public async Task ScanningWorkflow_ProductNotFound_ShouldShowError()
    {
        var testBarcode = "9999999999999";

        _mockBarcodeService.Setup(x => x.RequestCameraPermissionAsync())
            .ReturnsAsync(true);

        _mockProductCacheService.Setup(x => x.GetCachedProductAsync(testBarcode))
            .ReturnsAsync((Product?)null);

        _mockOpenFoodFactsService.Setup(x => x.GetProductAsync(testBarcode, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Product?)null);

        var viewModel = CreateViewModel();

        await viewModel.StartScanningCommand.ExecuteAsync(null);

        _mockBarcodeService.Raise(x => x.BarcodeDetected += null,
            new BarcodeDetectedEventArgs(testBarcode, ZXing.Net.Maui.BarcodeFormat.Ean13));

        await Task.Delay(200);

        Assert.Contains("Product not found", viewModel.StatusMessage);
        Assert.Null(viewModel.CurrentProduct);
        Assert.Null(viewModel.CurrentAnalysis);
    }

    [Fact]
    public async Task ScanningWorkflow_CameraPermissionDenied_ShouldHandleGracefully()
    {
        _mockBarcodeService.Setup(x => x.RequestCameraPermissionAsync())
            .ReturnsAsync(false);

        _mockErrorHandler.Setup(x => x.HandleCameraPermissionDeniedAsync())
            .ReturnsAsync(false);

        var viewModel = CreateViewModel();

        await viewModel.StartScanningCommand.ExecuteAsync(null);

        Assert.False(viewModel.IsScanning);
        _mockErrorHandler.Verify(x => x.HandleCameraPermissionDeniedAsync(), Times.Once);
    }
}
