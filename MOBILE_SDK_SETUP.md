# Mobile Platform SDK Setup Guide

## Task 1.3: Configure Mobile Platform SDKs

This guide covers setting up both Android and iOS development environments for the SMARTIES React Native project.

## Current Status ✅

- ✅ **Android Studio**: Installed
- ✅ **Java**: Available
- ❌ **Android SDK**: Needs configuration
- ❌ **Environment Variables**: Need to be set

## Android Development Setup (Primary Platform)

### Step 1: Complete Android Studio Setup

1. **Launch Android Studio**
   ```
   Start Menu → Android Studio
   ```

2. **Complete Setup Wizard**
   - Accept license agreements
   - Choose "Standard" installation
   - Download Android SDK (this may take 15-30 minutes)
   - Install Android Virtual Device (AVD)

3. **Install Required SDK Components**
   - Open Android Studio
   - Go to `File → Settings → Appearance & Behavior → System Settings → Android SDK`
   - Install these SDK platforms:
     - Android 13 (API level 33) - Recommended for React Native
     - Android 12 (API level 31) - Fallback
   - In "SDK Tools" tab, ensure these are installed:
     - Android SDK Build-Tools
     - Android SDK Platform-Tools
     - Android SDK Tools
     - Intel x86 Emulator Accelerator (HAXM installer)

### Step 2: Set Environment Variables

Run this PowerShell script to configure environment variables:

```powershell
.\setup-android-env.ps1
```

Or set manually:
1. Open System Properties → Advanced → Environment Variables
2. Add User Variables:
   - `ANDROID_HOME`: `C:\Users\[YourUsername]\AppData\Local\Android\Sdk`
   - `ANDROID_SDK_ROOT`: `C:\Users\[YourUsername]\AppData\Local\Android\Sdk`
3. Add to PATH:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\tools`
   - `%ANDROID_HOME%\tools\bin`

### Step 3: Create Android Virtual Device (AVD)

1. In Android Studio: `Tools → AVD Manager`
2. Click "Create Virtual Device"
3. Choose device: **Pixel 4** (recommended)
4. Choose system image: **Android 13 (API 33)**
5. Name it: `SMARTIES_Test_Device`
6. Click "Finish"

### Step 4: Test Android Setup

```powershell
# Run verification script
.\android-check.ps1

# Test ADB (Android Debug Bridge)
adb version

# List available AVDs
emulator -list-avds

# Start emulator (optional)
emulator -avd SMARTIES_Test_Device
```

## iOS Development Setup (Limited on Windows)

### Limitations on Windows
- ❌ Cannot install Xcode (macOS only)
- ❌ Cannot run iOS Simulator (macOS only)
- ❌ Cannot build iOS apps locally

### Available Options

#### Option 1: Expo Go (Recommended for Hackathon)
1. **Install Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

2. **Install Expo Go on iOS Device**
   - Download from App Store
   - Sign up for Expo account

3. **Test with Expo**
   ```bash
   npx expo start
   # Scan QR code with Expo Go app
   ```

#### Option 2: Cloud-Based iOS Development
- **Expo EAS Build**: Cloud-based iOS builds
- **GitHub Actions**: macOS runners for CI/CD
- **MacStadium**: Rent Mac hardware in the cloud

## Verification Checklist

### Android Development ✅
- [ ] Android Studio installed and configured
- [ ] Android SDK downloaded (API 33)
- [ ] Environment variables set (ANDROID_HOME, PATH)
- [ ] ADB command works: `adb version`
- [ ] AVD created and can start emulator
- [ ] Can run: `npx react-native run-android`

### iOS Development (Windows Limitations)
- [ ] Expo CLI installed: `expo --version`
- [ ] Expo Go app installed on iOS device
- [ ] Can scan QR code and load Expo apps
- [ ] Expo account created for cloud builds

## Testing Your Setup

### Test Android Environment
```bash
# Check React Native environment
npx react-native doctor

# Create test project
npx react-native init TestApp --template react-native-template-typescript
cd TestApp

# Run on Android
npx react-native run-android
```

### Test iOS with Expo
```bash
# Create Expo test project
npx create-expo-app TestExpoApp --template
cd TestExpoApp

# Start development server
npx expo start

# Scan QR code with Expo Go app on iOS device
```

## Troubleshooting

### Common Android Issues

**"ANDROID_HOME not set"**
- Run `setup-android-env.ps1` script
- Restart terminal/IDE after setting environment variables

**"SDK not found"**
- Verify SDK path: `C:\Users\[Username]\AppData\Local\Android\Sdk`
- Re-run Android Studio setup wizard

**"Emulator won't start"**
- Enable Hyper-V in Windows Features
- Install Intel HAXM from SDK Manager
- Allocate more RAM to AVD (4GB recommended)

**"ADB not found"**
- Add `%ANDROID_HOME%\platform-tools` to PATH
- Restart terminal

### Common iOS Issues

**"Cannot test on iOS"**
- Use Expo Go app for testing
- Consider cloud-based solutions for builds

## Next Steps

After completing this setup:

1. ✅ **Task 1.3 Complete**: Mobile platform SDKs configured
2. ➡️ **Task 1.4**: Install barcode scanning dependencies
3. ➡️ **Task 2.1**: Create MongoDB Atlas cluster

## Files Created

- `setup-android-env.ps1` - Environment variable setup script
- `android-check.ps1` - Quick verification script
- `ios-development-windows.md` - iOS development options on Windows
- `MOBILE_SDK_SETUP.md` - This comprehensive guide

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run `android-check.ps1` to verify current status
3. Consult React Native documentation: https://reactnative.dev/docs/environment-setup