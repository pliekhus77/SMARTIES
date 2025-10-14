using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;
using System.Text.Json;

namespace SMARTIES.MAUI.Services;

public interface IFamilyProfileService
{
    Task<List<FamilyProfile>> GetAllProfilesAsync();
    Task<FamilyProfile?> GetActiveProfileAsync();
    Task<FamilyProfile> CreateProfileAsync(string name, string? description = null, string? photoPath = null);
    Task UpdateProfileAsync(FamilyProfile profile);
    Task DeleteProfileAsync(int id);
    Task SwitchActiveProfileAsync(int id);
    Task<FamilyProfile> DuplicateProfileAsync(int sourceId, string newName);
}

public class FamilyProfileService : IFamilyProfileService
{
    private readonly IFamilyProfileRepository _repository;
    private readonly ILogger<FamilyProfileService> _logger;
    private FamilyProfile? _cachedActiveProfile;

    public FamilyProfileService(IFamilyProfileRepository repository, ILogger<FamilyProfileService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<List<FamilyProfile>> GetAllProfilesAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task<FamilyProfile?> GetActiveProfileAsync()
    {
        if (_cachedActiveProfile?.IsActive == true)
            return _cachedActiveProfile;

        _cachedActiveProfile = await _repository.GetActiveAsync();
        return _cachedActiveProfile;
    }

    public async Task<FamilyProfile> CreateProfileAsync(string name, string? description = null, string? photoPath = null)
    {
        var profile = new FamilyProfile
        {
            Name = name,
            Description = description,
            PhotoPath = photoPath,
            IsActive = false,
            DietaryRestrictionsJson = "{}",
            PreferencesJson = "{}",
            MetadataJson = "{}"
        };

        await _repository.CreateAsync(profile);
        _logger.LogInformation("Created family profile: {Name}", name);
        
        return profile;
    }

    public async Task UpdateProfileAsync(FamilyProfile profile)
    {
        await _repository.UpdateAsync(profile);
        
        // Update cache if this is the active profile
        if (profile.IsActive)
            _cachedActiveProfile = profile;
            
        _logger.LogInformation("Updated family profile: {Name}", profile.Name);
    }

    public async Task DeleteProfileAsync(int id)
    {
        var profile = await _repository.GetByIdAsync(id);
        if (profile == null)
            throw new ArgumentException($"Profile with id {id} not found");

        if (profile.IsActive)
        {
            // If deleting active profile, activate another one if available
            var allProfiles = await _repository.GetAllAsync();
            var otherProfile = allProfiles.FirstOrDefault(p => p.Id != id);
            if (otherProfile != null)
            {
                await _repository.SetActiveAsync(otherProfile.Id);
                _cachedActiveProfile = otherProfile;
            }
            else
            {
                _cachedActiveProfile = null;
            }
        }

        await _repository.DeleteAsync(id);
        _logger.LogInformation("Deleted family profile: {Name}", profile.Name);
    }

    public async Task SwitchActiveProfileAsync(int id)
    {
        await _repository.SetActiveAsync(id);
        _cachedActiveProfile = await _repository.GetByIdAsync(id);
        
        _logger.LogInformation("Switched to active profile: {Name}", _cachedActiveProfile?.Name);
    }

    public async Task<FamilyProfile> DuplicateProfileAsync(int sourceId, string newName)
    {
        var sourceProfile = await _repository.GetByIdAsync(sourceId);
        if (sourceProfile == null)
            throw new ArgumentException($"Source profile with id {sourceId} not found");

        var duplicatedProfile = new FamilyProfile
        {
            Name = newName,
            Description = sourceProfile.Description,
            PhotoPath = sourceProfile.PhotoPath,
            IsActive = false,
            DietaryRestrictionsJson = sourceProfile.DietaryRestrictionsJson,
            PreferencesJson = sourceProfile.PreferencesJson,
            MetadataJson = sourceProfile.MetadataJson
        };

        await _repository.CreateAsync(duplicatedProfile);
        _logger.LogInformation("Duplicated profile {SourceName} to {NewName}", sourceProfile.Name, newName);
        
        return duplicatedProfile;
    }
}
