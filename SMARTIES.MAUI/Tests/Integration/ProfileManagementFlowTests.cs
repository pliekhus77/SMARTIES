using Microsoft.Extensions.Logging;
using Moq;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Services;
using Xunit;

namespace SMARTIES.MAUI.Tests.Integration;

public class ProfileManagementFlowTests
{
    private readonly Mock<ILogger<UserProfileService>> _mockLogger;
    private readonly UserProfileService _userProfileService;

    public ProfileManagementFlowTests()
    {
        _mockLogger = new Mock<ILogger<UserProfileService>>();
        _userProfileService = new UserProfileService(_mockLogger.Object);
    }

    [Fact]
    public async Task CompleteProfileFlow_CreateSelectUpdateDelete_WorksCorrectly()
    {
        // Arrange - Create a new profile
        var newProfile = new UserProfile
        {
            Name = "Integration Test Profile",
            AvatarEmoji = "🧪",
            Allergies = "[\"Peanuts\"]",
            ReligiousRestrictions = "[]",
            MedicalRestrictions = "[]",
            LifestylePreferences = "[\"Vegan\"]"
        };

        // Act & Assert - Create profile
        var createdProfile = await _userProfileService.CreateProfileAsync(newProfile);
        Assert.NotEqual(0, createdProfile.Id);
        Assert.Equal("Integration Test Profile", createdProfile.Name);

        // Act & Assert - Set as active
        var setActiveResult = await _userProfileService.SetActiveProfileAsync(createdProfile.Id);
        Assert.True(setActiveResult);

        // Act & Assert - Get active profile
        var activeProfile = await _userProfileService.GetActiveProfileAsync();
        Assert.NotNull(activeProfile);
        Assert.Equal(createdProfile.Id, activeProfile.Id);

        // Act & Assert - Update usage
        await _userProfileService.UpdateProfileUsageAsync(createdProfile.Id);
        var updatedProfile = await _userProfileService.GetActiveProfileAsync();
        Assert.Equal(1, updatedProfile!.UsageCount);

        // Act & Assert - Get display items
        var displayItems = await _userProfileService.GetProfileDisplayItemsAsync();
        Assert.Contains(displayItems, item => item.Id == createdProfile.Id);

        // Act & Assert - Delete profile
        var deleteResult = await _userProfileService.DeleteProfileAsync(createdProfile.Id);
        Assert.True(deleteResult);

        // Verify profile is deleted
        var allProfiles = await _userProfileService.GetAllProfilesAsync();
        Assert.DoesNotContain(allProfiles, p => p.Id == createdProfile.Id);
    }

    [Fact]
    public async Task GuestProfileFlow_CreateAndCleanup_WorksCorrectly()
    {
        // Act - Create guest profile
        var guestProfile = await _userProfileService.CreateGuestProfileAsync();

        // Assert - Guest profile created correctly
        Assert.Equal("Guest", guestProfile.Name);
        Assert.True(guestProfile.IsTemporary);
        Assert.True(guestProfile.IsActive);

        // Act - Cleanup temporary profiles
        await _userProfileService.CleanupTemporaryProfilesAsync();

        // Assert - Guest profile cleaned up
        var allProfiles = await _userProfileService.GetAllProfilesAsync();
        Assert.DoesNotContain(allProfiles, p => p.Id == guestProfile.Id);
    }

    [Fact]
    public async Task FirstTimeUserDetection_WorksCorrectly()
    {
        // Act - Check if first time user (should be false due to default profile)
        var isFirstTime = await _userProfileService.IsFirstTimeUserAsync();

        // Assert - Should not be first time due to default profile creation
        Assert.False(isFirstTime);

        // Verify default profile exists
        var profiles = await _userProfileService.GetAllProfilesAsync();
        Assert.NotEmpty(profiles);
    }
}
