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

- Check the [Expo documentation](https://docs.expo.dev/)
- Review [React Native documentation](https://reactnative.dev/docs/getting-started)
- Check project issues and discussions

## License

This project is part of the SMARTIES hackathon and is intended for educational and demonstration purposes.