# SMARTIES Mobile Application

**SMARTIES** (Scan-based Mobile Allergen Risk Tracking & Intelligence Suite) is a React Native mobile application that provides instant dietary compliance checking through UPC barcode scanning.

## Project Structure

```
smarties/
├── src/                         # Application source code
│   ├── components/              # Reusable React Native components
│   │   ├── scanner/            # Barcode scanning components
│   │   ├── profile/            # User profile management
│   │   ├── alerts/             # Alert and warning components
│   │   └── common/             # Shared UI components
│   ├── screens/                # Main application screens
│   │   ├── ScanScreen.tsx      # Primary barcode scanning interface
│   │   ├── ProfileScreen.tsx   # User dietary profile management
│   │   ├── HistoryScreen.tsx   # Scan history and analytics
│   │   └── SettingsScreen.tsx  # App configuration
│   ├── services/               # Business logic and API integrations
│   │   ├── atlas/              # MongoDB Atlas integration
│   │   ├── ai/                 # GenAI and RAG pipeline
│   │   ├── barcode/            # Barcode scanning logic
│   │   └── dietary/            # Dietary compliance checking
│   ├── models/                 # Data models and schemas
│   │   ├── Product.ts          # Product data structure
│   │   ├── UserProfile.ts      # User dietary profile
│   │   └── ScanHistory.ts      # Scan result tracking
│   ├── utils/                  # Utility functions and helpers
│   │   ├── allergenDetection.ts # Allergen identification logic
│   │   ├── religiousCompliance.ts # Religious dietary rules
│   │   └── medicalChecks.ts    # Medical condition compliance
│   └── config/                 # Configuration files
│       ├── atlas.ts            # MongoDB Atlas connection
│       ├── ai.ts               # AI service configuration
│       └── constants.ts        # App-wide constants
├── assets/                     # Static assets (images, fonts, etc.)
├── __tests__/                  # Test files
├── .expo/                      # Expo configuration (auto-generated)
├── android/                    # Android-specific files (if ejected)
├── ios/                        # iOS-specific files (if ejected)
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── app.json                    # Expo app configuration
└── README.md                   # This file
```

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Database**: MongoDB Atlas with Realm SDK
- **AI Services**: OpenAI GPT-4, Anthropic Claude (fallback)
- **Barcode Scanning**: expo-barcode-scanner
- **Navigation**: React Navigation v6
- **State Management**: React Context + Hooks
- **Testing**: Jest + React Native Testing Library
- **Code Quality**: ESLint + Prettier + TypeScript

## Package Management

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Expo CLI (installed globally)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   cd smarties
   npm install
   ```

2. **Validate the installation:**
   ```bash
   npm run deps:validate
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

### Available Scripts

#### Development
- `npm start` - Start the Expo development server
- `npm run start:clear` - Start with cleared cache
- `npm run android` - Start on Android device/emulator
- `npm run ios` - Start on iOS device/simulator

#### Building
- `npm run build:android` - Build Android APK
- `npm run build:ios` - Build iOS app

#### Testing
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests for CI/CD (no watch)

#### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

#### Validation & Maintenance
- `npm run validate` - Run full validation (type-check + lint + test)
- `npm run deps:check` - Check for outdated dependencies
- `npm run deps:update` - Update dependencies
- `npm run deps:validate` - Validate dependency installation
- `npm run security:audit` - Run security audit
- `npm run security:fix` - Fix security vulnerabilities
- `npm run clean` - Clear Expo cache

### Dependency Management

#### Core Dependencies
- **expo**: Expo SDK for React Native development
- **react-native**: React Native framework
- **realm**: MongoDB Realm SDK for offline-first data sync
- **openai**: OpenAI API client for AI-powered analysis
- **@anthropic-ai/sdk**: Anthropic Claude API client (fallback)
- **expo-barcode-scanner**: Barcode scanning functionality

#### Development Dependencies
- **typescript**: TypeScript compiler and type definitions
- **jest**: Testing framework
- **eslint**: Code linting and style enforcement
- **prettier**: Code formatting
- **@testing-library/react-native**: Testing utilities

#### Path Aliases
The project uses TypeScript path aliases for cleaner imports:
- `@/*` → `src/*`
- `@/components/*` → `src/components/*`
- `@/screens/*` → `src/screens/*`
- `@/services/*` → `src/services/*`
- `@/utils/*` → `src/utils/*`
- `@/types/*` → `src/types/*`
- `@/config/*` → `src/config/*`

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
# MongoDB Atlas Configuration
MONGODB_URI=your_mongodb_connection_string
MONGODB_DATABASE_NAME=smarties

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# App Configuration
APP_ENV=development
ENABLE_AI_ANALYSIS=true
ENABLE_OFFLINE_MODE=true
```

### Code Quality Standards

The project enforces strict code quality standards:

- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: Extended rules for React, React Native, and TypeScript
- **Prettier**: Consistent code formatting
- **Jest**: 80% minimum test coverage requirement
- **Husky**: Pre-commit hooks for code quality (optional)
- **Language**: TypeScript
- **Database**: MongoDB Atlas with Realm SDK
- **AI/ML**: OpenAI/Anthropic APIs
- **Barcode Scanning**: expo-barcode-scanner
- **Navigation**: React Navigation
- **Testing**: Jest + React Native Testing Library
- **Linting**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio and Android SDK (for Android development)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm start
   ```

3. **Run on specific platform**:
   ```bash
   npm run ios     # iOS Simulator
   npm run android # Android Emulator
   npm run web     # Web browser
   ```

### Environment Setup

1. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**:
   ```
   MONGODB_CONNECTION_STRING=your_mongodb_atlas_connection_string
   MONGODB_DATABASE_NAME=smarties_db
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

## Development Scripts

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS Simulator
- `npm run android` - Run on Android Emulator
- `npm run web` - Run in web browser
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## Architecture Guidelines

### Component Organization
- **Atomic Design**: Components organized by complexity (atoms → molecules → organisms)
- **Feature-Based**: Group related components by functionality
- **Reusability**: Common components in shared directories

### Service Layer
- **Atlas Service**: All MongoDB operations centralized
- **AI Service**: RAG pipeline and GenAI integrations
- **Dietary Service**: Core business logic for compliance checking
- **Barcode Service**: Scanning and product lookup functionality

### Data Flow
- **Unidirectional**: Data flows down, events flow up
- **Offline-First**: Local storage with Atlas sync
- **Event-Driven**: User actions trigger service calls

### Testing Strategy
- **Unit Tests**: Individual functions and components
- **Integration Tests**: Service interactions
- **E2E Tests**: Complete user workflows
- **Coverage Target**: 80% overall, 90%+ for critical paths

## Key Features (Planned)

### MVP (Phase 1)
- ✅ Project structure setup
- ⏳ Barcode scanning
- ⏳ Basic allergen detection
- ⏳ User profile setup
- ⏳ Offline core functionality

### Phase 2
- ⏳ Enhanced AI analysis
- ⏳ Product favorites
- ⏳ Scan history
- ⏳ Family profiles

### Phase 3
- ⏳ Image recognition
- ⏳ Restaurant integration
- ⏳ Social features

## Performance Requirements

- **Barcode Recognition**: <1 second
- **Product Lookup**: <2 seconds (cached), <5 seconds (API)
- **AI Analysis**: <3 seconds for complex products
- **App Launch**: <2 seconds to scanner ready
- **Battery Impact**: <5% drain per hour of active scanning

## Security & Privacy

- **Local Storage**: User profiles encrypted with device keychain
- **Data Minimization**: Only store necessary dietary restrictions
- **Anonymized Analytics**: Track usage patterns without PII
- **GDPR Compliance**: Right to deletion, data portability

## Contributing

1. Follow the established project structure
2. Use TypeScript for all new code
3. Write tests for new functionality
4. Follow the existing code style (ESLint + Prettier)
5. Update documentation as needed

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **iOS Simulator not starting**:
   - Ensure Xcode is installed and updated
   - Check iOS Simulator is available

3. **Android emulator issues**:
   - Ensure Android Studio is installed
   - Check Android SDK and emulator setup

4. **TypeScript errors**:
   ```bash
   npm run type-check
   ```

### Getting Help

- **Complete Setup Guide**: See [../DEVELOPMENT_SETUP.md](../DEVELOPMENT_SETUP.md)
- **Troubleshooting**: See [../TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- **Quick Reference**: See [../QUICK_REFERENCE.md](../QUICK_REFERENCE.md)
- **Team Onboarding**: See [../TEAM_ONBOARDING.md](../TEAM_ONBOARDING.md)
- **External Docs**: [Expo](https://docs.expo.dev/) | [React Native](https://reactnative.dev/docs/getting-started)

## License

This project is part of the SMARTIES hackathon and is intended for educational and demonstration purposes.