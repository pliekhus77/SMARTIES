# SMARTIES Development Setup Guide

**Complete setup guide for the SMARTIES hackathon project**

## 🎯 Quick Start (5 Minutes)

For experienced developers who want to get started immediately:

```bash
# 1. Clone and install dependencies
git clone <repository-url>
cd smarties-project
npm install
cd smarties && npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB and AI service credentials

# 3. Start development server
cd smarties
npm start

# 4. Run on device/simulator
npm run ios     # iOS Simulator
npm run android # Android Emulator
```

## 📋 Prerequisites

### Required Software

| Software | Version | Purpose | Installation |
|----------|---------|---------|--------------|
| **Node.js** | 18+ | JavaScript runtime | [Download](https://nodejs.org/) |
| **npm** | 8+ | Package manager | Included with Node.js |
| **Git** | Latest | Version control | [Download](https://git-scm.com/) |
| **Expo CLI** | Latest | React Native development | `npm install -g @expo/cli` |

### Platform-Specific Requirements

#### For Android Development
- **Android Studio** - Complete IDE with SDK
- **Java Development Kit (JDK)** - Version 11 or higher
- **Android SDK** - API Level 33 (Android 13)
- **Android Virtual Device (AVD)** - For testing

#### For iOS Development (macOS only)
- **Xcode** - Latest version from App Store
- **iOS Simulator** - Included with Xcode
- **CocoaPods** - iOS dependency manager

#### For Windows/Linux (iOS Testing)
- **Expo Go App** - Install on physical iOS device
- **Expo Account** - For cloud builds and testing

## 🚀 Step-by-Step Setup

### Step 1: Development Environment

#### Install Node.js and npm
1. Download Node.js 18+ from [nodejs.org](https://nodejs.org/)
2. Run installer and follow prompts
3. Verify installation:
   ```bash
   node --version  # Should show v18.x.x or higher
   npm --version   # Should show 8.x.x or higher
   ```

#### Install Expo CLI
```bash
npm install -g @expo/cli
expo --version  # Verify installation
```

### Step 2: Mobile Platform Setup

#### Android Setup (Windows/macOS/Linux)

1. **Download Android Studio**
   - Visit [developer.android.com/studio](https://developer.android.com/studio)
   - Download and install Android Studio

2. **Complete Android Studio Setup**
   - Launch Android Studio
   - Follow setup wizard (choose "Standard" installation)
   - Accept license agreements
   - Download Android SDK (this takes 15-30 minutes)

3. **Configure Environment Variables**
   
   **Windows (PowerShell):**
   ```powershell
   # Run our automated setup script
   .\setup-android-env.ps1
   
   # Or set manually:
   [Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
   [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", "$env:LOCALAPPDATA\Android\Sdk", "User")
   ```
   
   **macOS/Linux:**
   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
   export ANDROID_HOME=$HOME/Android/Sdk          # Linux
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

4. **Create Android Virtual Device**
   - Open Android Studio
   - Go to `Tools → AVD Manager`
   - Click "Create Virtual Device"
   - Choose **Pixel 4** device
   - Select **Android 13 (API 33)** system image
   - Name it `SMARTIES_Test_Device`
   - Click "Finish"

5. **Verify Android Setup**
   ```bash
   # Check ADB (Android Debug Bridge)
   adb version
   
   # List available virtual devices
   emulator -list-avds
   
   # Test React Native environment
   npx react-native doctor
   ```

#### iOS Setup (macOS only)

1. **Install Xcode**
   - Download from Mac App Store (this is large, ~10GB)
   - Launch Xcode and accept license agreements
   - Install additional components when prompted

2. **Install iOS Simulator**
   - Open Xcode
   - Go to `Xcode → Preferences → Components`
   - Download iOS simulators for testing

3. **Install CocoaPods**
   ```bash
   sudo gem install cocoapods
   pod --version  # Verify installation
   ```

#### iOS Testing on Windows/Linux

Since Xcode only runs on macOS, use these alternatives:

1. **Expo Go App (Recommended for Development)**
   - Install Expo Go from iOS App Store
   - Create free Expo account
   - Scan QR codes to test apps on device

2. **Cloud-Based Solutions**
   - **Expo EAS Build** - Cloud iOS builds
   - **GitHub Actions** - macOS runners for CI/CD
   - **MacStadium** - Rent Mac hardware

### Step 3: Project Setup

#### Clone Repository
```bash
git clone <repository-url>
cd smarties-project
```

#### Install Dependencies
```bash
# Install root project dependencies
npm install

# Install React Native app dependencies
cd smarties
npm install
cd ..
```

#### Environment Configuration

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**
   Edit `.env` file with your credentials:
   ```bash
   # MongoDB Atlas Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/smarties_db
   MONGODB_DB_NAME=smarties_db
   
   # AI Service Configuration (Demo Mode)
   AI_SERVICE_TYPE=demo
   AI_DEMO_MODE=true
   
   # AWS Configuration (Optional - for production)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   
   # Development Settings
   NODE_ENV=development
   DEBUG=true
   ```

### Step 4: Cloud Services Setup

#### MongoDB Atlas (Required)

1. **Create MongoDB Atlas Account**
   - Visit [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Sign up for free account
   - Create new project

2. **Create Database Cluster**
   - Choose "Build a Database"
   - Select "M0 Sandbox" (free tier)
   - Choose cloud provider and region
   - Name cluster (e.g., "smarties-cluster")

3. **Configure Database Access**
   - Create database user with read/write permissions
   - Add IP address to whitelist (0.0.0.0/0 for development)
   - Get connection string

4. **Set Up Database Structure**
   ```bash
   # Run database setup script
   node setup-database.js
   ```

#### AI Services (Demo Mode)

For the hackathon, we use a demo AI service that doesn't require external API keys:

```bash
# Test AI service setup
node test-ai-services.js
```

### Step 5: Verification

#### Test Complete Setup

1. **Verify Environment**
   ```bash
   # Check React Native environment
   npx react-native doctor
   
   # Test cloud integrations
   node test-cloud-integrations.js
   ```

2. **Start Development Server**
   ```bash
   cd smarties
   npm start
   ```

3. **Run on Platforms**
   ```bash
   # iOS (macOS only)
   npm run ios
   
   # Android
   npm run android
   
   # Web (for quick testing)
   npm run web
   ```

## 🔧 Development Workflow

### Daily Development

1. **Start Development Server**
   ```bash
   cd smarties
   npm start
   ```

2. **Run Tests**
   ```bash
   npm test              # Unit tests
   npm run test:watch    # Watch mode
   npm run test:coverage # Coverage report
   ```

3. **Code Quality**
   ```bash
   npm run lint          # ESLint
   npm run lint:fix      # Auto-fix issues
   npm run type-check    # TypeScript check
   ```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/barcode-scanning

# Make changes and commit
git add .
git commit -m "feat: implement barcode scanning functionality"

# Push and create pull request
git push origin feature/barcode-scanning
```

### Testing on Devices

#### Physical Android Device
1. Enable Developer Options and USB Debugging
2. Connect device via USB
3. Run `adb devices` to verify connection
4. Run `npm run android`

#### Physical iOS Device (macOS)
1. Connect device via USB
2. Trust computer when prompted
3. Open Xcode and add device to development team
4. Run `npm run ios --device`

#### Expo Go App
1. Install Expo Go from app store
2. Run `npm start` in project
3. Scan QR code with Expo Go app

## 📚 Project Structure

```
smarties-project/
├── .env                        # Environment variables
├── .env.example               # Environment template
├── README.md                  # Main project documentation
├── DEVELOPMENT_SETUP.md       # This setup guide
├── TROUBLESHOOTING.md         # Common issues and solutions
├── package.json               # Root project dependencies
├── setup-database.js          # Database initialization
├── test-cloud-integrations.js # Cloud service tests
├── smarties/                  # React Native application
│   ├── src/                   # Application source code
│   │   ├── components/        # Reusable components
│   │   ├── screens/           # Screen components
│   │   ├── services/          # Business logic
│   │   ├── models/            # Data models
│   │   ├── utils/             # Helper functions
│   │   └── config/            # Configuration
│   ├── assets/                # Images, fonts, etc.
│   ├── __tests__/             # Test files
│   ├── package.json           # App dependencies
│   ├── app.json               # Expo configuration
│   └── tsconfig.json          # TypeScript config
├── docs/                      # Additional documentation
├── design/                    # UI/UX mockups and assets
└── .kiro/                     # Kiro AI assistant specs
    └── specs/                 # Feature specifications
```

## 🎯 Development Commands Reference

### Essential Commands

```bash
# Project setup
npm install                    # Install root dependencies
cd smarties && npm install    # Install app dependencies

# Development
npm start                      # Start Expo dev server
npm run ios                    # Run on iOS
npm run android               # Run on Android
npm run web                   # Run in browser

# Testing
npm test                      # Run unit tests
npm run test:watch           # Watch mode
npm run test:coverage        # Coverage report
npm run test:e2e             # End-to-end tests

# Code quality
npm run lint                 # Run ESLint
npm run lint:fix            # Fix ESLint issues
npm run type-check          # TypeScript check
npm run format              # Format with Prettier

# Build
npm run build               # Build for production
npm run build:ios          # Build iOS app
npm run build:android      # Build Android app

# Utilities
npm run clean              # Clean cache and dependencies
npm run reset              # Reset Metro bundler
expo doctor               # Check Expo configuration
```

### Debugging Commands

```bash
# React Native debugging
npx react-native log-ios      # iOS logs
npx react-native log-android  # Android logs

# Expo debugging
expo start --clear            # Clear cache
expo start --tunnel          # Use tunnel for device testing
expo start --lan             # Use LAN for local network

# Environment debugging
node -e "console.log(process.env)" # Check environment variables
adb devices                   # List Android devices
xcrun simctl list devices     # List iOS simulators (macOS)
```

## 🔐 Security Best Practices

### Environment Variables
- ✅ Never commit `.env` files to version control
- ✅ Use different `.env` files for different environments
- ✅ Store sensitive data in secure environment variables
- ✅ Validate environment variables at startup

### API Keys and Secrets
- ✅ Store API keys in environment variables
- ✅ Use different keys for development and production
- ✅ Rotate keys regularly
- ✅ Monitor API usage and costs

### Code Security
- ✅ Keep dependencies updated
- ✅ Run security audits: `npm audit`
- ✅ Use TypeScript for type safety
- ✅ Validate all user inputs

## 📊 Performance Optimization

### Development Performance
- Use `--clear` flag when Metro bundler is slow
- Close unnecessary applications during development
- Use physical devices for performance testing
- Monitor memory usage during development

### App Performance
- Optimize images and assets
- Use lazy loading for screens
- Implement proper error boundaries
- Monitor bundle size: `npx react-native bundle --analyze`

## 🆘 Getting Help

### Documentation Resources
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

### Troubleshooting
- Check `TROUBLESHOOTING.md` for common issues
- Run `expo doctor` to check configuration
- Check React Native environment: `npx react-native doctor`
- Search GitHub issues for similar problems

### Team Support
- Create GitHub issue for bugs
- Use GitHub Discussions for questions
- Check project documentation in `/docs` folder
- Ask team members during development

## ✅ Setup Completion Checklist

### Environment Setup
- [ ] Node.js 18+ installed and verified
- [ ] Expo CLI installed globally
- [ ] Git configured with user name and email
- [ ] Code editor (VS Code) with React Native extensions

### Platform Setup
- [ ] Android Studio installed and configured
- [ ] Android SDK and AVD created
- [ ] Environment variables set (ANDROID_HOME, PATH)
- [ ] iOS development tools (macOS) or Expo Go app
- [ ] Physical devices configured for testing

### Project Setup
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured in `.env`
- [ ] MongoDB Atlas cluster created and connected
- [ ] Database structure initialized
- [ ] AI services configured (demo mode)

### Verification
- [ ] `npm start` runs without errors
- [ ] App loads on iOS simulator/device
- [ ] App loads on Android emulator/device
- [ ] Barcode scanner works on physical device
- [ ] Database connection successful
- [ ] All tests pass: `npm test`

### Development Ready
- [ ] Can create new branches and commit changes
- [ ] Code linting and formatting work
- [ ] Hot reload works during development
- [ ] Can build app for testing
- [ ] Team collaboration tools configured

---

**🎉 Congratulations!** Your SMARTIES development environment is ready for the hackathon!

## 🚀 Next Steps

1. **Explore the Codebase**: Familiarize yourself with the project structure
2. **Run the App**: Test barcode scanning on a physical device
3. **Review Specs**: Check `.kiro/specs/` for feature requirements
4. **Start Coding**: Begin implementing your assigned features
5. **Test Frequently**: Use the test suite to ensure quality

**Happy Coding!** 🛡️📱