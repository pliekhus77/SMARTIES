using SMARTIES.MAUI.Views;

namespace SMARTIES.MAUI;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();
        
        // Register routes for navigation
        Routing.RegisterRoute("History", typeof(HistoryPage));
        Routing.RegisterRoute("Profile", typeof(ProfilePage));
        Routing.RegisterRoute("Settings", typeof(SettingsPage));
    }
}