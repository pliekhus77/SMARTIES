namespace SMARTIES.MAUI.Services;

public interface ISplashScreenService
{
    Task InitializeAsync();
    Task ShowSplashScreenAsync();
    event EventHandler<SplashScreenEventArgs>? SplashScreenCompleted;
}

public class SplashScreenConfiguration
{
    public TimeSpan MinimumDisplayTime { get; set; } = TimeSpan.FromSeconds(1);
    public TimeSpan MaximumDisplayTime { get; set; } = TimeSpan.FromSeconds(3);
    public TimeSpan LoadingIndicatorThreshold { get; set; } = TimeSpan.FromSeconds(2);
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public bool ShowLoadingIndicator { get; set; } = true;
}

public class SplashScreenEventArgs : EventArgs
{
    public TimeSpan DisplayDuration { get; set; }
    public bool TimedOut { get; set; }
    public Exception? Error { get; set; }
}
