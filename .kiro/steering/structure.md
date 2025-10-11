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
│   │   ├── atlas/               # MongoDB Atlas integration
│   │   ├── ai/                  # GenAI and RAG pipeline
│   │   ├── barcode/             # Barcode scanning logic
│   │   └── dietary/             # Dietary compliance checking
│   ├── models/                  # Data models and schemas
│   │   ├── Product.ts           # Product data structure
│   │   ├── UserProfile.ts       # User dietary profile
│   │   └── ScanHistory.ts       # Scan result tracking
│   ├── utils/                   # Utility functions and helpers
│   │   ├── allergenDetection.ts # Allergen identification logic
│   │   ├── religiousCompliance.ts # Religious dietary rules
│   │   └── medicalChecks.ts     # Medical condition compliance
│   └── config/                  # Configuration files
│       ├── atlas.ts             # MongoDB Atlas connection
│       ├── ai.ts                # AI service configuration
│       └── constants.ts         # App-wide constants
├── data/                        # Data processing and imports
│   ├── processors/              # Data transformation scripts
│   ├── imports/                 # Raw data import utilities
│   └── seeds/                   # Database seeding scripts
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
- **MongoDB Atlas with Realm SDK**: Database integration in services/atlas/
- **OpenAI/Anthropic APIs**: AI services in services/ai/
- **expo-barcode-scanner**: Barcode functionality in services/barcode/

## Key Architectural Principles

### Component Organization
- **Atomic Design**: Components organized by complexity (atoms → molecules → organisms)
- **Feature-Based**: Group related components by functionality (scanner, profile, alerts)
- **Reusability**: Common components in shared directories
- **Platform-Specific**: Separate iOS/Android implementations when needed

### Service Layer Structure
- **Atlas Service**: All MongoDB operations centralized
- **AI Service**: RAG pipeline and GenAI integrations
- **Dietary Service**: Core business logic for compliance checking
- **Barcode Service**: Scanning and product lookup functionality

### Data Flow Patterns
- **Unidirectional**: Data flows down, events flow up
- **Offline-First**: Local storage with Atlas sync
- **Event-Driven**: User actions trigger service calls
- **Caching Strategy**: Intelligent caching for offline functionality

### File Naming Conventions
- **Components**: PascalCase (e.g., `ScannerComponent.tsx`)
- **Services**: camelCase (e.g., `atlasService.ts`)
- **Utilities**: camelCase (e.g., `allergenDetection.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DIETARY_RESTRICTIONS`)
- **Tests**: Match source file with `.test.ts` or `.test.tsx` suffix
- **Types**: PascalCase with `.types.ts` suffix (e.g., `Product.types.ts`)

### Import/Export Patterns
- **Barrel Exports**: Use index.ts files for clean imports
- **Named Exports**: Prefer named exports over default exports
- **Service Imports**: Import services at the top level
- **Component Imports**: Group by source (external → internal → relative)
- **Type Imports**: Use `import type` for TypeScript types

### MongoDB Collection Structure
```
smarties_db/
├── products                     # Food product database
├── users                       # User profiles and preferences  
├── scan_history                # Individual scan results
├── dietary_rules               # Compliance rules and patterns
└── embeddings                  # Vector embeddings for AI
```

### Configuration Management
- **Environment Variables**: Use .env files for sensitive data
- **Config Objects**: Centralized configuration in config/ directory with TypeScript interfaces
- **Feature Flags**: Toggle features for different environments
- **Atlas Connection**: Secure connection string management via Realm SDK
- **Type Safety**: All configuration objects must have TypeScript interfaces

### Error Handling Structure
- **Service Level**: Catch and transform errors at service boundaries
- **Component Level**: Display user-friendly error messages
- **Global Handler**: Catch unhandled errors and log appropriately
- **Offline Handling**: Graceful degradation when offline

### Testing Organization
- **Unit Tests**: Test individual functions and components using Jest
- **Integration Tests**: Test service interactions with MongoDB and APIs
- **E2E Tests**: Test complete user workflows using Detox
- **Mock Data**: Consistent test data across all test types with TypeScript interfaces
- **Type Testing**: Validate TypeScript interfaces and type safety