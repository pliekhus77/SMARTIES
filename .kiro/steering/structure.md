---
inclusion: always
---

# Project Structure & Organization

## Root Directory Structure

```
smarties/
├── src/                          # Main application source code
│   ├── components/               # Reusable React Native components
│   │   ├── scanner/             # Barcode scanning components
│   │   ├── profile/             # User profile management
│   │   ├── alerts/              # Alert and warning components
│   │   └── common/              # Shared UI components
│   ├── screens/                 # Main application screens
│   │   ├── ScanScreen.tsx       # Primary barcode scanning interface
│   │   ├── ProfileScreen.tsx    # User dietary profile management
│   │   ├── HistoryScreen.tsx    # Scan history and analytics
│   │   └── SettingsScreen.tsx   # App configuration
│   ├── services/                # Business logic and API integrations
│   │   ├── api/                 # Open Food Facts API integration
│   │   ├── ai/                  # AI dietary analysis
│   │   ├── barcode/             # Barcode scanning logic
│   │   ├── storage/             # Local storage and caching
│   │   └── dietary/             # Dietary compliance checking
│   ├── models/                  # Data models and schemas
│   │   ├── OpenFoodFactsProduct.ts # Open Food Facts API response types
│   │   ├── UserProfile.ts       # User dietary profile
│   │   └── ScanHistory.ts       # Scan result tracking
│   ├── utils/                   # Utility functions and helpers
│   │   ├── allergenDetection.ts # Allergen identification logic
│   │   ├── religiousCompliance.ts # Religious dietary rules
│   │   ├── barcodeNormalization.ts # Barcode formatting utilities
│   │   └── medicalChecks.ts     # Medical condition compliance
│   └── config/                  # Configuration files
│       ├── api.ts               # API endpoints and configuration
│       ├── ai.ts                # AI service configuration
│       └── constants.ts         # App-wide constants
├── tests/                       # Test files
│   ├── components/              # Component tests
│   ├── services/                # Service layer tests
│   └── integration/             # End-to-end tests
├── docs/                        # Documentation
├── android/                     # Android-specific files
├── ios/                         # iOS-specific files
├── package.json                 # Dependencies and scripts
└── tsconfig.json                # TypeScript configuration
```

## Technology Stack Alignment

This structure follows the required technology stack defined in the project guidelines:
- **React Native with TypeScript**: All source files use .ts/.tsx extensions
- **Open Food Facts API**: Direct API integration in services/api/
- **OpenAI/Anthropic APIs**: AI services in services/ai/
- **Google ML Kit / Apple Vision**: Barcode functionality in services/barcode/
- **AsyncStorage**: Local storage and caching in services/storage/

## Key Architectural Principles

### Component Organization
- **Atomic Design**: Components organized by complexity (atoms → molecules → organisms)
- **Feature-Based**: Group related components by functionality (scanner, profile, alerts)
- **Reusability**: Common components in shared directories
- **Platform-Specific**: Separate iOS/Android implementations when needed

### Service Layer Structure
- **API Service**: Open Food Facts API calls and response handling
- **AI Service**: Dietary analysis using LLM APIs
- **Storage Service**: Local caching and user profile management
- **Barcode Service**: Scanning and barcode normalization
- **Dietary Service**: Core business logic for compliance checking

### Data Flow Patterns
- **Unidirectional**: Data flows down, events flow up
- **API-First**: Direct calls to Open Food Facts API
- **Local Caching**: Cache products and user data locally
- **Event-Driven**: User actions trigger API calls and analysis

### File Naming Conventions
- **Components**: PascalCase (e.g., `ScannerComponent.tsx`)
- **Services**: camelCase (e.g., `apiService.ts`, `storageService.ts`)
- **Utilities**: camelCase (e.g., `allergenDetection.ts`, `barcodeNormalization.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DIETARY_RESTRICTIONS`, `API_ENDPOINTS`)
- **Tests**: Match source file with `.test.ts` or `.test.tsx` suffix
- **Types**: PascalCase with `.types.ts` suffix (e.g., `OpenFoodFactsProduct.types.ts`)

### Import/Export Patterns
- **Barrel Exports**: Use index.ts files for clean imports
- **Named Exports**: Prefer named exports over default exports
- **Service Imports**: Import services at the top level
- **Component Imports**: Group by source (external → internal → relative)
- **Type Imports**: Use `import type` for TypeScript types

### Local Storage Structure
```
AsyncStorage Keys:
├── user_profile                 # User dietary restrictions and preferences
├── scan_history                 # Recent scan results and analysis
├── product_cache_${barcode}     # Cached Open Food Facts product data
├── app_settings                 # App configuration and preferences
└── dietary_rules                # Custom dietary compliance rules
```

### Configuration Management
- **Environment Variables**: Use .env files for API keys and sensitive data
- **Config Objects**: Centralized configuration in config/ directory with TypeScript interfaces
- **Feature Flags**: Toggle features for different environments
- **API Configuration**: Open Food Facts endpoints and user agent strings
- **Type Safety**: All configuration objects must have TypeScript interfaces

### Error Handling Structure
- **API Level**: Handle Open Food Facts API errors and network failures
- **Service Level**: Catch and transform errors at service boundaries
- **Component Level**: Display user-friendly error messages
- **Global Handler**: Catch unhandled errors and log appropriately
- **Offline Handling**: Use cached data when API unavailable

### Testing Organization
- **Unit Tests**: Test individual functions and components using Jest
- **Integration Tests**: Test service interactions with Open Food Facts API
- **E2E Tests**: Test complete user workflows using Detox
- **Mock Data**: Mock Open Food Facts API responses for consistent testing
- **Type Testing**: Validate TypeScript interfaces and API response types