namespace SMARTIES.MAUI.Views;

public partial class AppShell : Shell
{
    public AppShell()
    {
        InitializeComponent();
        
        // Register routes for navigation
        Routing.RegisterRoute("productdetail", typeof(ProductDetailPage));
    }
}