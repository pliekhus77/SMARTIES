using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Services;

namespace SMARTIES.MAUI.ViewModels;

public partial class ScannerViewModel : ObservableObject
{
    private readonly IBarcodeService _barcodeService;
    private readonly IOpenFoodFactsService _openFoodFactsService;
    private readonly IDietaryAnalysisService _dietaryAnalysisService;
    private readonly IUserProfileService _userProfileService;
    private readonly IProductCacheService _productCacheService;
    private readonly IScannerErrorHandler _errorHandler;
    private readonly ILogger<ScannerViewModel> _logger;

    [ObservableProperty]
    private bool isScanning;

    [ObservableProperty]
    private bool isProcessing;

    [ObservableProperty]
    private string scanningInstructions = "Center barcode in the frame";

    [ObservableProperty]
    private bool isFlashlightOn;

    [ObservableProperty]
    private string statusMessage = "Ready to scan";

    [ObservableProperty]
    private Product? currentProduct;

    [ObservableProperty]
    private DietaryAnalysis? currentAnalysis;

    [ObservableProperty]
    private UserProfile? activeProfile;

    public ObservableCollection<Product> RecentProducts { get; } = new();

    public ScannerViewModel(
        IBarcodeService barcodeService,
        IOpenFoodFactsService openFoodFactsService,
        IDietaryAnalysisService dietaryAnalysisService,
        IUserProfileService userProfileService,
        IProductCacheService productCacheService,
        IScannerErrorHandler errorHandler,
        ILogger<ScannerViewModel> logger)
    {
        _barcodeService = barcodeService;
        _openFoodFactsService = openFoodFactsService;
        _dietaryAnalysisService = dietaryAnalysisService;
        _userProfileService = userProfileService;
        _productCacheService = productCacheService;
        _errorHandler = errorHandler;
        _logger = logger;

        _barcodeService.BarcodeDetected += OnBarcodeDetected;
        _ = Task.Run(InitializeAsync);
    }

    private async Task InitializeAsync()
    {
        try
        {
            ActiveProfile = await _userProfileService.GetActiveProfileAsync();
            await LoadRecentProductsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing scanner view model");
        }
    }

    private async void OnBarcodeDetected(object? sender, BarcodeDetectedEventArgs e)
    {
        await ProcessBarcodeAsync(e.Barcode);
    }

    [RelayCommand]
    private async Task StartScanningAsync()
    {
        try
        {
            var hasPermission = await _barcodeService.RequestCameraPermissionAsync();
            if (!hasPermission)
            {
                var shouldUseManualEntry = await _errorHandler.HandleCameraPermissionDeniedAsync();
                if (!shouldUseManualEntry)
                {
                    await ManualEntryAsync();
                }
                return;
            }

            IsScanning = true;
            StatusMessage = "Ready to scan";
            await _barcodeService.StartScanningAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting scanning");
            var shouldUseManualEntry = await _errorHandler.HandleCameraInitializationErrorAsync(ex);
            if (shouldUseManualEntry)
            {
                await ManualEntryAsync();
            }
            IsScanning = false;
        }
    }

    [RelayCommand]
    private async Task StopScanningAsync()
    {
        try
        {
            IsScanning = false;
            await _barcodeService.StopScanningAsync();
            StatusMessage = "Scanning stopped";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping scanning");
        }
    }

    [RelayCommand]
    private async Task ManualEntryAsync()
    {
        try
        {
            var dialog = new Views.Dialogs.ManualBarcodeEntryDialog(_barcodeService);
            await Application.Current?.MainPage?.Navigation.PushModalAsync(dialog)!;
            
            var barcode = await dialog.GetBarcodeAsync();
            
            if (!string.IsNullOrEmpty(barcode))
            {
                await ProcessBarcodeAsync(barcode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during manual barcode entry");
            StatusMessage = "Manual entry failed. Please try again.";
        }
    }

    [RelayCommand]
    private async Task ToggleFlashlightAsync()
    {
        IsFlashlightOn = !IsFlashlightOn;
        // Flashlight control will be implemented in the camera view
    }

    private async Task ProcessBarcodeAsync(string barcode)
    {
        if (IsProcessing)
            return;

        try
        {
            IsProcessing = true;
            StatusMessage = "Looking up product...";

            var product = await _productCacheService.GetCachedProductAsync(barcode);
            
            if (product == null)
            {
                product = await _openFoodFactsService.GetProductAsync(barcode);
                
                if (product == null)
                {
                    StatusMessage = "Product not found. Try manual entry.";
                    return;
                }

                await _productCacheService.CacheProductAsync(product);
            }

            CurrentProduct = product;
            StatusMessage = "Analyzing dietary compliance...";

            if (ActiveProfile != null)
            {
                CurrentAnalysis = await _dietaryAnalysisService.AnalyzeProductAsync(product, ActiveProfile);
                
                StatusMessage = CurrentAnalysis.OverallCompliance switch
                {
                    ComplianceLevel.Safe => "✅ Safe to consume",
                    ComplianceLevel.Caution => "⚠️ Minor concerns",
                    ComplianceLevel.Warning => "⚠️ Significant warnings",
                    ComplianceLevel.Violation => "🚫 Dietary violations found",
                    ComplianceLevel.Critical => "🚫 CRITICAL: Do not consume",
                    _ => "Analysis complete"
                };
            }
            else
            {
                StatusMessage = "No active profile for analysis";
            }

            await LoadRecentProductsAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing barcode: {Barcode}", barcode);
            StatusMessage = "Error analyzing product. Please try again.";
        }
        finally
        {
            IsProcessing = false;
        }
    }

    [RelayCommand]
    private async Task LoadRecentProductsAsync()
    {
        try
        {
            var recentProducts = await _productCacheService.GetRecentProductsAsync(10);
            
            RecentProducts.Clear();
            foreach (var product in recentProducts)
            {
                RecentProducts.Add(product);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading recent products");
        }
    }

    [RelayCommand]
    private async Task SelectRecentProductAsync(Product product)
    {
        if (product == null || IsProcessing)
            return;

        try
        {
            CurrentProduct = product;
            
            if (ActiveProfile != null)
            {
                IsProcessing = true;
                StatusMessage = "Re-analyzing product...";
                
                CurrentAnalysis = await _dietaryAnalysisService.AnalyzeProductAsync(product, ActiveProfile);
                
                StatusMessage = CurrentAnalysis.OverallCompliance switch
                {
                    ComplianceLevel.Safe => "✅ Safe to consume",
                    ComplianceLevel.Caution => "⚠️ Minor concerns",
                    ComplianceLevel.Warning => "⚠️ Significant warnings",
                    ComplianceLevel.Violation => "🚫 Dietary violations found",
                    ComplianceLevel.Critical => "🚫 CRITICAL: Do not consume",
                    _ => "Analysis complete"
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error selecting recent product: {ProductName}", product.ProductName);
            StatusMessage = "Error analyzing product";
        }
        finally
        {
            IsProcessing = false;
        }
    }
}
