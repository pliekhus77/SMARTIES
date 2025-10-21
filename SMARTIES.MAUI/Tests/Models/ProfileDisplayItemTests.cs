using SMARTIES.MAUI.Models;
using Xunit;

namespace SMARTIES.MAUI.Tests.Models;

public class ProfileDisplayItemTests
{
    [Fact]
    public void LastUsedDisplay_WhenNeverUsed_ReturnsNever()
    {
        // Arrange
        var item = new ProfileDisplayItem { LastUsedAt = default };

        // Act
        var result = item.LastUsedDisplay;

        // Assert
        Assert.Equal("Never", result);
    }

    [Fact]
    public void LastUsedDisplay_WhenUsedToday_ReturnsToday()
    {
        // Arrange
        var item = new ProfileDisplayItem { LastUsedAt = DateTime.Today };

        // Act
        var result = item.LastUsedDisplay;

        // Assert
        Assert.Equal("Today", result);
    }

    [Fact]
    public void LastUsedDisplay_WhenUsedYesterday_ReturnsYesterday()
    {
        // Arrange
        var item = new ProfileDisplayItem { LastUsedAt = DateTime.Today.AddDays(-1) };

        // Act
        var result = item.LastUsedDisplay;

        // Assert
        Assert.Equal("Yesterday", result);
    }

    [Fact]
    public void UsageDisplay_WhenNoUsage_ReturnsNew()
    {
        // Arrange
        var item = new ProfileDisplayItem { UsageCount = 0 };

        // Act
        var result = item.UsageDisplay;

        // Assert
        Assert.Equal("New", result);
    }

    [Fact]
    public void UsageDisplay_WhenHasUsage_ReturnsScansCount()
    {
        // Arrange
        var item = new ProfileDisplayItem { UsageCount = 5 };

        // Act
        var result = item.UsageDisplay;

        // Assert
        Assert.Equal("5 scans", result);
    }

    [Fact]
    public void FromUserProfile_CreatesCorrectDisplayItem()
    {
        // Arrange
        var userProfile = new UserProfile
        {
            Id = 1,
            Name = "Test Profile",
            AvatarEmoji = "👤",
            LastUsedAt = DateTime.Today,
            UsageCount = 10,
            IsTemporary = false,
            IsActive = true,
            Allergies = "[\"Peanuts\"]",
            ReligiousRestrictions = "[]",
            MedicalRestrictions = "[]",
            LifestylePreferences = "[]"
        };

        // Act
        var result = ProfileDisplayItem.FromUserProfile(userProfile);

        // Assert
        Assert.Equal(1, result.Id);
        Assert.Equal("Test Profile", result.Name);
        Assert.Equal("👤", result.AvatarEmoji);
        Assert.Equal(DateTime.Today, result.LastUsedAt);
        Assert.Equal(10, result.UsageCount);
        Assert.False(result.IsTemporary);
        Assert.True(result.IsActive);
        Assert.Contains("Allergies", result.RestrictionsSummary);
    }
}
