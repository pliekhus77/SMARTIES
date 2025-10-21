using Microsoft.Extensions.Logging;
using Moq;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.ViewModels;
using Xunit;

namespace SMARTIES.MAUI.Tests.ViewModels;

public class ProfileSelectionViewModelTests
{
    private readonly Mock<IUserProfileService> _mockUserProfileService;
    private readonly Mock<ILogger<ProfileSelectionViewModel>> _mockLogger;
    private readonly ProfileSelectionViewModel _viewModel;

    public ProfileSelectionViewModelTests()
    {
        _mockUserProfileService = new Mock<IUserProfileService>();
        _mockLogger = new Mock<ILogger<ProfileSelectionViewModel>>();
        _viewModel = new ProfileSelectionViewModel(_mockUserProfileService.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task LoadProfilesAsync_WhenFirstTimeUser_SetsIsFirstTimeUserTrue()
    {
        // Arrange
        _mockUserProfileService.Setup(x => x.IsFirstTimeUserAsync())
            .ReturnsAsync(true);

        // Act
        await _viewModel.LoadProfilesCommand.ExecuteAsync(null);

        // Assert
        Assert.True(_viewModel.IsFirstTimeUser);
        Assert.Empty(_viewModel.Profiles);
    }

    [Fact]
    public async Task LoadProfilesAsync_WhenExistingUser_LoadsProfiles()
    {
        // Arrange
        var profiles = new List<ProfileDisplayItem>
        {
            new ProfileDisplayItem { Id = 1, Name = "Test Profile 1" },
            new ProfileDisplayItem { Id = 2, Name = "Test Profile 2" }
        };

        _mockUserProfileService.Setup(x => x.IsFirstTimeUserAsync())
            .ReturnsAsync(false);
        _mockUserProfileService.Setup(x => x.GetProfileDisplayItemsAsync())
            .ReturnsAsync(profiles);

        // Act
        await _viewModel.LoadProfilesCommand.ExecuteAsync(null);

        // Assert
        Assert.False(_viewModel.IsFirstTimeUser);
        Assert.Equal(2, _viewModel.Profiles.Count);
        Assert.Equal("Test Profile 1", _viewModel.Profiles[0].Name);
    }

    [Fact]
    public async Task UseGuestModeAsync_CreatesGuestProfile()
    {
        // Arrange
        var guestProfile = new UserProfile { Id = 1, Name = "Guest", IsTemporary = true };
        _mockUserProfileService.Setup(x => x.CreateGuestProfileAsync())
            .ReturnsAsync(guestProfile);

        // Act
        await _viewModel.UseGuestModeCommand.ExecuteAsync(null);

        // Assert
        _mockUserProfileService.Verify(x => x.CreateGuestProfileAsync(), Times.Once);
    }

    [Fact]
    public async Task SelectProfileAsync_UpdatesUsageAndSetsActive()
    {
        // Arrange
        var profile = new ProfileDisplayItem { Id = 1, Name = "Test Profile" };

        // Act
        await _viewModel.SelectProfileCommand.ExecuteAsync(profile);

        // Assert
        _mockUserProfileService.Verify(x => x.SetActiveProfileAsync(1), Times.Once);
        _mockUserProfileService.Verify(x => x.UpdateProfileUsageAsync(1), Times.Once);
    }

    [Fact]
    public void ClearError_ClearsErrorMessage()
    {
        // Arrange
        _viewModel.ErrorMessage = "Test error";

        // Act
        _viewModel.ClearErrorCommand.Execute(null);

        // Assert
        Assert.Empty(_viewModel.ErrorMessage);
    }
}
