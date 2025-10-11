# SMARTIES Hackathon Development Environment Setup

## 🚀 Quick Start Checklist

### Prerequisites (Required)
- [ ] **Node.js 18+** installed (`node --version`)
- [ ] **npm** or **yarn** package manager
- [ ] **Git** installed and configured
- [ ] **Code editor** (VS Code recommended)

### Platform-Specific Requirements

#### For iOS Development
- [ ] **macOS** (required for iOS development)
- [ ] **Xcode 15+** installed from App Store
- [ ] **iOS Simulator** configured
- [ ] **Xcode Command Line Tools** (`xcode-select --install`)

#### For Android Development
- [ ] **Android Studio** installed
- [ ] **Android SDK** (API level 33+)
- [ ] **Android Emulator** or physical device
- [ ] **Java Development Kit (JDK) 11+**

### Environment Setup Steps

#### 1. Clone Repository
```bash
git clone <repository-url>
cd SMARTIES
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials (see Shared Resources section)
```

#### 4. Verify Setup
```bash
# Run tests to verify everything works
npm test

# Run platform tests
npm run test:platform

# Start development server
npm start
```

#### 5. Platform-Specific Setup

**For iOS:**
```bash
# Install iOS dependencies (if using React Native CLI)
cd ios && pod install && cd ..

# Run on iOS simulator
npm run ios
```

**For Android:**
```bash
# Start Android emulator first, then:
npm run android
```

## 🔧 Shared Development Resources

### Required API Keys and Credentials

#### MongoDB Atlas
- **Connection String**: `mongodb+srv://smarties-hackathon:PASSWORD@cluster.mongodb.net/smarties`
- **Database**: `smarties_hackathon`
- **Username**: `smarties-hackathon`
- **Password**: [Provided separately for security]

#### OpenAI API
- **API Key**: `sk-hackathon-XXXXXXXXXXXXXXXX`
- **Organization**: SMARTIES Hackathon Team
- **Usage Limit**: 1000 requests/hour

#### Anthropic API (Fallback)
- **API Key**: `sk-ant-hackathon-XXXXXXXXXXXXXXXX`
- **Usage Limit**: 500 requests/hour

#### Open Food Facts API
- **Base URL**: `https://world.openfoodfacts.org/api/v0`
- **No API key required** (public API)

### Environment Variables Template
```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://smarties-hackathon:PASSWORD@cluster.mongodb.net/smarties
MONGODB_DATABASE=smarties_hackathon

# AI Service Configuration
OPENAI_API_KEY=sk-hackathon-XXXXXXXXXXXXXXXX
ANTHROPIC_API_KEY=sk-ant-hackathon-XXXXXXXXXXXXXXXX

# External API Configuration
OPEN_FOOD_FACTS_API_URL=https://world.openfoodfacts.org/api/v0

# Development Configuration
NODE_ENV=development
LOG_LEVEL=debug
```

## ✅ Validation Steps

### 1. Test Configuration Loading
```bash
npm test -- src/config/__tests__/config.test.ts
```
**Expected**: All configuration tests pass

### 2. Test Security Implementation
```bash
npm test -- src/services/security/__tests__/security.test.ts
```
**Expected**: All security tests pass

### 3. Test Platform Functionality
```bash
npm run test:platform:ios
npm run test:platform:android
```
**Expected**: Platform-specific tests pass

### 4. Test Integration Points
```bash
npm run test:integration
```
**Expected**: Integration tests pass (may have minor failures - this is normal)

### 5. Verify Application Startup
```bash
npm start
```
**Expected**: Development server starts without errors

## 🎯 Team Roles and Responsibilities

### Frontend Team
- **Focus**: React Native UI components, user experience
- **Key Files**: `src/components/`, `src/screens/`
- **Tests**: Component tests, UI interaction tests

### Backend/API Team
- **Focus**: MongoDB integration, AI services, external APIs
- **Key Files**: `src/services/`, `src/utils/`
- **Tests**: Service tests, integration tests

### Platform Team
- **Focus**: iOS/Android specific features, barcode scanning
- **Key Files**: Platform-specific implementations
- **Tests**: Platform tests, cross-platform validation

### Testing/QA Team
- **Focus**: Test coverage, bug finding, validation
- **Key Files**: `src/test/`
- **Tests**: All test suites, manual testing

## 📱 Development Workflow

### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm test

# Commit and push
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 2. Testing Strategy
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test service interactions
- **Platform Tests**: Test iOS/Android specific functionality
- **Manual Testing**: Test on actual devices when possible

### 3. Code Quality
```bash
# Run linting
npm run lint

# Run all tests
npm run test:all

# Check test coverage
npm run test:coverage
```

## 🚨 Common Issues and Solutions

### Node.js Version Issues
```bash
# Check version
node --version

# If wrong version, use nvm (recommended)
nvm install 18
nvm use 18
```

### iOS Simulator Issues
```bash
# Reset iOS simulator
xcrun simctl erase all

# Rebuild iOS
cd ios && rm -rf build && cd ..
npm run ios
```

### Android Emulator Issues
```bash
# List available emulators
emulator -list-avds

# Start specific emulator
emulator -avd Pixel_8_API_33

# Clean Android build
cd android && ./gradlew clean && cd ..
npm run android
```

### Dependency Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variable Issues
```bash
# Verify .env file exists and has correct format
cat .env

# Check if variables are loaded
npm test -- src/config/__tests__/config.test.ts
```

## 📞 Getting Help

### During Hackathon
- **Slack Channel**: #smarties-dev
- **Video Call**: [Hackathon meeting room link]
- **Documentation**: This file and `/docs` folder

### Technical Issues
1. Check this troubleshooting guide first
2. Ask in Slack channel
3. Pair program with team member
4. Escalate to technical lead

### API Issues
- **MongoDB**: Check connection string and network access
- **OpenAI**: Verify API key and usage limits
- **Barcode Scanning**: Test on physical device if simulator fails

## 🎉 Success Criteria

Your environment is ready when:
- [ ] All tests pass (`npm run test:all`)
- [ ] Application starts without errors (`npm start`)
- [ ] You can run on at least one platform (iOS or Android)
- [ ] Configuration loads correctly
- [ ] You can make changes and see them reflected

## 📋 Pre-Hackathon Checklist

**24 Hours Before:**
- [ ] Complete environment setup
- [ ] Run all validation steps
- [ ] Test on target platform (iOS/Android)
- [ ] Join team Slack channel
- [ ] Review project documentation

**Day of Hackathon:**
- [ ] Pull latest code (`git pull origin main`)
- [ ] Verify environment still works
- [ ] Confirm team role and responsibilities
- [ ] Ready to code! 🚀

---

**Need help?** Contact the technical lead or post in #smarties-dev Slack channel.

**Last Updated**: [Current Date]
**Version**: 1.0
