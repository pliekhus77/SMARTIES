using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public interface IUserProfileService
{
    Task<UserProfile?> GetActiveProfileAsync();
    Task<List<UserProfile>> GetAllProfilesAsync();
    Task<UserProfile> CreateProfileAsync(UserProfile profile);
    Task<UserProfile> UpdateProfileAsync(UserProfile profile);
    
    // New methods for profile selection functionality
    Task<bool> IsFirstTimeUserAsync();
    Task<UserProfile> CreateGuestProfileAsync();
    Task<List<ProfileDisplayItem>> GetProfileDisplayItemsAsync();
    Task UpdateProfileUsageAsync(int profileId);    Task<bool> DeleteProfileAsync(int profileId);
    Task<bool> SetActiveProfileAsync(int profileId);
}
