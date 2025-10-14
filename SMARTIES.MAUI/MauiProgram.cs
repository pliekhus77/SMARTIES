using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.ViewModels;

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

        builder.Services.AddMauiBlazorWebView();

#if DEBUG
        builder.Services.AddBlazorWebViewDeveloperTools();
        builder.Logging.AddDebug();
#endif

        // Register HTTP clients
        builder.Services.AddHttpClient<IOpenAIService, OpenAIService>();
        builder.Services.AddHttpClient<IAnthropicService, AnthropicService>();

        // Register AI analysis services
        builder.Services.AddSingleton<ISecureConfigurationService, SecureConfigurationService>();
        builder.Services.AddTransient<IOpenAIService, OpenAIService>();
        builder.Services.AddTransient<IAnthropicService, AnthropicService>();
        builder.Services.AddTransient<IRuleBasedAnalysisService, RuleBasedAnalysisService>();
        builder.Services.AddTransient<IDietaryAnalysisService, DietaryAnalysisService>();
        builder.Services.AddSingleton<IAnalysisCacheService, AnalysisCacheService>();

        // Register existing services
        builder.Services.AddSingleton<ProductService>();
        builder.Services.AddSingleton<UserProfileService>();

        // Register ViewModels
        builder.Services.AddTransient<ScannerViewModel>();
        builder.Services.AddTransient<ProfileViewModel>();
        builder.Services.AddTransient<HistoryViewModel>();

        return builder.Build();
    }
}
