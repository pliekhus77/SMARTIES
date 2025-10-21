using SMARTIES.MAUI.Services;

namespace SMARTIES.MAUI;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();
        MainPage = new AppShell();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        return new Window(MainPage!)
        {
            Title = "SMARTIES - Dietary Scanner"
        };
    }

    protected override async void OnStart()
    {
        base.OnStart();
        
        // Navigate to appropriate starting page based on profile existence
        await NavigateToStartingPage();
    }

    private async Task NavigateToStartingPage()
    {
        try
        {
            var userProfileService = Handler?.MauiContext?.Services?.GetService<IUserProfileService>();
            if (userProfileService != null)
            {
                var isFirstTimeUser = await userProfileService.IsFirstTimeUserAsync();
                var profiles = await userProfileService.GetAllProfilesAsync();
                
                // If first time user or no profiles, go to profile selection
                if (isFirstTimeUser || profiles.Count == 0)
                {
                    await Shell.Current.GoToAsync("//profiles");
                }
                // If only one profile, auto-select it and go to scanner
                else if (profiles.Count == 1)
                {
                    var profile = profiles.First();
                    await userProfileService.SetActiveProfileAsync(profile.Id);
                    await userProfileService.UpdateProfileUsageAsync(profile.Id);
                    await Shell.Current.GoToAsync("//scanner");
                }
                // Multiple profiles, let user choose
                else
                {
                    await Shell.Current.GoToAsync("//profiles");
                }
            }
            else
            {
                // Fallback to profile selection if service not available
                await Shell.Current.GoToAsync("//profiles");
            }
        }
        catch
        {
            // Fallback to profile selection on any error
            await Shell.Current.GoToAsync("//profiles");
        }
    }
}
