using SMARTIES.MAUI.Views;
using SMARTIES.MAUI.Services;

namespace SMARTIES.MAUI;

public partial class App : Application
{
    private readonly ISplashScreenService _splashScreenService;

    public App(ISplashScreenService splashScreenService)
    {
        InitializeComponent();
        _splashScreenService = splashScreenService;

        MainPage = new AppShell();
    }

    protected override async void OnStart()
    {
        base.OnStart();
        
        try
        {
            // Initialize and show splash screen
            await _splashScreenService.InitializeAsync();
            await _splashScreenService.ShowSplashScreenAsync();
        }
        catch (Exception ex)
        {
            // Log error but don't crash the app
            System.Diagnostics.Debug.WriteLine($"Splash screen error: {ex.Message}");
        }
    }
}
