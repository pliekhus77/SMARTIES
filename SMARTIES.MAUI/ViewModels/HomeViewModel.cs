using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System.Collections.ObjectModel;

namespace SMARTIES.MAUI.ViewModels;

public partial class HomeViewModel : ObservableObject
{
    [ObservableProperty]
    private ObservableCollection<RecentScanItem> recentScans;

    [ObservableProperty]
    private string statusSummary;

    [ObservableProperty]
    private string statusDetail;

    public HomeViewModel()
    {
        // Initialize with sample data matching the design
        RecentScans = new ObservableCollection<RecentScanItem>
        {
            new RecentScanItem
            {
                ProductName = "Chocolate Bar",
                Icon = "🍫",
                IconBackgroundColor = "#8D6E63",
                HasWarning = true,
                WarningIcon = "⚠",
                WarningBackgroundColor = "#F44336",
                StatusIcon = "⚠",
                StatusBackgroundColor = "#424242"
            },
            new RecentScanItem
            {
                ProductName = "Pasta Sauce",
                Icon = "🥫",
                IconBackgroundColor = "#FF5722",
                HasWarning = false,
                StatusIcon = "✓",
                StatusBackgroundColor = "#FFC107"
            },
            new RecentScanItem
            {
                ProductName = "Seltzer Water",
                Icon = "🥤",
                IconBackgroundColor = "#4CAF50",
                HasWarning = false,
                StatusIcon = "✓",
                StatusBackgroundColor = "#4CAF50"
            }
        };

        StatusSummary = "1 caution: contains dairy";
        StatusDetail = "All clear!";
    }

    [RelayCommand]
    private async Task ScanBarcode()
    {
        await Shell.Current.DisplayAlert("Scanner", "Barcode scanner will be implemented here!", "OK");
    }

    [RelayCommand]
    private async Task NavigateToHistory()
    {
        await Shell.Current.GoToAsync("History");
    }

    [RelayCommand]
    private async Task NavigateToProfile()
    {
        await Shell.Current.GoToAsync("Profile");
    }

    [RelayCommand]
    private async Task NavigateToSettings()
    {
        await Shell.Current.GoToAsync("Settings");
    }
}

public partial class RecentScanItem : ObservableObject
{
    [ObservableProperty]
    private string productName = string.Empty;

    [ObservableProperty]
    private string icon = string.Empty;

    [ObservableProperty]
    private string iconBackgroundColor = "#E0E0E0";

    [ObservableProperty]
    private bool hasWarning;

    [ObservableProperty]
    private string warningIcon = string.Empty;

    [ObservableProperty]
    private string warningBackgroundColor = "#F44336";

    [ObservableProperty]
    private string statusIcon = string.Empty;

    [ObservableProperty]
    private string statusBackgroundColor = "#4CAF50";
}