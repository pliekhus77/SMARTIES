using SMARTIES.MAUI.ViewModels;

namespace SMARTIES.MAUI.Views;

public partial class HomePage : ContentPage
{
    public HomePage(HomeViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}