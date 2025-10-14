using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public interface IUserProfileService
{
    Task<UserProfile?> GetActiveProfileAsync();
    Task<List<UserProfile>> GetAllProfilesAsync();
    Task<UserProfile> CreateProfileAsync(UserProfile profile);
    Task<UserProfile> UpdateProfileAsync(UserProfile profile);
    Task<bool> DeleteProfileAsync(int profileId);
    Task<bool> SetActiveProfileAsync(int profileId);
}