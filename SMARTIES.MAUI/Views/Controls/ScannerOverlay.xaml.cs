using Microsoft.Maui.Controls;

namespace SMARTIES.MAUI.Views.Controls;

public partial class ScannerOverlay : ContentView
{
    private bool _isScanning = false;
    private bool _isFlashlightOn = false;

    public ScannerOverlay()
    {
        InitializeComponent();
        StartScanAnimation();
    }

    public event EventHandler? FlashlightToggled;
    public event EventHandler? ManualEntryRequested;
    public event EventHandler? SettingsRequested;

    private async void StartScanAnimation()
    {
        while (_isScanning)
        {
            await ScanLine.TranslateTo(0, -100, 1000, Easing.Linear);
            await ScanLine.TranslateTo(0, 100, 1000, Easing.Linear);
        }
    }

    public void StartScanning()
    {
        _isScanning = true;
        StatusLabel.Text = "Scanning...";
        InstructionLabel.Text = "Position barcode within the frame";
        StartScanAnimation();
    }

    public void StopScanning()
    {
        _isScanning = false;
        StatusLabel.Text = "Ready";
    }

    public async void ShowScanSuccess()
    {
        await ScanningFrame.ScaleTo(1.1, 150);
        ScanningFrame.BorderColor = Colors.Green;
        StatusLabel.Text = "Scan successful!";
        StatusLabel.TextColor = Colors.Green;
        
        await Task.Delay(500);
        await ScanningFrame.ScaleTo(1.0, 150);
    }

    public async void ShowScanError(string message)
    {
        await ScanningFrame.ScaleTo(1.05, 100);
        ScanningFrame.BorderColor = Colors.Red;
        StatusLabel.Text = message;
        StatusLabel.TextColor = Colors.Red;
        
        await Task.Delay(1000);
        ScanningFrame.BorderColor = Color.FromArgb("#28a745");
        StatusLabel.TextColor = Color.FromArgb("#e9ecef");
        await ScanningFrame.ScaleTo(1.0, 100);
    }

    private void OnFlashlightClicked(object sender, EventArgs e)
    {
        _isFlashlightOn = !_isFlashlightOn;
        FlashlightButton.Text = _isFlashlightOn ? "🔦" : "💡";
        FlashlightToggled?.Invoke(this, EventArgs.Empty);
    }

    private void OnManualEntryClicked(object sender, EventArgs e)
    {
        ManualEntryRequested?.Invoke(this, EventArgs.Empty);
    }

    private void OnSettingsClicked(object sender, EventArgs e)
    {
        SettingsRequested?.Invoke(this, EventArgs.Empty);
    }
}
