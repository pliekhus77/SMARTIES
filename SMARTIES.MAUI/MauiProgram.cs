using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.ViewModels;
using SMARTIES.MAUI.Views;
using SMARTIES.MAUI.Services;

namespace SMARTIES.MAUI;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            });

#if DEBUG
        builder.Logging.AddDebug();
#endif

        // Register Services
        builder.Services.AddSingleton<IUserProfileService, UserProfileService>();

        // Register ViewModels
        builder.Services.AddTransient<HomeViewModel>();
        builder.Services.AddTransient<ProfileSelectionViewModel>();
        
        // Register Views
        builder.Services.AddTransient<HomePage>();
        builder.Services.AddTransient<ProfileSelectionPage>();
        builder.Services.AddTransient<HistoryPage>();
        builder.Services.AddTransient<ProfilePage>();
        builder.Services.AddTransient<SettingsPage>();

        return builder.Build();
    }
}
