# SMARTIES 🛡️📱

**S**can‑based **M**obile **A**llergen **R**isk **T**racking & **I**ntelligenc**E** **S**uite

A .NET MAUI cross-platform mobile application that provides instant dietary compliance checking through UPC barcode scanning, powered by AI services.

![SMARTIES Logo](design/SMARTIES.png)

## 🎯 Mission

Empower users to make safe dietary choices instantly by scanning product barcodes and receiving real-time compliance alerts for allergies, religious restrictions, medical conditions, and lifestyle preferences.

## ✨ Key Features

### 🔍 **Instant Barcode Scanning**
- Sub-3-second scan-to-result response time
- UPC barcode recognition with ZXing.Net.Maui
- Offline-first architecture for core safety features

### 🛡️ **Comprehensive Dietary Analysis**
- **Allergies**: FDA Top 9 + additional allergens
- **Religious**: Halal, Kosher, Hindu vegetarian, Jain, Buddhist
- **Medical**: Diabetes, hypertension, celiac, kidney disease
- **Lifestyle**: Vegan, vegetarian, keto, paleo, organic-only, non-GMO

### 🚨 **Safety-First Alerts**
- 🔴 **Red**: Violation/Danger - Never miss critical restrictions
- 🟡 **Yellow**: Caution - Possible risk or uncertainty
- 🟢 **Green**: Safe - Compliant with all restrictions

### 🤖 **AI-Powered Intelligence**
- OpenAI/Anthropic integration for complex analysis
- Offline rule-based analysis for core functionality
- Confidence scoring for product data quality

## 📱 User Interface

### Mobile App Mockups

| iOS Home Screen | Android Home Screen |
|-----------------|---------------------|
| ![iOS Home](design/iOS-Home.png) | ![Android Home](design/android-Home.png) |

### Design Principles
- **Scan-First Interface**: Large, accessible barcode scanner as primary entry point
- **Color-Coded Safety**: Immediate visual feedback with universal color system
- **One-Tap Actions**: Save products, mark favorites, report issues
- **Accessibility**: Full VoiceOver/TalkBack support for visually impaired users

## 🏗️ Technical Architecture

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Mobile Framework** | .NET MAUI 8.0 + C# 12 | Cross-platform native performance |
| **Local Storage** | SQLite with encryption | Offline data persistence |
| **AI/ML** | OpenAI/Anthropic APIs | Dietary analysis and recommendations |
| **Barcode Scanning** | ZXing.Net.Maui | UPC recognition |
| **Data Sources** | Open Food Facts API | Product and nutritional data |
| **MVVM Framework** | CommunityToolkit.Mvvm | Clean architecture patterns |

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

### Data Flow Architecture

```
Scan → Lookup → Analyze → Alert → Store
  ↓       ↓        ↓       ↓      ↓
Camera → API → AI/Rules → UI → SQLite
```

## 🚀 Performance Requirements

| Metric | Target | Critical Threshold |
|--------|--------|--------------------|
| **Barcode Recognition** | <1 second | <2 seconds |
| **Product Lookup** | <2 seconds (cached) | <5 seconds (API) |
| **AI Analysis** | <3 seconds | <5 seconds |
| **App Launch** | <2 seconds to scanner ready | <3 seconds |
| **Battery Impact** | <5% drain per hour | <10% drain per hour |

## 🔒 Security & Privacy

- **Local Encryption**: User profiles encrypted with device keychain
- **Data Minimization**: Only store necessary dietary restrictions
- **Anonymized Analytics**: Track usage patterns without PII
- **GDPR Compliance**: Right to deletion and data portability
- **Secure APIs**: HTTPS for all communications, no API keys in code

## 🧪 Development & Testing

### Setup Commands
```bash
# Install MAUI workload (if not already installed)
dotnet workload install maui

# Restore dependencies
dotnet restore

# Build the project
dotnet build

# Run on Android
dotnet build -t:Run -f net8.0-android

# Run tests
dotnet test                    # All tests
dotnet test --filter Category=Unit   # Unit tests only
dotnet test --filter Category=Integration   # Integration tests only
```

### CI/CD Pipeline

Our automated build system ensures code quality and deployment readiness:

#### 🔄 Continuous Integration
- **Automated Testing**: Unit, integration, and platform-specific tests
- **Code Quality**: Static analysis, nullable reference type checking
- **Multi-Platform Builds**: Automated Android and iOS build validation
- **Coverage Reports**: Automated test coverage tracking

#### 🚀 Build Automation
- **GitHub Actions**: Fully automated CI/CD pipeline
- **Build Artifacts**: Automated build artifact generation and storage
- **Manual Deployment**: On-demand deployment to demo environments
- **Build Status**: Real-time build status notifications

#### 📋 Quality Gates
| Stage | Checks | Blocks Deployment |
|-------|--------|-------------------|
| **Build** | Compilation, dependencies | ✅ Yes |
| **Test** | Unit tests, integration tests, 80%+ coverage | ✅ Yes |
| **Quality** | Static analysis, nullable checks | ✅ Yes |
| **Platform** | Android build validation | ✅ Yes |

### Testing Strategy
- **Critical Path Testing**: Barcode scanning → product lookup → dietary analysis → warning display
- **Edge Case Coverage**: Unknown products, network failures, corrupted barcodes
- **Performance Testing**: Scan speed, memory usage, battery impact
- **Accessibility Testing**: Screen reader compatibility, high contrast mode

### Code Quality Standards
- C# 12 with nullable reference types enabled
- Static analysis with built-in analyzers
- >80% test coverage for critical paths
- Conventional commit messages
- Accessibility compliance (WCAG 2.1 AA)

## 📊 Success Metrics

### User Safety (Primary)
- **Zero Critical Misses**: No false negatives for severe allergies
- **Accuracy Rate**: >99% for allergen detection, >95% for lifestyle preferences
- **Response Time**: <3 seconds average scan-to-result

### User Engagement (Secondary)
- **Daily Active Users**: Target 70% retention after 30 days
- **Scans per Session**: Average 3-5 products per app open
- **Profile Completion**: 90% of users complete dietary restriction setup

## 🗺️ Roadmap

### Phase 1: MVP - UPC Scanning ✅
- Barcode scanning and basic allergen detection
- User profile setup and offline core functionality
- Product favorites and scan history

### Phase 2: Enhanced Recognition 🚧
- Package image recognition when barcodes fail
- Improved AI accuracy and family profiles
- Advanced analytics and recommendations

### Phase 3: Prepared Foods 📋
- Plate/meal image recognition
- Restaurant menu integration
- Recipe analysis and meal planning

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Code style and conventions
- Testing requirements
- Pull request process
- Issue reporting

### Development Guidelines
- Follow C# coding standards and conventions
- Use MVVM pattern for UI logic separation
- Implement proper error handling
- Write comprehensive tests
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Documentation

### 📚 Complete Documentation Suite
- **[MAUI Setup Guide](SMARTIES.MAUI/README.md)** - Complete MAUI development setup
- **[Architecture Guide](.kiro/steering/)** - Technical architecture and patterns
- **[Project Documentation](/docs)** - Additional technical documentation

### 🔧 Quick Setup
```bash
# 1. Install MAUI workload
dotnet workload install maui

# 2. Clone and restore
git clone <repository-url>
cd SMARTIES
dotnet restore

# 3. Build and run
dotnet build
dotnet build -t:Run -f net8.0-android
```

### 🆘 Getting Help
- **Setup Issues**: Check [SMARTIES.MAUI/README.md](SMARTIES.MAUI/README.md)
- **Architecture Questions**: Check [.kiro/steering/](.kiro/steering/) files
- **Bug Reports**: Create GitHub Issues
- **Questions**: Use GitHub Discussions

## 🙏 Acknowledgments

- **Open Food Facts**: Primary product database (2M+ products)
- **Microsoft**: .NET MAUI framework and development tools
- **ZXing.Net**: Barcode scanning capabilities
- **OpenAI/Anthropic**: AI-powered dietary analysis
- **Community Toolkit**: MVVM and UI components

---

**Built with ❤️ for dietary safety and accessibility**

*SMARTIES MAUI - Making food choices safer, one scan at a time.*