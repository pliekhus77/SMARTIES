# SMARTIES Troubleshooting Guide

**Common issues and solutions for SMARTIES development**

## 🚨 Quick Fixes

### App Won't Start
```bash
# Clear Metro bundler cache
npx expo start --clear

# Reset npm cache
npm start -- --reset-cache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm install
npm start
```

### Device Connection Issues
```bash
# Android: Check device connection
adb devices

# iOS: Restart simulator
xcrun simctl shutdown all
xcrun simctl boot "iPhone 14"
```

## 📱 Platform-Specific Issues

### Android Issues

#### "ANDROID_HOME not set" Error

**Problem**: Environment variables not configured properly

**Solution**:
```bash
# Windows (PowerShell)
.\setup-android-env.ps1

# Or set manually:
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools"

# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

**Verification**:
```bash
echo $ANDROID_HOME  # Should show SDK path
adb version         # Should show ADB version
```

#### "SDK not found" Error

**Problem**: Android SDK not properly installed

**Solution**:
1. Open Android Studio
2. Go to `File → Settings → Appearance & Behavior → System Settings → Android SDK`
3. Install Android 13 (API level 33)
4. Install SDK Build-Tools and Platform-Tools
5. Restart terminal/IDE

#### Android Emulator Won't Start

**Problem**: Virtualization or hardware acceleration issues

**Solutions**:

**Windows**:
```bash
# Enable Hyper-V in Windows Features
# Or install Intel HAXM from SDK Manager
```

**macOS**:
```bash
# Check if virtualization is enabled
sysctl kern.hv_support
# Should return 1
```

**Linux**:
```bash
# Install KVM
sudo apt install qemu-kvm libvirt-daemon-system
sudo usermod -aG kvm $USER
```

**Alternative**: Use physical Android device instead

#### "ADB not found" Error

**Problem**: ADB not in system PATH

**Solution**:
```bash
# Add to PATH (Windows)
$env:PATH += ";$env:ANDROID_HOME\platform-tools"

# Add to PATH (macOS/Linux)
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Test ADB
adb version
```

#### Gradle Build Failures

**Problem**: Gradle configuration or dependency issues

**Solutions**:
```bash
# Clean Gradle cache
cd android
./gradlew clean

# Update Gradle wrapper
./gradlew wrapper --gradle-version=7.6

# Clear Gradle cache globally
rm -rf ~/.gradle/caches/
```

### iOS Issues

#### "Xcode not found" Error (macOS)

**Problem**: Xcode not installed or not in expected location

**Solution**:
1. Install Xcode from Mac App Store
2. Launch Xcode and accept license agreements
3. Install additional components when prompted
4. Set Xcode command line tools:
   ```bash
   sudo xcode-select --install
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

#### iOS Simulator Not Starting

**Problem**: Simulator configuration issues

**Solutions**:
```bash
# List available simulators
xcrun simctl list devices

# Boot specific simulator
xcrun simctl boot "iPhone 14"

# Reset simulator
xcrun simctl erase all

# Restart simulator service
sudo killall -9 com.apple.CoreSimulator.CoreSimulatorService
```

#### CocoaPods Issues

**Problem**: Pod installation or dependency conflicts

**Solutions**:
```bash
# Update CocoaPods
sudo gem install cocoapods

# Clean and reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install

# Clear CocoaPods cache
pod cache clean --all
```

#### iOS Build Errors

**Problem**: Code signing or provisioning profile issues

**Solutions**:
1. Open project in Xcode
2. Select project in navigator
3. Go to "Signing & Capabilities"
4. Select development team
5. Enable "Automatically manage signing"

### Windows-Specific iOS Issues

#### Cannot Test on iOS

**Problem**: Xcode only available on macOS

**Solutions**:

**Option 1: Expo Go App (Recommended)**
1. Install Expo Go from iOS App Store
2. Create Expo account
3. Run `npm start` in project
4. Scan QR code with Expo Go app

**Option 2: Cloud Solutions**
- **Expo EAS Build**: Cloud-based iOS builds
- **GitHub Actions**: Use macOS runners
- **MacStadium**: Rent Mac hardware

**Option 3: Virtual Machine**
- Use macOS VM (check licensing requirements)
- Install Xcode in VM
- Performance may be limited

## 🔧 Development Environment Issues

### Node.js and npm Issues

#### "Node version not supported"

**Problem**: Wrong Node.js version

**Solution**:
```bash
# Check current version
node --version

# Install Node Version Manager (nvm)
# Windows: Use nvm-windows
# macOS/Linux: Use nvm

# Install and use Node.js 18
nvm install 18
nvm use 18

# Verify version
node --version  # Should show v18.x.x
```

#### npm Install Failures

**Problem**: Network issues or corrupted cache

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Use different registry
npm install --registry https://registry.npmjs.org/

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check npm configuration
npm config list
```

#### Permission Errors (macOS/Linux)

**Problem**: npm trying to write to system directories

**Solution**:
```bash
# Change npm default directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to PATH in ~/.bashrc or ~/.zshrc
export PATH=~/.npm-global/bin:$PATH

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

### Expo Issues

#### "Expo CLI not found"

**Problem**: Expo CLI not installed globally

**Solution**:
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Verify installation
expo --version

# Alternative: Use npx
npx expo --version
```

#### Expo Start Fails

**Problem**: Port conflicts or cache issues

**Solutions**:
```bash
# Start on different port
expo start --port 19001

# Clear Expo cache
expo start --clear

# Reset Metro bundler
expo start --reset-cache

# Check for port conflicts
lsof -i :19000  # macOS/Linux
netstat -ano | findstr :19000  # Windows
```

#### QR Code Not Scanning

**Problem**: Network configuration or firewall issues

**Solutions**:
```bash
# Use tunnel mode
expo start --tunnel

# Use LAN mode
expo start --lan

# Check firewall settings
# Allow Expo CLI through firewall

# Use localhost mode
expo start --localhost
```

## 🗄️ Database Issues

### MongoDB Atlas Connection Issues

#### "Connection String Invalid"

**Problem**: Malformed connection string or credentials

**Solution**:
1. Check connection string format:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database
   ```
2. Verify username and password are correct
3. Ensure special characters in password are URL-encoded
4. Check database name is specified

#### "Network Access Denied"

**Problem**: IP address not whitelisted

**Solution**:
1. Go to MongoDB Atlas dashboard
2. Navigate to "Network Access"
3. Add current IP address or use 0.0.0.0/0 for development
4. Wait 2-3 minutes for changes to propagate

#### "Authentication Failed"

**Problem**: Database user credentials incorrect

**Solution**:
1. Go to "Database Access" in MongoDB Atlas
2. Verify username exists
3. Reset password if needed
4. Ensure user has read/write permissions
5. Update connection string with new credentials

#### Database Connection Timeout

**Problem**: Network connectivity or firewall issues

**Solutions**:
```bash
# Test basic connectivity
ping cluster0.xxxxx.mongodb.net

# Check firewall settings
# Allow outbound connections on port 27017

# Try different connection method
# Use connection string with different options
mongodb+srv://user:pass@cluster.net/db?retryWrites=true&w=majority&connectTimeoutMS=30000
```

### Local Database Issues

#### MongoDB Not Starting

**Problem**: Local MongoDB service not running

**Solutions**:
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Check status
mongo --version
```

## 🤖 AI Service Issues

### Demo AI Service Issues

#### AI Service Not Responding

**Problem**: Demo service configuration or implementation issues

**Solution**:
```bash
# Test AI service
node test-ai-services.js

# Check environment variables
echo $AI_SERVICE_TYPE  # Should be 'demo'
echo $AI_DEMO_MODE     # Should be 'true'

# Verify demo service implementation
# Check services/DemoAIService.js exists
```

### AWS/Bedrock Issues (Production)

#### "AWS Credentials Not Found"

**Problem**: AWS credentials not configured

**Solutions**:
```bash
# Configure AWS CLI
aws configure

# Set environment variables
export AWS_ACCESS_KEY_ID=your-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1

# Test credentials
aws sts get-caller-identity
```

#### "Bedrock Access Denied"

**Problem**: Insufficient permissions or model access

**Solutions**:
1. Request model access in AWS Bedrock console
2. Check IAM permissions for Bedrock
3. Verify region supports Bedrock
4. Wait for model access approval (can take time)

## 📱 App Runtime Issues

### Barcode Scanner Issues

#### Camera Permission Denied

**Problem**: User denied camera permissions

**Solutions**:
1. **iOS**: Go to Settings → Privacy → Camera → Enable for Expo Go
2. **Android**: Go to Settings → Apps → Expo Go → Permissions → Enable Camera
3. Restart app after enabling permissions

#### Barcode Scanner Not Working

**Problem**: Camera not initializing or barcode detection failing

**Solutions**:
```javascript
// Check camera permissions in code
import { Camera } from 'expo-camera';

const [permission, requestPermission] = Camera.useCameraPermissions();

if (!permission?.granted) {
  await requestPermission();
}
```

**Physical Device Required**: Barcode scanner doesn't work in simulators

#### "Camera not available"

**Problem**: Device doesn't have camera or camera is in use

**Solutions**:
1. Test on physical device with camera
2. Close other apps using camera
3. Restart device if camera is stuck
4. Check if camera hardware is working

### Performance Issues

#### App Running Slowly

**Problem**: Performance bottlenecks or memory issues

**Solutions**:
```bash
# Enable performance monitoring
expo start --dev-client

# Check bundle size
npx react-native bundle --analyze

# Profile with Flipper
npm install -g flipper
```

**Code Optimizations**:
- Use React.memo for expensive components
- Implement lazy loading for screens
- Optimize images and assets
- Use FlatList for large lists

#### Memory Leaks

**Problem**: App consuming too much memory

**Solutions**:
1. Use React DevTools Profiler
2. Check for unsubscribed event listeners
3. Clean up timers and intervals
4. Optimize image loading and caching

### Network Issues

#### API Calls Failing

**Problem**: Network connectivity or API configuration

**Solutions**:
```bash
# Test network connectivity
ping google.com

# Check API endpoints
curl -I https://api.openai.com
curl -I https://world.openfoodfacts.org

# Verify environment variables
echo $MONGODB_URI
echo $OPENAI_API_KEY
```

#### CORS Errors (Web)

**Problem**: Cross-origin resource sharing restrictions

**Solutions**:
1. Use proxy server for development
2. Configure API server to allow CORS
3. Use React Native instead of web for production

## 🧪 Testing Issues

### Test Failures

#### "Tests not found"

**Problem**: Test configuration or file naming issues

**Solutions**:
```bash
# Check Jest configuration
cat package.json | grep -A 10 "jest"

# Verify test file naming
# Should be *.test.js or *.spec.js
# Or in __tests__ directory

# Run specific test
npm test -- --testNamePattern="specific test"
```

#### Mock Issues

**Problem**: Mocks not working properly

**Solutions**:
```javascript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Dimensions: { get: () => ({ width: 375, height: 667 }) }
}));
```

### Integration Test Issues

#### Database Connection in Tests

**Problem**: Tests can't connect to database

**Solutions**:
```javascript
// Use test database
const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/smarties_test';

// Clean database before tests
beforeEach(async () => {
  await db.collection('products').deleteMany({});
  await db.collection('users').deleteMany({});
});
```

## 🔍 Debugging Techniques

### React Native Debugging

#### Enable Debug Mode
```bash
# Shake device or press Cmd+D (iOS) / Cmd+M (Android)
# Select "Debug JS Remotely"
# Open Chrome DevTools
```

#### Console Logging
```javascript
// Use console.log for debugging
console.log('Debug info:', variable);

// Use React Native Debugger
// Install: npm install -g react-native-debugger
```

#### Network Debugging
```javascript
// Enable network inspector
// Shake device → Debug → Network Inspector

// Or use Flipper for advanced debugging
```

### Performance Debugging

#### React DevTools
```bash
# Install React DevTools
npm install -g react-devtools

# Start React DevTools
react-devtools
```

#### Memory Profiling
```javascript
// Use Chrome DevTools Memory tab
// Take heap snapshots to find memory leaks
// Compare snapshots over time
```

## 📞 Getting Additional Help

### Documentation Resources
- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- [Expo Troubleshooting](https://docs.expo.dev/troubleshooting/overview/)
- [MongoDB Atlas Troubleshooting](https://docs.atlas.mongodb.com/troubleshoot-connection/)

### Community Support
- [React Native Community](https://github.com/react-native-community)
- [Expo Forums](https://forums.expo.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

### Team Support
1. **Create GitHub Issue**: For bugs and technical problems
2. **GitHub Discussions**: For questions and ideas
3. **Team Chat**: For immediate help during development
4. **Code Review**: Ask team members to review problematic code

## 🆘 Emergency Fixes

### Complete Reset (Nuclear Option)

If nothing else works, try a complete reset:

```bash
# 1. Clean everything
rm -rf node_modules package-lock.json
cd smarties
rm -rf node_modules package-lock.json
cd ..

# 2. Clear caches
npm cache clean --force
expo start --clear

# 3. Reinstall everything
npm install
cd smarties
npm install
cd ..

# 4. Reset Git (if needed)
git clean -fdx
git reset --hard HEAD

# 5. Restart development server
cd smarties
npm start
```

### Rollback to Working State

```bash
# Find last working commit
git log --oneline

# Rollback to specific commit
git reset --hard <commit-hash>

# Or create new branch from working commit
git checkout -b fix-branch <commit-hash>
```

## ✅ Prevention Checklist

### Before Starting Development
- [ ] Verify all prerequisites are installed
- [ ] Run setup verification scripts
- [ ] Test on both platforms (if possible)
- [ ] Backup working configuration

### During Development
- [ ] Commit frequently with descriptive messages
- [ ] Test changes on multiple devices/simulators
- [ ] Keep dependencies updated regularly
- [ ] Monitor app performance and memory usage

### Before Deployment
- [ ] Run full test suite
- [ ] Test on physical devices
- [ ] Verify all environment variables
- [ ] Check for security vulnerabilities

---

**Remember**: Most issues have been encountered by others before. Search for error messages, check documentation, and don't hesitate to ask for help!

**Happy Debugging!** 🐛🔧