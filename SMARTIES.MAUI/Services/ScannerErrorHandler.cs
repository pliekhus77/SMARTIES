using Microsoft.Extensions.Logging;

namespace SMARTIES.MAUI.Services;

public interface IScannerErrorHandler
{
    Task<bool> HandleCameraPermissionDeniedAsync();
    Task<bool> HandleCameraInitializationErrorAsync(Exception exception);
    Task<bool> HandleBarcodeDetectionErrorAsync(Exception exception);
    Task<bool> HandleNetworkErrorAsync(Exception exception);
    string GetUserFriendlyErrorMessage(Exception exception);
}

public class ScannerErrorHandler : IScannerErrorHandler
{
    private readonly ILogger<ScannerErrorHandler> _logger;

    public ScannerErrorHandler(ILogger<ScannerErrorHandler> logger)
    {
        _logger = logger;
    }

    public async Task<bool> HandleCameraPermissionDeniedAsync()
    {
        _logger.LogWarning("Camera permission denied by user");
        
        var result = await Application.Current?.MainPage?.DisplayAlert(
            "Camera Permission Required",
            "SMARTIES needs camera access to scan barcodes. You can grant permission in your device settings or use manual entry instead.",
            "Open Settings",
            "Use Manual Entry") ?? false;

        if (result)
        {
            // Open device settings
            try
            {
                await AppInfo.ShowSettingsUI();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to open device settings");
                return false;
            }
        }

        return false; // User chose manual entry
    }

    public async Task<bool> HandleCameraInitializationErrorAsync(Exception exception)
    {
        _logger.LogError(exception, "Camera initialization failed");
        
        var message = exception switch
        {
            UnauthorizedAccessException => "Camera access was denied. Please check your permissions.",
            InvalidOperationException => "Camera is not available or in use by another app.",
            NotSupportedException => "Your device doesn't support camera functionality.",
            _ => "Camera failed to initialize. Please try restarting the app."
        };

        var result = await Application.Current?.MainPage?.DisplayAlert(
            "Camera Error",
            $"{message}\n\nWould you like to try manual barcode entry instead?",
            "Manual Entry",
            "Cancel") ?? false;

        return result;
    }

    public async Task<bool> HandleBarcodeDetectionErrorAsync(Exception exception)
    {
        _logger.LogError(exception, "Barcode detection failed");
        
        await Application.Current?.MainPage?.DisplayAlert(
            "Scanning Error",
            "Failed to detect barcode. Please ensure the barcode is clearly visible and try again.",
            "OK");

        return true; // Continue scanning
    }

    public async Task<bool> HandleNetworkErrorAsync(Exception exception)
    {
        _logger.LogError(exception, "Network error during product lookup");
        
        var message = exception switch
        {
            HttpRequestException => "Unable to connect to product database. Please check your internet connection.",
            TaskCanceledException => "Request timed out. Please try again.",
            _ => "Network error occurred. Please check your connection and try again."
        };

        await Application.Current?.MainPage?.DisplayAlert(
            "Network Error",
            message,
            "OK");

        return false;
    }

    public string GetUserFriendlyErrorMessage(Exception exception)
    {
        return exception switch
        {
            UnauthorizedAccessException => "Camera permission required",
            InvalidOperationException => "Camera unavailable",
            NotSupportedException => "Camera not supported",
            HttpRequestException => "Network connection error",
            TaskCanceledException => "Request timed out",
            ArgumentException => "Invalid barcode format",
            _ => "An unexpected error occurred"
        };
    }
}
