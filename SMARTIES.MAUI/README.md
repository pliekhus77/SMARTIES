# SMARTIES MAUI

**SMARTIES** (Scan‑based Mobile Allergen Risk Tracking & IntelligencE Suite) - .NET MAUI Implementation

A cross-platform mobile application that provides instant dietary compliance checking through UPC barcode scanning, powered by Open Food Facts API and AI analysis.

## 🚀 Features

### Core Functionality
- **Barcode Scanning**: Real-time UPC barcode scanning using device camera
- **Product Lookup**: Integration with Open Food Facts API for comprehensive product data
- **Dietary Analysis**: AI-powered analysis of ingredients against user dietary restrictions
- **Offline Support**: Local caching and offline analysis capabilities
- **Multi-Profile Support**: Family profiles with different dietary restrictions

### Safety-First Design
- **Zero False Negatives**: Never miss critical dietary restriction violations
- **Color-Coded Alerts**: Clear visual indicators (Green=Safe, Yellow=Caution, Red=Violation)
- **Severity Levels**: Critical, Severe, Moderate, and Mild restriction handling
- **Offline Capability**: Core safety features work without internet connection

## 🏗️ Architecture

### Technology Stack
- **.NET MAUI 8.0**: Cross-platform UI framework
- **C# 12**: Modern language features with nullable reference types
- **SQLite**: Local database for caching and user profiles
- **CommunityToolkit.Mvvm**: MVVM pattern implementation
- **ZXing.Net.Maui**: Barcode scanning capabilities
- **System.Text.Json**: High-performance JSON serialization

### Project Structure
```
SMARTIES.MAUI/
├── Models/                    # Data models and entities
│   ├── Product.cs            # Product and Open Food Facts API models
│   ├── UserProfile.cs        # User profile and dietary restrictions
│   └── DietaryAnalysis.cs    # Analysis results and compliance levels
├── Services/                  # Business logic and external integrations
│   ├── OpenFoodFactsService.cs    # Open Food Facts API integration
│   ├── DietaryAnalysisService.cs  # AI-powered dietary analysis
│   ├── UserProfileService.cs     # User profile management
│   ├── ProductCacheService.cs    # Local product caching
│   └── BarcodeService.cs         # Barcode scanning functionality
├── ViewModels/               # MVVM view models
│   ├── ScannerViewModel.cs   # Main scanner functionality
│   ├── ProfileViewModel.cs   # Profile management
│   └── HistoryViewModel.cs   # Scan history
├── Views/                    # XAML pages and UI
│   ├── ScannerPage.xaml     # Main scanning interface
│   ├── ProfilePage.xaml     # Profile management
│   └── HistoryPage.xaml     # Scan history
└── Platforms/               # Platform-specific implementations
    ├── Android/             # Android-specific code
    └── iOS/                 # iOS-specific code (future)
```

## 🔧 Setup & Development

### Prerequisites
- Visual Studio 2022 17.8+ or Visual Studio Code
- .NET 8.0 SDK
- Android SDK (for Android development)
- Xcode (for iOS development on macOS)

### Getting Started
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SMARTIES.MAUI
   ```

2. **Restore dependencies**
   ```bash
   dotnet restore
   ```

3. **Build the project**
   ```bash
   dotnet build
   ```

4. **Run on Android**
   ```bash
   dotnet build -t:Run -f net8.0-android
   ```

### Development Environment
- **IDE**: Visual Studio 2022 recommended for full MAUI support
- **Emulator**: Android Emulator or physical device for testing
- **Debugging**: Full debugging support with breakpoints and hot reload

## 📱 Platform Support

### Current Support
- ✅ **Android 5.0+** (API 21+)
- 🚧 **iOS 11.0+** (planned)
- 🚧 **Windows 10+** (planned)

### Platform-Specific Features
- **Android**: Camera permissions, barcode scanning, local storage
- **iOS**: Camera integration, keychain storage (planned)
- **Windows**: Desktop-optimized UI (planned)

## 🔒 Security & Privacy

### Data Protection
- **Local Storage Only**: No user data stored on external servers
- **Encrypted Cache**: Product cache encrypted using device keychain
- **Privacy by Design**: Minimal data collection, user control over data
- **GDPR Compliant**: Easy data export and deletion

### Permissions
- **Camera**: Required for barcode scanning
- **Internet**: Required for product lookup (Open Food Facts API)
- **Storage**: Required for local caching and user profiles

## 🧪 Testing

### Test Strategy
- **Unit Tests**: Core business logic and services
- **Integration Tests**: API integration and database operations
- **UI Tests**: Critical user workflows and accessibility
- **Performance Tests**: Scan speed and memory usage

### Running Tests
```bash
# Run all tests
dotnet test

# Run specific test category
dotnet test --filter Category=Unit
dotnet test --filter Category=Integration
```

## 🚀 Deployment

### Android Deployment
1. **Debug Build**
   ```bash
   dotnet build -c Debug -f net8.0-android
   ```

2. **Release Build**
   ```bash
   dotnet publish -c Release -f net8.0-android
   ```

3. **App Store Deployment**
   - Generate signed APK/AAB
   - Upload to Google Play Console
   - Follow store guidelines for health apps

### Performance Targets
- **Scan to Result**: < 3 seconds
- **App Startup**: < 2 seconds to scanner ready
- **Memory Usage**: < 100MB during normal operation
- **Battery Impact**: < 5% drain per hour of active scanning

## 🔄 API Integration

### Open Food Facts API
- **Base URL**: `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
- **Rate Limiting**: Respectful usage with proper User-Agent
- **Caching**: 7-day local cache to reduce API calls
- **Fallback**: Graceful handling of API unavailability

### AI Analysis Integration
- **OpenAI/Anthropic**: Enhanced dietary analysis (optional)
- **Offline Analysis**: Rule-based analysis for core functionality
- **Privacy**: No sensitive data sent to AI services

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Application Insights**: Performance and crash tracking
- **Custom Metrics**: Scan success rate, analysis accuracy
- **User Feedback**: In-app feedback and rating system

### Key Metrics
- **Scan Success Rate**: % of successful barcode scans
- **Analysis Accuracy**: User feedback on dietary analysis
- **App Performance**: Response times and crash rates
- **User Engagement**: Daily active users and retention

## 🤝 Contributing

### Development Guidelines
- Follow C# coding standards and conventions
- Use MVVM pattern for UI logic separation
- Write unit tests for new functionality
- Update documentation for API changes

### Code Quality
- **Static Analysis**: Built-in analyzers and StyleCop
- **Code Coverage**: Minimum 80% for critical paths
- **Performance**: Profile memory usage and startup time
- **Accessibility**: Full screen reader support

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- **Architecture Guide**: See `/docs/architecture/`
- **API Documentation**: See `/docs/api/`
- **User Guide**: See `/docs/user-guide/`

### Getting Help
- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for questions
- **Email**: support@smarties.app

---

**SMARTIES MAUI** - Making food safety accessible through technology 🥗📱✨