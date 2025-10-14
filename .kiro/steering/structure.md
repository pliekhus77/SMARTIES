---
inclusion: always
---

# Project Structure & Organization

## Root Directory Structure

```
SMARTIES.MAUI/
├── Models/                      # Data models and entities
│   ├── Product.cs               # Product entity and Open Food Facts API models
│   ├── UserProfile.cs           # User dietary profile and restrictions
│   └── DietaryAnalysis.cs       # Dietary compliance analysis results
├── Services/                    # Business logic and API integrations
│   ├── IOpenFoodFactsService.cs # Open Food Facts API interface
│   ├── OpenFoodFactsService.cs  # Open Food Facts API implementation
│   ├── IDietaryAnalysisService.cs # AI dietary analysis interface
│   ├── DietaryAnalysisService.cs # AI dietary analysis implementation
│   ├── IUserProfileService.cs   # User profile management interface
│   ├── UserProfileService.cs    # User profile management implementation
│   ├── IProductCacheService.cs  # Product caching interface
│   ├── ProductCacheService.cs   # SQLite product caching implementation
│   ├── IBarcodeService.cs       # Barcode scanning interface
│   └── BarcodeService.cs        # Barcode scanning implementation
├── ViewModels/                  # MVVM ViewModels
│   ├── ScannerViewModel.cs      # Primary barcode scanning logic
│   ├── ProfileViewModel.cs      # User dietary profile management
│   ├── HistoryViewModel.cs      # Scan history and analytics
│   └── ProductDetailViewModel.cs # Product detail display logic
├── Views/                       # XAML pages and UI
│   ├── AppShell.xaml           # App navigation shell
│   ├── ScannerPage.xaml        # Primary barcode scanning interface
│   ├── ProfilePage.xaml        # User dietary profile management
│   ├── HistoryPage.xaml        # Scan history and analytics
│   └── ProductDetailPage.xaml  # Product detail display
├── Platforms/                   # Platform-specific implementations
│   ├── Android/                 # Android-specific files
│   └── Windows/                 # Windows-specific files
├── Resources/                   # App resources
│   ├── AppIcon/                 # Application icons
│   ├── Fonts/                   # Custom fonts
│   ├── Splash/                  # Splash screen
│   └── Styles/                  # XAML styles and colors
├── MauiProgram.cs              # App configuration and DI setup
├── App.xaml                    # Application-level XAML
├── App.xaml.cs                 # Application code-behind
└── SMARTIES.MAUI.csproj        # Project file with dependencies
```

## Technology Stack Alignment

This structure follows the required technology stack defined in the project guidelines:
- **.NET MAUI with C#**: All source files use .cs/.xaml extensions
- **Open Food Facts API**: Direct API integration in OpenFoodFactsService
- **OpenAI/Anthropic APIs**: AI services in DietaryAnalysisService
- **ZXing.Net.Maui**: Barcode functionality in BarcodeService
- **SQLite**: Local storage and caching in ProductCacheService and UserProfileService

## Key Architectural Principles

### MVVM Organization
- **Models**: Data entities and business objects (Product, UserProfile, DietaryAnalysis)
- **ViewModels**: Presentation logic and data binding (using CommunityToolkit.Mvvm)
- **Views**: XAML UI pages and user interface components
- **Platform-Specific**: Separate Android/Windows implementations in Platforms folder

### Service Layer Structure
- **OpenFoodFactsService**: Open Food Facts API calls and response handling
- **DietaryAnalysisService**: AI-powered dietary analysis using LLM APIs
- **UserProfileService**: User profile management and SQLite storage
- **ProductCacheService**: Local product caching with SQLite
- **BarcodeService**: Barcode scanning and camera permissions

### Data Flow Patterns
- **Unidirectional**: Data flows down, events flow up
- **API-First**: Direct calls to Open Food Facts API
- **Local Caching**: Cache products and user data locally
- **Event-Driven**: User actions trigger API calls and analysis

### File Naming Conventions
- **Views**: PascalCase (e.g., `ScannerPage.xaml`, `ProfilePage.xaml`)
- **ViewModels**: PascalCase with ViewModel suffix (e.g., `ScannerViewModel.cs`)
- **Services**: PascalCase with Service suffix (e.g., `OpenFoodFactsService.cs`)
- **Models**: PascalCase (e.g., `Product.cs`, `UserProfile.cs`)
- **Interfaces**: PascalCase with I prefix (e.g., `IOpenFoodFactsService.cs`)
- **Tests**: Match source file with `.Tests.cs` suffix (e.g., `ProductService.Tests.cs`)

### Dependency Injection Patterns
- **Service Registration**: Register all services in MauiProgram.cs
- **Interface-Based**: Use interfaces for all services to enable testing
- **Singleton Services**: Data services (OpenFoodFacts, UserProfile, ProductCache)
- **Transient ViewModels**: ViewModels registered as transient
- **Constructor Injection**: Inject dependencies through constructors

### SQLite Database Structure
```
SQLite Tables:
├── UserProfiles                 # User dietary restrictions and preferences
│   ├── Id (Primary Key)
│   ├── Name, IsActive, CreatedAt, UpdatedAt
│   └── Allergies, ReligiousRestrictions, MedicalRestrictions, LifestylePreferences (JSON)
├── Products                     # Cached Open Food Facts product data
│   ├── Barcode (Primary Key)
│   ├── ProductName, Brand, IngredientsText, Allergens
│   ├── ImageUrl, NutritionGrades, Categories
│   ├── Nutrition facts (EnergyKcal, Fat, Carbohydrates, etc.)
│   └── CachedAt, IsFromCache
└── ScanHistory                  # Recent scan results and analysis
    ├── Id (Primary Key)
    ├── Barcode, ProductName, ScannedAt
    └── AnalysisResult (JSON)
```

### Configuration Management
- **App Settings**: Use appsettings.json for configuration (when needed)
- **Secure Storage**: Use MAUI Essentials SecureStorage for API keys
- **Platform Configuration**: Platform-specific settings in Platforms folders
- **API Configuration**: Open Food Facts endpoints and user agent strings in services
- **Type Safety**: All configuration objects use strongly-typed C# classes

### Error Handling Structure
- **API Level**: Handle Open Food Facts API errors and network failures
- **Service Level**: Catch and transform errors at service boundaries
- **Component Level**: Display user-friendly error messages
- **Global Handler**: Catch unhandled errors and log appropriately
- **Offline Handling**: Use cached data when API unavailable

### Testing Organization
- **Unit Tests**: Test individual services and ViewModels using xUnit
- **Integration Tests**: Test service interactions with Open Food Facts API
- **UI Tests**: Test MAUI pages and user workflows
- **Mock Data**: Mock Open Food Facts API responses for consistent testing
- **Test Projects**: Separate test projects following naming convention (SMARTIES.MAUI.Tests)