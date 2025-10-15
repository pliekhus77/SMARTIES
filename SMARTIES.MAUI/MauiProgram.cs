using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Services.Performance;
using SMARTIES.MAUI.ViewModels;
using SMARTIES.MAUI.Data;

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

        // Minimal services for testing
        builder.Services.AddTransient<App>();

        return builder.Build();
    }
}
