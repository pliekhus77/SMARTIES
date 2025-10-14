namespace SMARTIES.MAUI.Services.Performance;

public interface IPowerSaveModeService
{
    Task<bool> MonitorBatteryLevelAsync();
    Task ActivatePowerSaveModeAsync();
    Task DeactivatePowerSaveModeAsync();
    bool IsPowerSaveModeActive { get; }
}

public class PowerSaveModeService : IPowerSaveModeService
{
    private readonly IBatteryOptimizationService _batteryOptimizationService;
    private bool _isPowerSaveModeActive = false;
    private readonly double _lowBatteryThreshold = 0.2; // 20%

    public PowerSaveModeService(IBatteryOptimizationService batteryOptimizationService)
    {
        _batteryOptimizationService = batteryOptimizationService;
    }

    public bool IsPowerSaveModeActive => _isPowerSaveModeActive;

    public async Task<bool> MonitorBatteryLevelAsync()
    {
        try
        {
            var batteryLevel = Battery.ChargeLevel;
            var shouldActivate = batteryLevel < _lowBatteryThreshold && Battery.State != BatteryState.Charging;

            if (shouldActivate && !_isPowerSaveModeActive)
            {
                await ActivatePowerSaveModeAsync();
                return true;
            }
            else if (!shouldActivate && _isPowerSaveModeActive)
            {
                await DeactivatePowerSaveModeAsync();
                return false;
            }

            return _isPowerSaveModeActive;
        }
        catch
        {
            return false;
        }
    }

    public async Task ActivatePowerSaveModeAsync()
    {
        _isPowerSaveModeActive = true;
        await _batteryOptimizationService.OptimizeCameraUsageAsync();
        await _batteryOptimizationService.ReduceBackgroundProcessingAsync();
    }

    public Task DeactivatePowerSaveModeAsync()
    {
        _isPowerSaveModeActive = false;
        return Task.CompletedTask;
    }
}
