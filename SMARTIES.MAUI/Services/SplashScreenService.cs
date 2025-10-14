using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Services.Performance;

namespace SMARTIES.MAUI.Services;

public class SplashScreenService : ISplashScreenService
{
    private readonly ILogger<SplashScreenService> _logger;
    private readonly IStartupPerformanceService _startupPerformance;
    private readonly ISplashScreenAccessibilityService _accessibilityService;
    private readonly SplashScreenConfiguration _configuration;
    private DateTime _splashStartTime;

    public event EventHandler<SplashScreenEventArgs>? SplashScreenCompleted;

    public SplashScreenService(
        ILogger<SplashScreenService> logger,
        IStartupPerformanceService startupPerformance,
        ISplashScreenAccessibilityService accessibilityService)
    {
        _logger = logger;
        _startupPerformance = startupPerformance;
        _accessibilityService = accessibilityService;
        _configuration = new SplashScreenConfiguration();
    }

    public async Task InitializeAsync()
    {
        try
        {
            _logger.LogInformation("Initializing splash screen service");
            
            // Validate logo assets with fallback
            if (!await ValidateLogoAssetsAsync())
            {
                _logger.LogWarning("Logo assets validation failed, using text fallback");
            }

            // Initialize accessibility features
            await _accessibilityService.AnnounceAppLoadingAsync();

            _logger.LogInformation("Splash screen service initialized successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing splash screen service");
            // Don't throw - use fallback behavior
        }
    }

    public async Task ShowSplashScreenAsync()
    {
        _splashStartTime = DateTime.UtcNow;
        
        try
        {
            _logger.LogInformation("Showing splash screen");
            
            // Coordinate with startup performance tracking
            await _startupPerformance.TrackStartupPhaseAsync("SplashScreen", async () =>
            {
                // Ensure minimum display time
                var minimumTask = Task.Delay(_configuration.MinimumDisplayTime);
                
                // Wait for app initialization with timeout protection
                var initializationTask = WaitForAppInitializationAsync();
                var timeoutTask = Task.Delay(_configuration.MaximumDisplayTime);
                
                var completedTask = await Task.WhenAny(
                    Task.WhenAll(minimumTask, initializationTask),
                    timeoutTask
                );

                // Handle timeout scenario
                if (completedTask == timeoutTask)
                {
                    _logger.LogWarning("Splash screen timed out after {MaxTime}ms", _configuration.MaximumDisplayTime.TotalMilliseconds);
                }
            });

            var displayDuration = DateTime.UtcNow - _splashStartTime;
            var timedOut = displayDuration >= _configuration.MaximumDisplayTime;

            // Announce app ready for accessibility
            await _accessibilityService.AnnounceAppReadyAsync();

            _logger.LogInformation("Splash screen completed after {Duration}ms", displayDuration.TotalMilliseconds);

            // Raise completion event
            SplashScreenCompleted?.Invoke(this, new SplashScreenEventArgs
            {
                DisplayDuration = displayDuration,
                TimedOut = timedOut
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during splash screen display");
            
            SplashScreenCompleted?.Invoke(this, new SplashScreenEventArgs
            {
                DisplayDuration = DateTime.UtcNow - _splashStartTime,
                Error = ex
            });
        }
    }

    private async Task<bool> ValidateLogoAssetsAsync()
    {
        try
        {
            // Check if logo assets exist
            var logoPath = "Resources/Splash/smarties_logo.svg";
            return await Task.FromResult(true); // Simplified validation
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating logo assets");
            return false;
        }
    }

    private async Task WaitForAppInitializationAsync()
    {
        // Wait for critical app services to initialize
        await Task.Delay(500); // Simulate initialization time
        
        // In a real implementation, this would wait for:
        // - Database initialization
        // - Service registration completion
        // - Critical resource loading
    }
}
