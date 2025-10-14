using SMARTIES.Console.Models;

namespace SMARTIES.Console.Services;

public interface IUserProfileService
{
    Task<UserProfile?> GetActiveProfileAsync();
    Task<List<UserProfile>> GetAllProfilesAsync();
    Task<UserProfile> CreateProfileAsync(UserProfile profile);
    Task<UserProfile> UpdateProfileAsync(UserProfile profile);
    Task<bool> DeleteProfileAsync(int profileId);
    Task<bool> SetActiveProfileAsync(int profileId);
}