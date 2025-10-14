using SMARTIES.MAUI.Views;

namespace SMARTIES.MAUI;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();

        MainPage = new AppShell();
    }
}