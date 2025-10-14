using Microsoft.Extensions.Logging;
using Moq;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Services.Performance;
using Xunit;

namespace SMARTIES.MAUI.Tests;

public class SplashScreenServiceTests
{
    private readonly Mock<ILogger<SplashScreenService>> _mockLogger;
    private readonly Mock<IStartupPerformanceService> _mockStartupPerformance;
    private readonly Mock<ISplashScreenAccessibilityService> _mockAccessibilityService;
    private readonly SplashScreenService _service;

    public SplashScreenServiceTests()
    {
        _mockLogger = new Mock<ILogger<SplashScreenService>>();
        _mockStartupPerformance = new Mock<IStartupPerformanceService>();
        _mockAccessibilityService = new Mock<ISplashScreenAccessibilityService>();
        
        _service = new SplashScreenService(
            _mockLogger.Object,
            _mockStartupPerformance.Object,
            _mockAccessibilityService.Object);
    }

    [Fact]
    public async Task InitializeAsync_ShouldCompleteSuccessfully()
    {
        // Arrange
        _mockAccessibilityService.Setup(a => a.AnnounceAppLoadingAsync())
            .Returns(Task.CompletedTask);

        // Act
        await _service.InitializeAsync();

        // Assert
        _mockAccessibilityService.Verify(a => a.AnnounceAppLoadingAsync(), Times.Once);
    }

    [Fact]
    public async Task ShowSplashScreenAsync_ShouldRaiseCompletionEvent()
    {
        // Arrange
        var eventRaised = false;
        SplashScreenEventArgs? eventArgs = null;
        
        _service.SplashScreenCompleted += (sender, args) =>
        {
            eventRaised = true;
            eventArgs = args;
        };

        _mockStartupPerformance.Setup(s => s.TrackStartupPhaseAsync(It.IsAny<string>(), It.IsAny<Func<Task>>()))
            .Returns<string, Func<Task>>((phase, action) => action());

        _mockAccessibilityService.Setup(a => a.AnnounceAppReadyAsync())
            .Returns(Task.CompletedTask);

        // Act
        await _service.ShowSplashScreenAsync();

        // Assert
        Assert.True(eventRaised);
        Assert.NotNull(eventArgs);
        Assert.True(eventArgs.DisplayDuration.TotalMilliseconds >= 0);
        Assert.Null(eventArgs.Error);
    }

    [Fact]
    public void SplashScreenConfiguration_ShouldHaveValidDefaults()
    {
        // Arrange & Act
        var config = new SplashScreenConfiguration();

        // Assert
        Assert.Equal(TimeSpan.FromSeconds(1), config.MinimumDisplayTime);
        Assert.Equal(TimeSpan.FromSeconds(3), config.MaximumDisplayTime);
        Assert.Equal(TimeSpan.FromSeconds(2), config.LoadingIndicatorThreshold);
        Assert.Equal("#FFFFFF", config.BackgroundColor);
        Assert.True(config.ShowLoadingIndicator);
    }
}
