using SMARTIES.MAUI.ViewModels;

namespace SMARTIES.MAUI.Views;

public partial class ScannerPage : ContentPage
{
    public ScannerPage(ScannerViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}