---
inclusion: always
---

# SMARTIES Technology Stack & Development Guidelines

## Required Technology Stack

### Core Technologies (Non-Negotiable)
- **Mobile Framework**: .NET MAUI with C#
- **Local Storage**: SQLite with encryption for user profiles and cache
- **AI/ML**: OpenAI/Anthropic APIs for dietary analysis
- **Barcode Scanning**: ZXing.Net.Maui for cross-platform barcode scanning
- **Product Data**: Open Food Facts API (direct HTTP calls)

### Data Sources Integration
- **Primary**: Open Food Facts API (world.openfoodfacts.org/api/v2/product/{barcode}.json)
- **Secondary**: Open Beauty Facts, Open Pet Food Facts (same API structure)
- **Fallback**: Manual barcode entry and "Add Product" redirect to Open Food Facts

## Development Patterns & Conventions

### Code Organization Rules
```
SMARTIES.MAUI/
├── Models/              # Data models and entities
├── Services/            # Business logic and API calls
├── ViewModels/          # MVVM view models
├── Views/               # XAML pages and UI components
├── Platforms/           # Platform-specific implementations
└── Resources/           # Images, fonts, styles
```

### Naming Conventions
- **Files**: PascalCase for all C# files (`ScannerPage.xaml`, `ProductService.cs`)
- **Classes**: PascalCase (`ProductCard`, `DietaryAlert`)
- **Methods**: PascalCase (`CheckAllergens`, `ProcessBarcode`)
- **Constants**: PascalCase (`DietaryRestrictions`, `ApiEndpoints`)

### C# Requirements
- Always use nullable reference types enabled
- Define proper interfaces for all services
- Use async/await patterns consistently
- Implement proper error handling with try-catch

### MAUI MVVM Patterns
```csharp
// Use MVVM pattern with CommunityToolkit.Mvvm
public partial class ScannerViewModel : ObservableObject
{
    [ObservableProperty]
    private bool isScanning;
    
    [ObservableProperty]
    private Product? currentProduct;
    
    [RelayCommand]
    private async Task ScanBarcodeAsync()
    {
        IsScanning = true;
        try
        {
            var barcode = await _barcodeService.ScanAsync();
            CurrentProduct = await _productService.GetProductAsync(barcode);
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", ex.Message, "OK");
        }
        finally
        {
            IsScanning = false;
        }
    }
}
```

### Open Food Facts API Integration Patterns
```csharp
// Direct API calls to Open Food Facts
public async Task<Product?> GetProductAsync(string barcode, CancellationToken cancellationToken = default)
{
    var normalizedBarcode = NormalizeBarcode(barcode);
    var url = $"{BaseUrl}/{normalizedBarcode}.json";
    
    var response = await _httpClient.GetAsync(url, cancellationToken);
    if (!response.IsSuccessStatusCode) return null;
    
    var jsonContent = await response.Content.ReadAsStringAsync(cancellationToken);
    var apiResponse = JsonSerializer.Deserialize<OpenFoodFactsResponse>(jsonContent);
    
    return apiResponse?.Status == 1 ? MapToProduct(normalizedBarcode, apiResponse.Product) : null;
}

// Local caching with SQLite
public async Task CacheProductAsync(Product product)
{
    try
    {
        await _database.InsertOrReplaceAsync(product);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Cache write failed for product {Barcode}", product.Barcode);
    }
}
```

### AI Dietary Analysis Implementation
```csharp
// Analyze product against user dietary restrictions
public async Task<DietaryAnalysis> AnalyzeProductAsync(Product product, UserProfile userProfile)
{
    var restrictions = GetUserRestrictions(userProfile);
    var prompt = $@"
        Analyze this product for dietary compliance:
        Product: {product.ProductName}
        Ingredients: {product.IngredientsText}
        Allergens: {product.Allergens}
        User restrictions: {string.Join(", ", restrictions)}
        
        Return JSON with: {{ ""safe"": boolean, ""violations"": string[], ""warnings"": string[] }}
    ";

    // TODO: Implement actual AI API call
    // For now, return mock analysis
    return new DietaryAnalysis
    {
        ProductBarcode = product.Barcode,
        ProductName = product.ProductName,
        IsSafe = true,
        OverallCompliance = ComplianceLevel.Safe,
        Summary = "Product appears safe for your dietary restrictions."
    };
}
```

### Error Handling Standards
```csharp
// Use custom exception classes
public class ProductNotFoundException : Exception
{
    public ProductNotFoundException(string barcode) 
        : base($"Product not found: {barcode}")
    {
        Barcode = barcode;
    }
    
    public string Barcode { get; }
}

// Always provide user-friendly error messages
private async Task HandleScanErrorAsync(Exception error)
{
    var message = error switch
    {
        ProductNotFoundException => "Product not found. Try manual entry.",
        HttpRequestException => "Network error. Check your connection.",
        _ => "Scanning failed. Please try again."
    };
    
    await Shell.Current.DisplayAlert("Error", message, "OK");
    _logger.LogError(error, "Scan error occurred");
}
```

### Performance Requirements
- Barcode scan to result: <3 seconds
- App startup: <2 seconds to scanner ready
- Offline functionality: Core features must work without network
- Memory usage: <100MB during normal operation

### Security Guidelines
- Never store API keys in code - use environment variables
- Encrypt sensitive user data using device keychain
- Validate all user inputs before processing
- Use HTTPS for all API communications
- Implement proper authentication for user data sync

### Testing Requirements
```csharp
// Test critical paths thoroughly using xUnit
[Fact]
public async Task AnalyzeProductAsync_ShouldDetectAllergens_WhenProductContainsAllergens()
{
    // Arrange
    var product = CreateMockProductWithAllergens(["milk", "eggs"]);
    var userProfile = CreateMockUserProfile(["dairy allergy"]);
    
    // Act
    var result = await _dietaryAnalysisService.AnalyzeProductAsync(product, userProfile);
    
    // Assert
    Assert.False(result.IsSafe);
    Assert.Contains(result.Violations, v => v.RestrictionName.Contains("dairy"));
}
```

### Development Commands
```bash
# Setup
dotnet workload install maui
dotnet restore

# Testing
dotnet test                 # Unit tests
dotnet test --filter Category=Integration  # Integration tests

# Platform-specific development
dotnet run --project SMARTIES.MAUI -f net8.0-windows10.0.19041.0  # Windows
dotnet run --project SMARTIES.MAUI -f net8.0-android              # Android

# Production builds
dotnet publish -f net8.0-android -c Release
dotnet publish -f net8.0-windows10.0.19041.0 -c Release
```

### Code Quality Standards
- Use EditorConfig and .NET analyzers for consistent formatting
- Maintain >80% test coverage for critical paths
- Use meaningful commit messages following conventional commits
- All UI must be accessible (screen reader compatible)
- Handle all async operations with proper loading states and cancellation tokens

### MAUI-Specific Guidelines
- **Dependency Injection**: Register all services in MauiProgram.cs
- **MVVM Pattern**: Use CommunityToolkit.Mvvm for ViewModels
- **Platform APIs**: Use MAUI Essentials for cross-platform functionality
- **Local Database**: Use SQLite-net-pcl for local data storage (not Entity Framework Core)
- **HTTP Clients**: Register HttpClient in DI container with proper configuration

### Database Strategy
- **SQLite-net-pcl**: Lightweight ORM for mobile applications
- **Attributes**: Use SQLite attributes for table and column configuration
- **Async Operations**: All database operations should be async
- **Connection Management**: Single connection per service, properly disposed