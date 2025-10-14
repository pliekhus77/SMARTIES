using SMARTIES.MAUI.ViewModels;

namespace SMARTIES.MAUI.Views;

public partial class ProfilePage : ContentPage
{
    public ProfilePage(ProfileViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}