using Microsoft.Extensions.Logging;
using Moq;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Services;
using Xunit;

namespace SMARTIES.MAUI.Tests;

public class FamilyProfileServiceTests
{
    private readonly Mock<IFamilyProfileRepository> _mockRepository;
    private readonly Mock<ILogger<FamilyProfileService>> _mockLogger;
    private readonly FamilyProfileService _service;

    public FamilyProfileServiceTests()
    {
        _mockRepository = new Mock<IFamilyProfileRepository>();
        _mockLogger = new Mock<ILogger<FamilyProfileService>>();
        _service = new FamilyProfileService(_mockRepository.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task CreateProfileAsync_ShouldCreateProfile_WithValidData()
    {
        // Arrange
        var name = "Test Profile";
        var description = "Test Description";
        
        _mockRepository.Setup(r => r.CreateAsync(It.IsAny<FamilyProfile>()))
            .Returns(Task.FromResult(1));

        // Act
        var result = await _service.CreateProfileAsync(name, description);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(name, result.Name);
        Assert.Equal(description, result.Description);
        Assert.False(result.IsActive);
        
        _mockRepository.Verify(r => r.CreateAsync(It.IsAny<FamilyProfile>()), Times.Once);
    }

    [Fact]
    public async Task GetActiveProfileAsync_ShouldReturnActiveProfile()
    {
        // Arrange
        var activeProfile = new FamilyProfile { Id = 1, Name = "Active", IsActive = true };
        _mockRepository.Setup(r => r.GetActiveAsync())
            .ReturnsAsync(activeProfile);

        // Act
        var result = await _service.GetActiveProfileAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(activeProfile.Id, result.Id);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task SwitchActiveProfileAsync_ShouldUpdateActiveProfile()
    {
        // Arrange
        var profileId = 2;
        var profile = new FamilyProfile { Id = profileId, Name = "New Active", IsActive = false };
        
        _mockRepository.Setup(r => r.SetActiveAsync(profileId))
            .Returns(Task.CompletedTask);
        _mockRepository.Setup(r => r.GetByIdAsync(profileId))
            .ReturnsAsync(profile);

        // Act
        await _service.SwitchActiveProfileAsync(profileId);

        // Assert
        _mockRepository.Verify(r => r.SetActiveAsync(profileId), Times.Once);
        _mockRepository.Verify(r => r.GetByIdAsync(profileId), Times.Once);
    }
}
