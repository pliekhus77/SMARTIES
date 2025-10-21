using SMARTIES.MAUI.Views;

namespace SMARTIES.MAUI;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();
        
        // Register routes for navigation
        Routing.RegisterRoute("profiles", typeof(ProfileSelectionPage));
        Routing.RegisterRoute("scanner", typeof(HomePage));
        Routing.RegisterRoute("History", typeof(HistoryPage));
        Routing.RegisterRoute("Profile", typeof(ProfilePage));
        Routing.RegisterRoute("Settings", typeof(SettingsPage));
        Routing.RegisterRoute("profile/create", typeof(ProfilePage));
        Routing.RegisterRoute("profile/edit", typeof(ProfilePage));
    }
}
