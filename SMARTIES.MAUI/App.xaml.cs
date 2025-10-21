namespace SMARTIES.MAUI;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();
        MainPage = new AppShell();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        return new Window(MainPage!)
        {
            Title = "SMARTIES - Dietary Scanner"
        };
    }
}
