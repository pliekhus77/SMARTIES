using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.ViewModels;
using ZXing.Net.Maui;

namespace SMARTIES.MAUI.Views.Controls;

public partial class SmartiesCameraView : ContentView
{
    private IBarcodeService? _barcodeService;

    public SmartiesCameraView()
    {
        InitializeComponent();
    }

    protected override void OnBindingContextChanged()
    {
        base.OnBindingContextChanged();
        
        if (BindingContext is ScannerViewModel viewModel)
        {
            // Get the barcode service from the view model or DI container
            _barcodeService = Handler?.MauiContext?.Services?.GetService<IBarcodeService>();
        }
    }

    private void OnBarcodeDetected(object sender, BarcodeDetectedEventArgs e)
    {
        if (_barcodeService is BarcodeService barcodeService)
        {
            barcodeService.OnBarcodeDetected(e.Result.First().Value, e.Result.First().Format);
        }
    }
}
