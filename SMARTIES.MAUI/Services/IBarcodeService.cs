using ZXing.Net.Maui;

namespace SMARTIES.MAUI.Services;

public interface IBarcodeService
{
    event EventHandler<BarcodeDetectedEventArgs>? BarcodeDetected;
    
    Task<bool> RequestCameraPermissionAsync();
    bool ValidateBarcodeFormat(string barcode);
    string NormalizeBarcode(string barcode);
    Task StartScanningAsync();
    Task StopScanningAsync();
    void TriggerHapticFeedback();
    void TriggerAudioFeedback();
}

public class BarcodeDetectedEventArgs : EventArgs
{
    public string Barcode { get; }
    public BarcodeFormat Format { get; }
    public DateTime DetectedAt { get; }

    public BarcodeDetectedEventArgs(string barcode, BarcodeFormat format)
    {
        Barcode = barcode;
        Format = format;
        DetectedAt = DateTime.Now;
    }
}
