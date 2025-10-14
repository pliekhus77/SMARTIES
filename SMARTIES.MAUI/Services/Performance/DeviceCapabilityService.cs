using SMARTIES.MAUI.Models.Performance;

namespace SMARTIES.MAUI.Services.Performance;

public class DeviceCapabilityService : IDeviceCapabilityService
{
    private DeviceCapabilities? _cachedCapabilities;

    public async Task<DeviceCapabilities> GetDeviceCapabilitiesAsync()
    {
        if (_cachedCapabilities != null)
            return _cachedCapabilities;

        _cachedCapabilities = new DeviceCapabilities
        {
            Platform = DeviceInfo.Platform.ToString(),
            MemoryMB = GetAvailableMemoryMB(),
            CpuCores = Environment.ProcessorCount,
            Tier = DetermineDeviceTier()
        };

        return _cachedCapabilities;
    }

    public DeviceTier GetDeviceTier()
    {
        var memoryMB = GetAvailableMemoryMB();
        var cores = Environment.ProcessorCount;

        if (memoryMB >= 6000 && cores >= 6)
            return DeviceTier.High;
        if (memoryMB >= 3000 && cores >= 4)
            return DeviceTier.Mid;
        return DeviceTier.Low;
    }

    public bool IsLowMemoryDevice() => GetAvailableMemoryMB() < 2000;

    private int GetAvailableMemoryMB()
    {
        try
        {
            var workingSet = GC.GetTotalMemory(false);
            return (int)(workingSet / (1024 * 1024));
        }
        catch
        {
            return 2048; // Default fallback
        }
    }

    private DeviceTier DetermineDeviceTier() => GetDeviceTier();
}
