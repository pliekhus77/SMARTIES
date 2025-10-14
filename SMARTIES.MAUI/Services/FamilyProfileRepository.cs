using SQLite;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Data;

namespace SMARTIES.MAUI.Services;

public interface IFamilyProfileRepository
{
    Task<List<FamilyProfile>> GetAllAsync();
    Task<FamilyProfile?> GetByIdAsync(int id);
    Task<FamilyProfile?> GetActiveAsync();
    Task<int> CreateAsync(FamilyProfile profile);
    Task UpdateAsync(FamilyProfile profile);
    Task DeleteAsync(int id);
    Task SetActiveAsync(int id);
}

public class FamilyProfileRepository : IFamilyProfileRepository
{
    private readonly SQLiteAsyncConnection _database;
    private readonly ILogger<FamilyProfileRepository> _logger;

    public FamilyProfileRepository(AdvancedFeaturesDbService dbService, ILogger<FamilyProfileRepository> logger)
    {
        _database = dbService.Database;
        _logger = logger;
    }

    public async Task<List<FamilyProfile>> GetAllAsync()
    {
        try
        {
            return await _database.Table<FamilyProfile>()
                .OrderByDescending(p => p.IsActive)
                .ThenBy(p => p.Name)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all family profiles");
            return new List<FamilyProfile>();
        }
    }

    public async Task<FamilyProfile?> GetByIdAsync(int id)
    {
        try
        {
            return await _database.Table<FamilyProfile>()
                .Where(p => p.Id == id)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting family profile by id: {Id}", id);
            return null;
        }
    }

    public async Task<FamilyProfile?> GetActiveAsync()
    {
        try
        {
            return await _database.Table<FamilyProfile>()
                .Where(p => p.IsActive)
                .FirstOrDefaultAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting active family profile");
            return null;
        }
    }

    public async Task<int> CreateAsync(FamilyProfile profile)
    {
        try
        {
            profile.CreatedAt = DateTime.UtcNow;
            profile.UpdatedAt = DateTime.UtcNow;
            
            return await _database.InsertAsync(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating family profile: {Name}", profile.Name);
            throw;
        }
    }

    public async Task UpdateAsync(FamilyProfile profile)
    {
        try
        {
            profile.UpdatedAt = DateTime.UtcNow;
            await _database.UpdateAsync(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating family profile: {Id}", profile.Id);
            throw;
        }
    }

    public async Task DeleteAsync(int id)
    {
        try
        {
            await _database.DeleteAsync<FamilyProfile>(id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting family profile: {Id}", id);
            throw;
        }
    }

    public async Task SetActiveAsync(int id)
    {
        try
        {
            // Deactivate all profiles
            var allProfiles = await GetAllAsync();
            foreach (var profile in allProfiles)
            {
                profile.IsActive = false;
                await _database.UpdateAsync(profile);
            }

            // Activate the selected profile
            var targetProfile = await GetByIdAsync(id);
            if (targetProfile != null)
            {
                targetProfile.IsActive = true;
                await _database.UpdateAsync(targetProfile);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting active family profile: {Id}", id);
            throw;
        }
    }
}
