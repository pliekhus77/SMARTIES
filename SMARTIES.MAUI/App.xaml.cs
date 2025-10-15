namespace SMARTIES.MAUI;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();
    }

    protected override Window CreateWindow(IActivationState? activationState)
    {
        var window = new Window(new ContentPage
        {
            Title = "SMARTIES",
            BackgroundColor = Colors.LightBlue,
            Content = new StackLayout
            {
                VerticalOptions = LayoutOptions.Center,
                HorizontalOptions = LayoutOptions.Center,
                Children = {
                    new Label 
                    { 
                        Text = "🎉 SMARTIES IS RUNNING! 🎉", 
                        FontSize = 32, 
                        FontAttributes = FontAttributes.Bold,
                        TextColor = Colors.DarkBlue,
                        HorizontalOptions = LayoutOptions.Center 
                    },
                    new Label 
                    { 
                        Text = "The MAUI app is working correctly!", 
                        FontSize = 18, 
                        TextColor = Colors.DarkGreen,
                        HorizontalOptions = LayoutOptions.Center,
                        Margin = new Thickness(0, 20, 0, 0)
                    },
                    new Button
                    {
                        Text = "Click Me!",
                        BackgroundColor = Colors.Orange,
                        TextColor = Colors.White,
                        Margin = new Thickness(0, 30, 0, 0),
                        Command = new Command(async () => 
                        {
                            await Application.Current.MainPage.DisplayAlert("Success!", "Button clicked! SMARTIES app is fully functional.", "OK");
                        })
                    }
                }
            }
        })
        {
            Title = "SMARTIES - Dietary Scanner"
        };

        return window;
    }
}
