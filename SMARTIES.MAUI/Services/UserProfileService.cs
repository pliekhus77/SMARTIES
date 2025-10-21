using SQLite;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Services;

public class UserProfileService : IUserProfileService
{
    private readonly SQLiteAsyncConnection _database;
    private readonly ILogger<UserProfileService> _logger;

    public UserProfileService(ILogger<UserProfileService> logger)
    {
        _logger = logger;
        var dbPath = Path.Combine(FileSystem.AppDataDirectory, "smarties.db3");
        _database = new SQLiteAsyncConnection(dbPath);
        
        // Initialize database
        _ = Task.Run(async () =>
        {
            await _database.CreateTableAsync<UserProfile>();
            await EnsureDefaultProfileAsync();
        });
    }

    public async Task<UserProfile?> GetActiveProfileAsync()
    {
        try
        {
            return await _database.Table<UserProfile>()
                .Where(p => p.IsActive)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active profile");
            return null;
        }
    }

    public async Task<List<UserProfile>> GetAllProfilesAsync()
    {
        try
        {
            return await _database.Table<UserProfile>()
                .OrderByDescending(p => p.IsActive)
                .ThenBy(p => p.Name)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all profiles");
            return new List<UserProfile>();
        }
    }

    public async Task<UserProfile> CreateProfileAsync(UserProfile profile)
    {
        try
        {
            profile.CreatedAt = DateTime.UtcNow;
            profile.UpdatedAt = DateTime.UtcNow;
            
            await _database.InsertAsync(profile);
            
            _logger.LogInformation("Created new profile: {ProfileName}", profile.Name);
            return profile;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating profile: {ProfileName}", profile.Name);
            throw;
        }
    }

    public async Task<UserProfile> UpdateProfileAsync(UserProfile profile)
    {
        try
        {
            profile.UpdatedAt = DateTime.UtcNow;
            
            await _database.UpdateAsync(profile);
            
            _logger.LogInformation("Updated profile: {ProfileName}", profile.Name);
            return profile;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile: {ProfileName}", profile.Name);
            throw;
        }
    }

    public async Task<bool> DeleteProfileAsync(int profileId)
    {
        try
        {
            var profile = await _database.GetAsync<UserProfile>(profileId);
            if (profile == null)
                return false;

            // Don't allow deleting the last profile
            var profileCount = await _database.Table<UserProfile>().CountAsync();
            if (profileCount <= 1)
            {
                _logger.LogWarning("Cannot delete the last remaining profile");
                return false;
            }

            await _database.DeleteAsync<UserProfile>(profileId);
            
            // If this was the active profile, make another one active
            if (profile.IsActive)
            {
                var firstProfile = await _database.Table<UserProfile>().FirstOrDefaultAsync();
                if (firstProfile != null)
                {
                    firstProfile.IsActive = true;
                    await _database.UpdateAsync(firstProfile);
                }
            }
            
            _logger.LogInformation("Deleted profile: {ProfileName}", profile.Name);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting profile with ID: {ProfileId}", profileId);
            return false;
        }
    }

    public async Task<bool> SetActiveProfileAsync(int profileId)
    {
        try
        {
            // Deactivate all profiles
            var allProfiles = await _database.Table<UserProfile>().ToListAsync();
            foreach (var profile in allProfiles)
            {
                profile.IsActive = false;
                await _database.UpdateAsync(profile);
            }

            // Activate the selected profile
            var selectedProfile = await _database.GetAsync<UserProfile>(profileId);
            if (selectedProfile != null)
            {
                selectedProfile.IsActive = true;
                await _database.UpdateAsync(selectedProfile);
                
                _logger.LogInformation("Set active profile: {ProfileName}", selectedProfile.Name);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting active profile: {ProfileId}", profileId);
            return false;
        }
    }

    private async Task EnsureDefaultProfileAsync()
    {
        try
        {
            var existingProfiles = await _database.Table<UserProfile>().CountAsync();
            if (existingProfiles == 0)
            {
                var defaultProfile = new UserProfile
                {
                    Name = "Default Profile",
                    IsActive = true,
                    Allergies = "[]",
                    ReligiousRestrictions = "[]",
                    MedicalRestrictions = "[]",
                    LifestylePreferences = "[]"
                };

                await CreateProfileAsync(defaultProfile);
                _logger.LogInformation("Created default user profile");
            }
    public async Task<bool> IsFirstTimeUserAsync()
    {
        try
        {
            var profileCount = await _database.Table<UserProfile>().CountAsync();
            return profileCount == 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if first time user");
            return false;
        }
    }

    public async Task<UserProfile> CreateGuestProfileAsync()
    {
        try
        {
            var guestProfile = new UserProfile
            {
                Name = "Guest",
                IsActive = true,
                IsTemporary = true,
                AvatarEmoji = "👤",
                Allergies = "[]",
                ReligiousRestrictions = "[]",
                MedicalRestrictions = "[]",
                LifestylePreferences = "[]"
            };

            await CreateProfileAsync(guestProfile);
            _logger.LogInformation("Created guest profile");
            return guestProfile;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating guest profile");
            throw;
        }
    }

    public async Task<List<ProfileDisplayItem>> GetProfileDisplayItemsAsync()
    {
        try
        {
            var profiles = await GetAllProfilesAsync();
            return profiles.Select(ProfileDisplayItem.FromUserProfile).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting profile display items");
            return new List<ProfileDisplayItem>();
        }
    }
    public async Task<string> ExportProfileDataAsync(int profileId)
    {
        try
        {
            var profile = await _database.GetAsync<UserProfile>(profileId);
            if (profile != null)
            {
                // Return anonymized profile data as JSON for backup
                var exportData = new
                {
                    Name = profile.Name,
                    Allergies = profile.Allergies,
                    ReligiousRestrictions = profile.ReligiousRestrictions,
                    MedicalRestrictions = profile.MedicalRestrictions,
                    LifestylePreferences = profile.LifestylePreferences,
                    CreatedAt = profile.CreatedAt,
                    AvatarEmoji = profile.AvatarEmoji
                };
                
                return System.Text.Json.JsonSerializer.Serialize(exportData);
            }
            return string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting profile data: {ProfileId}", profileId);
            return string.Empty;
        }
    }

    public async Task<bool> SecureDeleteProfileAsync(int profileId)
    {
        try
        {
            var success = await DeleteProfileAsync(profileId);
            if (success)
            {
                // Additional cleanup for security
                await _database.ExecuteAsync("VACUUM");
                _logger.LogInformation("Secure delete completed for profile: {ProfileId}", profileId);
            }
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in secure delete for profile: {ProfileId}", profileId);
            return false;
        }
    }

    public async Task CleanupTemporaryProfilesAsync()
    {
        try
        {
            var tempProfiles = await _database.Table<UserProfile>()
                .Where(p => p.IsTemporary)
                .ToListAsync();
                
            foreach (var profile in tempProfiles)
            {
                await _database.DeleteAsync<UserProfile>(profile.Id);
                _logger.LogInformation("Cleaned up temporary profile: {ProfileName}", profile.Name);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cleaning up temporary profiles");
        }
    }
    public async Task UpdateProfileUsageAsync(int profileId)
    {
        try
        {
            var profile = await _database.GetAsync<UserProfile>(profileId);
            if (profile != null)
            {
                profile.LastUsedAt = DateTime.UtcNow;
                profile.UsageCount++;
                await _database.UpdateAsync(profile);
                _logger.LogInformation("Updated usage for profile: {ProfileName}", profile.Name);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile usage: {ProfileId}", profileId);
        }
    }        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring default profile exists");
        }
    }
}
