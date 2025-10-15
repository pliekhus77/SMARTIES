using Microsoft.Maui.Controls;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Views.Controls;

public partial class SafetyIndicator : ContentView
{
    public static readonly BindableProperty ComplianceLevelProperty =
        BindableProperty.Create(nameof(ComplianceLevel), typeof(ComplianceLevel), typeof(SafetyIndicator), 
            ComplianceLevel.Safe, propertyChanged: OnComplianceLevelChanged);

    public static readonly BindableProperty ConfidenceScoreProperty =
        BindableProperty.Create(nameof(ConfidenceScore), typeof(double), typeof(SafetyIndicator), 
            0.0, propertyChanged: OnConfidenceScoreChanged);

    public ComplianceLevel ComplianceLevel
    {
        get => (ComplianceLevel)GetValue(ComplianceLevelProperty);
        set => SetValue(ComplianceLevelProperty, value);
    }

    public double ConfidenceScore
    {
        get => (double)GetValue(ConfidenceScoreProperty);
        set => SetValue(ConfidenceScoreProperty, value);
    }

    public SafetyIndicator()
    {
        InitializeComponent();
        UpdateIndicator();
    }

    private static void OnComplianceLevelChanged(BindableObject bindable, object oldValue, object newValue)
    {
        if (bindable is SafetyIndicator indicator)
        {
            indicator.UpdateIndicator();
        }
    }

    private static void OnConfidenceScoreChanged(BindableObject bindable, object oldValue, object newValue)
    {
        if (bindable is SafetyIndicator indicator)
        {
            indicator.UpdateConfidence();
        }
    }

    private void UpdateIndicator()
    {
        switch (ComplianceLevel)
        {
            case ComplianceLevel.Safe:
                SetSafeStyle();
                break;
            case ComplianceLevel.Caution:
                SetCautionStyle();
                break;
            case ComplianceLevel.Violation:
                SetViolationStyle();
                break;
        }
    }

    private void SetSafeStyle()
    {
        IndicatorFrame.Style = Application.Current?.Resources["SafeCard"] as Style;
        IconFrame.BackgroundColor = Color.FromArgb("#28a745");
        StatusIcon.Text = "✓";
        StatusIcon.TextColor = Colors.White;
        StatusTitle.Text = "Safe to Consume";
        StatusTitle.TextColor = Color.FromArgb("#155724");
        StatusDescription.Text = "No dietary restrictions violated";
        StatusDescription.TextColor = Color.FromArgb("#155724");
    }

    private void SetCautionStyle()
    {
        IndicatorFrame.Style = Application.Current?.Resources["CautionCard"] as Style;
        IconFrame.BackgroundColor = Color.FromArgb("#ffc107");
        StatusIcon.Text = "⚠";
        StatusIcon.TextColor = Color.FromArgb("#856404");
        StatusTitle.Text = "Use Caution";
        StatusTitle.TextColor = Color.FromArgb("#856404");
        StatusDescription.Text = "Potential dietary concerns detected";
        StatusDescription.TextColor = Color.FromArgb("#856404");
    }

    private void SetViolationStyle()
    {
        IndicatorFrame.Style = Application.Current?.Resources["ViolationCard"] as Style;
        IconFrame.BackgroundColor = Color.FromArgb("#dc3545");
        StatusIcon.Text = "✕";
        StatusIcon.TextColor = Colors.White;
        StatusTitle.Text = "Dietary Violation";
        StatusTitle.TextColor = Color.FromArgb("#721c24");
        StatusDescription.Text = "Contains restricted ingredients";
        StatusDescription.TextColor = Color.FromArgb("#721c24");
    }

    private void UpdateConfidence()
    {
        ConfidenceScoreLabel.Text = $"{ConfidenceScore:P0}";
        
        // Color code confidence score
        if (ConfidenceScore >= 0.8)
        {
            ConfidenceScoreLabel.TextColor = Color.FromArgb("#28a745");
        }
        else if (ConfidenceScore >= 0.6)
        {
            ConfidenceScoreLabel.TextColor = Color.FromArgb("#ffc107");
        }
        else
        {
            ConfidenceScoreLabel.TextColor = Color.FromArgb("#dc3545");
        }
    }

    public async Task AnimateIn()
    {
        Opacity = 0;
        Scale = 0.8;
        await Task.WhenAll(
            this.FadeTo(1, 300),
            this.ScaleTo(1, 300, Easing.BounceOut)
        );
    }
}
