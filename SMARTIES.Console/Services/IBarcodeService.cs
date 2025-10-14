namespace SMARTIES.Console.Services;

public interface IBarcodeService
{
    Task<string?> ScanBarcodeAsync(CancellationToken cancellationToken = default);
    Task<bool> IsCameraAvailableAsync();
    Task<bool> RequestCameraPermissionAsync();
}