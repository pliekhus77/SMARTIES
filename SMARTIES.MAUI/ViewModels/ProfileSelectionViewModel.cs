using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Services;

namespace SMARTIES.MAUI.ViewModels;

public partial class ProfileSelectionViewModel : ObservableObject
{
    private readonly IUserProfileService _userProfileService;
    private readonly ILogger<ProfileSelectionViewModel> _logger;

    [ObservableProperty]
    private bool isFirstTimeUser;

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private string errorMessage = string.Empty;

    [ObservableProperty]
    private ObservableCollection<ProfileDisplayItem> profiles = new();

    [ObservableProperty]
    private ProfileDisplayItem? selectedProfile;

    public ProfileSelectionViewModel(IUserProfileService userProfileService, ILogger<ProfileSelectionViewModel> logger)
    {
        _userProfileService = userProfileService;
        _logger = logger;
    }

    [RelayCommand]
    private async Task LoadProfilesAsync()
    {
        try
        {
            IsLoading = true;
            ErrorMessage = string.Empty;

            IsFirstTimeUser = await _userProfileService.IsFirstTimeUserAsync();
            
            if (!IsFirstTimeUser)
            {
                var profileItems = await _userProfileService.GetProfileDisplayItemsAsync();
                Profiles.Clear();
                foreach (var profile in profileItems)
                {
                    Profiles.Add(profile);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading profiles");
            ErrorMessage = "Failed to load profiles. Please try again.";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task SelectProfileAsync(ProfileDisplayItem profile)
    {
        try
        {
            IsLoading = true;
            
            await _userProfileService.SetActiveProfileAsync(profile.Id);
            await _userProfileService.UpdateProfileUsageAsync(profile.Id);
            
            SelectedProfile = profile;
            
            // Navigate to scanner page
            await Shell.Current.GoToAsync("//scanner");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error selecting profile: {ProfileName}", profile.Name);
            ErrorMessage = "Failed to select profile. Please try again.";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task CreateNewProfileAsync()
    {
        try
        {
            // Navigate to profile creation page
            await Shell.Current.GoToAsync("//profile/create");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error navigating to profile creation");
            ErrorMessage = "Failed to navigate to profile creation.";
        }
    }

    [RelayCommand]
    private async Task UseGuestModeAsync()
    {
        try
        {
            IsLoading = true;
            
            var guestProfile = await _userProfileService.CreateGuestProfileAsync();
            
            // Navigate to scanner page
            await Shell.Current.GoToAsync("//scanner");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating guest profile");
            ErrorMessage = "Failed to create guest profile. Please try again.";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task EditProfileAsync(ProfileDisplayItem profile)
    {
        try
        {
            // Navigate to profile edit page with profile ID
            await Shell.Current.GoToAsync($"//profile/edit?id={profile.Id}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error navigating to profile edit: {ProfileName}", profile.Name);
            ErrorMessage = "Failed to navigate to profile edit.";
        }
    }

    [RelayCommand]
    private async Task DeleteProfileAsync(ProfileDisplayItem profile)
    {
        try
        {
            // Show confirmation dialog
            bool confirmed = await Shell.Current.DisplayAlert(
                "Delete Profile", 
                $"Are you sure you want to delete '{profile.Name}'? This action cannot be undone.", 
                "Delete", 
                "Cancel");

            if (confirmed)
            {
                IsLoading = true;
                
                bool success = await _userProfileService.DeleteProfileAsync(profile.Id);
                if (success)
                {
                    Profiles.Remove(profile);
                    
                    // If no profiles left, show first time user experience
                    if (Profiles.Count == 0)
                    {
                        IsFirstTimeUser = true;
                    }
                }
                else
                {
                    ErrorMessage = "Failed to delete profile. Please try again.";
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting profile: {ProfileName}", profile.Name);
            ErrorMessage = "Failed to delete profile. Please try again.";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void ClearError()
    {
        ErrorMessage = string.Empty;
    }
}
