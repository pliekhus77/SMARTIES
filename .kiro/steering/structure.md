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
│   │   ├── ScanScreen.js        # Primary barcode scanning interface
│   │   ├── ProfileScreen.js     # User dietary profile management
│   │   ├── HistoryScreen.js     # Scan history and analytics
│   │   └── SettingsScreen.js    # App configuration
│   ├── services/                # Business logic and API integrations
│   │   ├── atlas/               # MongoDB Atlas integration
│   │   ├── ai/                  # GenAI and RAG pipeline
│   │   ├── barcode/             # Barcode scanning logic
│   │   └── dietary/             # Dietary compliance checking
│   ├── models/                  # Data models and schemas
│   │   ├── Product.js           # Product data structure
│   │   ├── UserProfile.js       # User dietary profile
│   │   └── ScanHistory.js       # Scan result tracking
│   ├── utils/                   # Utility functions and helpers
│   │   ├── allergenDetection.js # Allergen identification logic
│   │   ├── religiousCompliance.js # Religious dietary rules
│   │   └── medicalChecks.js     # Medical condition compliance
│   └── config/                  # Configuration files
│       ├── atlas.js             # MongoDB Atlas connection
│       ├── ai.js                # AI service configuration
│       └── constants.js         # App-wide constants
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
└── package.json                 # Dependencies and scripts
```

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
- **Components**: PascalCase (e.g., `ScannerComponent.js`)
- **Services**: camelCase (e.g., `atlasService.js`)
- **Utilities**: camelCase (e.g., `allergenDetection.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DIETARY_RESTRICTIONS`)
- **Tests**: Match source file with `.test.js` suffix

### Import/Export Patterns
- **Barrel Exports**: Use index.js files for clean imports
- **Named Exports**: Prefer named exports over default exports
- **Service Imports**: Import services at the top level
- **Component Imports**: Group by source (external → internal → relative)

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
- **Config Objects**: Centralized configuration in config/ directory
- **Feature Flags**: Toggle features for different environments
- **Atlas Connection**: Secure connection string management

### Error Handling Structure
- **Service Level**: Catch and transform errors at service boundaries
- **Component Level**: Display user-friendly error messages
- **Global Handler**: Catch unhandled errors and log appropriately
- **Offline Handling**: Graceful degradation when offline

### Testing Organization
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test service interactions
- **E2E Tests**: Test complete user workflows
- **Mock Data**: Consistent test data across all test types