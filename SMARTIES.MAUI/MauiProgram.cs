using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Services.Performance;
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

        // Register Performance Services
        RegisterPerformanceServices(builder.Services);

        return builder.Build();
    }

    private static void RegisterPerformanceServices(IServiceCollection services)
    {
        // Core performance services
        services.AddSingleton<IPerformanceService, PerformanceService>();
        services.AddSingleton<IDeviceCapabilityService, DeviceCapabilityService>();

        // Scan performance services
        services.AddSingleton<IScanPerformanceService, ScanPerformanceService>();
        services.AddSingleton<IScanResultTrackingService, ScanResultTrackingService>();

        // Battery optimization services
        services.AddSingleton<IBatteryOptimizationService, BatteryOptimizationService>();
        services.AddSingleton<IPowerSaveModeService, PowerSaveModeService>();

        // Caching services
        services.AddSingleton<IIntelligentCacheService, IntelligentCacheService>();
        services.AddSingleton<IPredictiveCacheService, PredictiveCacheService>();

        // Network services
        services.AddSingleton<IAdaptiveNetworkService, AdaptiveNetworkService>();
        services.AddSingleton<IDataUsageOptimizationService, DataUsageOptimizationService>();

        // Telemetry and alerting services
        services.AddSingleton<IPerformanceTelemetryService, PerformanceTelemetryService>();
        services.AddSingleton<IPerformanceAlertingService, PerformanceAlertingService>();

        // Database performance services
        services.AddSingleton<IDbPerformanceService, DbPerformanceService>();
        services.AddSingleton<IDbMaintenanceService, DbMaintenanceService>();

        // Lifecycle and startup services
        services.AddSingleton<IAppLifecyclePerformanceService, AppLifecyclePerformanceService>();
        services.AddSingleton<IStartupPerformanceService, StartupPerformanceService>();

        // Baseline and testing services
        services.AddSingleton<IPerformanceBaselineService, PerformanceBaselineService>();
        services.AddSingleton<IAutomatedPerformanceTestingService, AutomatedPerformanceTestingService>();
    }
}
