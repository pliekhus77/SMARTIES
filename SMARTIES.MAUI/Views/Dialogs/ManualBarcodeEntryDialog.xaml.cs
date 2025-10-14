using SMARTIES.MAUI.Services;

namespace SMARTIES.MAUI.Views.Dialogs;

public partial class ManualBarcodeEntryDialog : ContentPage
{
    private readonly IBarcodeService _barcodeService;
    private TaskCompletionSource<string?> _taskCompletionSource;

    public ManualBarcodeEntryDialog(IBarcodeService barcodeService)
    {
        InitializeComponent();
        _barcodeService = barcodeService;
        _taskCompletionSource = new TaskCompletionSource<string?>();
    }

    public Task<string?> GetBarcodeAsync()
    {
        return _taskCompletionSource.Task;
    }

    private void OnBarcodeTextChanged(object sender, TextChangedEventArgs e)
    {
        var barcode = e.NewTextValue?.Trim() ?? string.Empty;
        var isValid = _barcodeService.ValidateBarcodeFormat(barcode);
        
        ValidationLabel.IsVisible = !string.IsNullOrEmpty(barcode) && !isValid;
        SubmitButton.IsEnabled = isValid;
        
        if (isValid)
        {
            ValidationLabel.IsVisible = false;
        }
        else if (!string.IsNullOrEmpty(barcode))
        {
            ValidationLabel.Text = barcode.Length switch
            {
                < 8 => "Barcode too short (minimum 8 digits)",
                > 13 => "Barcode too long (maximum 13 digits)",
                _ => "Invalid barcode format"
            };
        }
    }

    private async void OnSubmitClicked(object sender, EventArgs e)
    {
        var barcode = BarcodeEntry.Text?.Trim();
        
        if (!string.IsNullOrEmpty(barcode) && _barcodeService.ValidateBarcodeFormat(barcode))
        {
            var normalizedBarcode = _barcodeService.NormalizeBarcode(barcode);
            _taskCompletionSource.SetResult(normalizedBarcode);
            await Navigation.PopModalAsync();
        }
    }

    private async void OnCancelClicked(object sender, EventArgs e)
    {
        _taskCompletionSource.SetResult(null);
        await Navigation.PopModalAsync();
    }
}
