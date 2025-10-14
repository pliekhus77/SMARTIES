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
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ensuring default profile exists");
        }
    }
}