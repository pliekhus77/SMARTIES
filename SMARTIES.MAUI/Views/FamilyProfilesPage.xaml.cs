using SMARTIES.MAUI.ViewModels;

namespace SMARTIES.MAUI.Views;

public partial class FamilyProfilesPage : ContentPage
{
    public FamilyProfilesPage(FamilyProfilesViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
