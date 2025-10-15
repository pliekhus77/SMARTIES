using Microsoft.UI.Xaml;

namespace SMARTIES.MAUI.WinUI;

public partial class App : MauiWinUIApplication
{
    public App()
    {
        this.InitializeComponent();
    }

    protected override MauiApp CreateMauiApp() => MauiProgram.CreateMauiApp();

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        base.OnLaunched(args);
        
        // Force window to be visible and bring to front
        try
        {
            var window = Microsoft.UI.Xaml.Window.Current;
            if (window != null)
            {
                window.Activate();
                
                // Try to get the window handle and force it to show
                var hwnd = WinRT.Interop.WindowNative.GetWindowHandle(window);
                if (hwnd != IntPtr.Zero)
                {
                    ShowWindow(hwnd, 1); // SW_SHOWNORMAL
                    SetForegroundWindow(hwnd);
                    BringWindowToTop(hwnd);
                }
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Window activation error: {ex.Message}");
        }
    }

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern bool BringWindowToTop(IntPtr hWnd);
}