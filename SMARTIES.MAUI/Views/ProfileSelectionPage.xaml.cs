using SMARTIES.MAUI.ViewModels;

namespace SMARTIES.MAUI.Views;

public partial class ProfileSelectionPage : ContentPage
{
    private readonly ProfileSelectionViewModel _viewModel;

    public ProfileSelectionPage(ProfileSelectionViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = _viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        
        // Load profiles when page appears
        await _viewModel.LoadProfilesCommand.ExecuteAsync(null);
    }
}
