using Microsoft.Maui.Essentials;
using ZXing.Net.Maui;

namespace SMARTIES.MAUI.Services;

public class BarcodeService : IBarcodeService
{
    private DateTime _lastScanTime = DateTime.MinValue;
    private readonly TimeSpan _scanCooldown = TimeSpan.FromSeconds(2);

    public event EventHandler<BarcodeDetectedEventArgs>? BarcodeDetected;

    public virtual async Task<bool> RequestCameraPermissionAsync()
    {
        var status = await Permissions.RequestAsync<Permissions.Camera>();
        return status == PermissionStatus.Granted;
    }

    public bool ValidateBarcodeFormat(string barcode)
    {
        if (string.IsNullOrWhiteSpace(barcode))
            return false;

        // Remove any non-digit characters
        var digits = new string(barcode.Where(char.IsDigit).ToArray());
        
        // Valid lengths: 8 (EAN-8), 12 (UPC-A), 13 (EAN-13)
        return digits.Length is 8 or 12 or 13;
    }

    public string NormalizeBarcode(string barcode)
    {
        if (string.IsNullOrWhiteSpace(barcode))
            return string.Empty;

        var digits = new string(barcode.Where(char.IsDigit).ToArray());
        
        return digits.Length switch
        {
            8 => "00000" + digits, // EAN-8 to 13 digits
            12 => "0" + digits,    // UPC-A to 13 digits  
            13 => digits,          // Already 13 digits
            _ => digits
        };
    }

    public virtual Task StartScanningAsync()
    {
        ConfigureCameraSettings();
        return Task.CompletedTask;
    }

    public virtual Task StopScanningAsync()
    {
        return Task.CompletedTask;
    }

    protected virtual void ConfigureCameraSettings()
    {
        // Base implementation - can be overridden by platform-specific services
    }

    public void TriggerHapticFeedback()
    {
        try
        {
            HapticFeedback.Default.Perform(HapticFeedbackType.Click);
        }
        catch
        {
            // Ignore haptic feedback errors
        }
    }

    public void TriggerAudioFeedback()
    {
        // Audio feedback could be implemented here if needed
        // For now, we'll rely on haptic feedback
    }

    public void OnBarcodeDetected(string barcode, BarcodeFormat format)
    {
        var now = DateTime.Now;
        if (now - _lastScanTime < _scanCooldown)
            return;

        _lastScanTime = now;

        if (ValidateBarcodeFormat(barcode))
        {
            TriggerHapticFeedback();
            var normalizedBarcode = NormalizeBarcode(barcode);
            BarcodeDetected?.Invoke(this, new BarcodeDetectedEventArgs(normalizedBarcode, format));
        }
    }
}
