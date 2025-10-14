using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Services;
using System.Collections.ObjectModel;

namespace SMARTIES.MAUI.ViewModels;

public partial class FamilyProfilesViewModel : ObservableObject
{
    private readonly IFamilyProfileService _profileService;

    [ObservableProperty]
    private ObservableCollection<FamilyProfile> profiles = new();

    [ObservableProperty]
    private bool isLoading;

    public FamilyProfilesViewModel(IFamilyProfileService profileService)
    {
        _profileService = profileService;
    }

    public async Task InitializeAsync()
    {
        await LoadProfilesAsync();
    }

    [RelayCommand]
    private async Task LoadProfilesAsync()
    {
        try
        {
            IsLoading = true;
            var profileList = await _profileService.GetAllProfilesAsync();
            
            Profiles.Clear();
            foreach (var profile in profileList)
            {
                Profiles.Add(profile);
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to load profiles: {ex.Message}", "OK");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task AddProfileAsync()
    {
        try
        {
            var name = await Shell.Current.DisplayPromptAsync("New Profile", "Enter profile name:");
            if (!string.IsNullOrWhiteSpace(name))
            {
                await _profileService.CreateProfileAsync(name);
                await LoadProfilesAsync();
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to create profile: {ex.Message}", "OK");
        }
    }

    [RelayCommand]
    private async Task SwitchProfileAsync(int profileId)
    {
        try
        {
            await _profileService.SwitchActiveProfileAsync(profileId);
            await LoadProfilesAsync();
            await Shell.Current.DisplayAlert("Success", "Profile switched successfully", "OK");
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to switch profile: {ex.Message}", "OK");
        }
    }

    [RelayCommand]
    private async Task EditProfileAsync(FamilyProfile profile)
    {
        try
        {
            var newName = await Shell.Current.DisplayPromptAsync("Edit Profile", "Enter new name:", initialValue: profile.Name);
            if (!string.IsNullOrWhiteSpace(newName) && newName != profile.Name)
            {
                profile.Name = newName;
                await _profileService.UpdateProfileAsync(profile);
                await LoadProfilesAsync();
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", $"Failed to update profile: {ex.Message}", "OK");
        }
    }
}
