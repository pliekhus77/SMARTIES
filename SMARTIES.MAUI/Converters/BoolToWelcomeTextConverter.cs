using System.Globalization;

namespace SMARTIES.MAUI.Converters;

public class BoolToWelcomeTextConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool isFirstTime)
        {
            return isFirstTime 
                ? "Get started by creating your first profile or continue as a guest"
                : "Choose a profile to continue scanning";
        }
        return "Choose a profile to continue";
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
