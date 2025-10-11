# SMARTIES Quick Reference

**Essential commands and information for SMARTIES development**

## 🚀 Quick Start Commands

```bash
# Setup (one-time)
npm install && cd smarties && npm install
cp .env.example .env

# Daily development
cd smarties
npm start                    # Start development server
npm run ios                  # Run on iOS
npm run android             # Run on Android
```

## 📱 Development Commands

### Project Management
```bash
# Install dependencies
npm install                  # Root dependencies
cd smarties && npm install  # App dependencies

# Clean and reset
npm run clean               # Clean cache
npm start -- --clear       # Clear Metro cache
rm -rf node_modules && npm install  # Nuclear reset
```

### Development Server
```bash
cd smarties
npm start                   # Start Expo dev server
npm start -- --clear       # Start with cache cleared
npm start -- --tunnel      # Use tunnel for device testing
npm start -- --lan         # Use LAN for local network
```

### Platform-Specific
```bash
# iOS (macOS only)
npm run ios                 # Run on iOS Simulator
npm run ios -- --device    # Run on connected iOS device

# Android
npm run android             # Run on Android Emulator
npm run android -- --device # Run on connected Android device

# Web (for quick testing)
npm run web                 # Run in browser
```

### Testing
```bash
npm test                    # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
npm run test:e2e           # Run end-to-end tests (future)
```

### Code Quality
```bash
npm run lint               # Run ESLint
npm run lint:fix          # Fix ESLint issues automatically
npm run type-check        # Run TypeScript type checking
npm run format            # Format code with Prettier
```

### Build & Deploy
```bash
npm run build             # Build for production
npm run build:ios        # Build iOS app
npm run build:android    # Build Android app
```

## 🔧 Debugging Commands

### React Native Debugging
```bash
npx react-native log-ios      # View iOS logs
npx react-native log-android  # View Android logs
npx react-native doctor       # Check RN environment
```

### Expo Debugging
```bash
expo doctor                   # Check Expo configuration
expo start --clear           # Clear cache and start
expo start --dev-client      # Use development build
```

### Environment Debugging
```bash
# Check environment variables
node -e "console.log(process.env)"
echo $MONGODB_URI
echo $AI_SERVICE_TYPE

# Check versions
node --version               # Node.js version
npm --version               # npm version
expo --version              # Expo CLI version
```

### Platform Debugging
```bash
# Android
adb devices                 # List connected Android devices
adb logcat                  # View Android system logs
emulator -list-avds         # List Android Virtual Devices

# iOS (macOS only)
xcrun simctl list devices   # List iOS simulators
xcrun simctl boot "iPhone 14"  # Boot specific simulator
```

## 🗄️ Database Commands

### MongoDB Atlas
```bash
# Test database connection
node test-mongodb-connection.js

# Setup database structure
node setup-database.js

# Run database playground
node playground-1.mongodb.js
```

### Local Development
```bash
# Test cloud integrations
node test-cloud-integrations.js

# Test AI services
node test-ai-services.js
```

## 🔐 Environment Variables

### Required Variables (.env)
```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:pass@cluster.net/smarties_db
MONGODB_DB_NAME=smarties_db

# AI Service (Demo Mode)
AI_SERVICE_TYPE=demo
AI_DEMO_MODE=true

# Development
NODE_ENV=development
DEBUG=true
```

### Optional Variables (Production)
```bash
# AWS (for production AI)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# OpenAI (alternative)
OPENAI_API_KEY=your-openai-key

# Anthropic (alternative)
ANTHROPIC_API_KEY=your-anthropic-key
```

## 📁 Project Structure

```
smarties-project/
├── smarties/              # React Native app
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── screens/       # App screens
│   │   ├── services/      # Business logic
│   │   ├── models/        # Data models
│   │   └── utils/         # Helper functions
│   ├── assets/            # Images, fonts
│   ├── __tests__/         # Test files
│   └── package.json       # App dependencies
├── docs/                  # Documentation
├── design/                # UI mockups
├── .kiro/specs/          # Feature specs
├── .env                   # Environment variables
└── package.json          # Root dependencies
```

## 🎯 Key Files

### Configuration Files
- `smarties/app.json` - Expo app configuration
- `smarties/package.json` - App dependencies and scripts
- `smarties/tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (create from .env.example)

### Main App Files
- `smarties/App.tsx` - Main app component
- `smarties/src/screens/ScanScreen.tsx` - Barcode scanner
- `smarties/src/services/` - Business logic services
- `smarties/src/components/` - Reusable UI components

### Setup & Testing
- `setup-database.js` - Initialize MongoDB structure
- `test-cloud-integrations.js` - Test all cloud services
- `test-ai-services.js` - Test AI service integration

## 🚨 Common Issues & Quick Fixes

### App Won't Start
```bash
npx expo start --clear      # Clear cache
rm -rf node_modules && npm install  # Reinstall dependencies
```

### Build Errors
```bash
cd smarties
rm -rf node_modules package-lock.json
npm install
npm start
```

### Android Issues
```bash
# Check environment
echo $ANDROID_HOME
adb version

# Reset emulator
emulator -wipe-data -avd SMARTIES_Test_Device
```

### iOS Issues (macOS)
```bash
# Reset simulator
xcrun simctl erase all
xcrun simctl boot "iPhone 14"

# Clean Xcode build
cd ios && xcodebuild clean
```

### Database Connection
```bash
# Test MongoDB connection
node test-mongodb-connection.js

# Check environment variables
echo $MONGODB_URI
```

## 📞 Getting Help

### Documentation
1. **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)** - Complete setup guide
2. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues
3. **[TEAM_ONBOARDING.md](TEAM_ONBOARDING.md)** - New team members

### Support Channels
- **GitHub Issues** - Bug reports
- **GitHub Discussions** - Questions
- **Team Chat** - Real-time help
- **Code Review** - Get feedback

### External Resources
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)

## ✅ Daily Checklist

### Before Starting Development
- [ ] Pull latest changes: `git pull origin main`
- [ ] Check environment: `node -e "console.log(process.env.MONGODB_URI)"`
- [ ] Start dev server: `cd smarties && npm start`
- [ ] Verify app loads on device/simulator

### Before Committing
- [ ] Run tests: `npm test`
- [ ] Check linting: `npm run lint`
- [ ] Type check: `npm run type-check`
- [ ] Test on device: Verify changes work

### End of Day
- [ ] Commit changes: `git add . && git commit -m "feat: description"`
- [ ] Push to branch: `git push origin feature-branch`
- [ ] Update team on progress

---

**Keep this reference handy for quick access to essential commands!** 📋✨