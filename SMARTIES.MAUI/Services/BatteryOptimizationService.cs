using Microsoft.Extensions.Logging;

namespace SMARTIES.MAUI.Services;

public interface IBatteryOptimizationService
{
    Task StartScanningTimeoutAsync(TimeSpan timeout, CancellationToken cancellationToken = default);
    void PauseScanning();
    void ResumeScanning();
    bool IsScanningPaused { get; }
}

public class BatteryOptimizationService : IBatteryOptimizationService
{
    private readonly ILogger<BatteryOptimizationService> _logger;
    private Timer? _scanningTimer;
    private bool _isScanningPaused;

    public bool IsScanningPaused => _isScanningPaused;

    public event EventHandler? ScanningTimedOut;

    public BatteryOptimizationService(ILogger<BatteryOptimizationService> logger)
    {
        _logger = logger;
    }

    public Task StartScanningTimeoutAsync(TimeSpan timeout, CancellationToken cancellationToken = default)
    {
        _scanningTimer?.Dispose();
        
        _scanningTimer = new Timer(OnScanningTimeout, null, timeout, Timeout.InfiniteTimeSpan);
        
        _logger.LogInformation("Started scanning timeout for {Timeout} seconds", timeout.TotalSeconds);
        
        return Task.CompletedTask;
    }

    public void PauseScanning()
    {
        _isScanningPaused = true;
        _scanningTimer?.Dispose();
        _logger.LogInformation("Scanning paused for battery optimization");
    }

    public void ResumeScanning()
    {
        _isScanningPaused = false;
        _logger.LogInformation("Scanning resumed");
    }

    private void OnScanningTimeout(object? state)
    {
        _logger.LogInformation("Scanning timed out after 30 seconds");
        PauseScanning();
        ScanningTimedOut?.Invoke(this, EventArgs.Empty);
    }

    public void Dispose()
    {
        _scanningTimer?.Dispose();
    }
}
