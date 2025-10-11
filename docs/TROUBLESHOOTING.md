# SMARTIES Troubleshooting Guide

## 🚨 Quick Fixes for Common Issues

### Environment Setup Issues

#### Node.js Version Problems
**Problem**: Wrong Node.js version or Node.js not found
```bash
# Check current version
node --version

# If wrong version or not found, install Node.js 18+
# Option 1: Download from nodejs.org
# Option 2: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### npm Installation Issues
**Problem**: npm install fails or takes too long
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall with verbose output
npm install --verbose

# If still failing, try yarn instead
npm install -g yarn
yarn install
```

#### Environment Variables Not Loading
**Problem**: Configuration tests fail, API calls don't work
```bash
# Check if .env file exists
ls -la .env

# If not, copy from template
cp .env.example .env

# Edit .env file with actual credentials
nano .env  # or use your preferred editor

# Verify environment variables are loaded
npm test -- src/config/__tests__/config.test.ts
```

### React Native Issues

#### Metro Bundler Problems
**Problem**: Metro bundler won't start or crashes
```bash
# Clear Metro cache
npx react-native start --reset-cache

# If that doesn't work, clear all caches
rm -rf node_modules
npm cache clean --force
npm install
npx react-native start --reset-cache
```

#### iOS Simulator Issues
**Problem**: iOS app won't build or simulator crashes
```bash
# Reset iOS simulator
xcrun simctl erase all

# Clean iOS build
cd ios
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData
cd ..

# Reinstall iOS dependencies (if using React Native CLI)
cd ios && pod install && cd ..

# Try running again
npm run ios
```

#### Android Emulator Issues
**Problem**: Android app won't build or emulator won't start
```bash
# List available emulators
emulator -list-avds

# Start emulator manually
emulator -avd Pixel_8_API_33

# Clean Android build
cd android
./gradlew clean
cd ..

# Try running again
npm run android
```

### Testing Issues

#### Tests Failing
**Problem**: npm test fails with various errors
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- src/config/__tests__/config.test.ts

# Run tests without coverage (faster)
npm test -- --no-coverage

# Clear Jest cache
npx jest --clearCache
npm test
```

#### TypeScript Compilation Errors
**Problem**: TypeScript errors prevent running tests
```bash
# Check TypeScript compilation
npx tsc --noEmit

# If errors, fix them or temporarily skip type checking
npm test -- --no-type-check

# Update TypeScript if needed
npm install typescript@latest --save-dev
```

### API and Database Issues

#### MongoDB Connection Problems
**Problem**: Database tests fail, can't connect to MongoDB Atlas
```bash
# Check environment variables
echo $MONGODB_URI

# Test connection with a simple script
node -e "console.log(process.env.MONGODB_URI)"

# Verify network connectivity
ping cluster.mongodb.net

# Check MongoDB Atlas dashboard for connection issues
```

#### OpenAI API Issues
**Problem**: AI service tests fail, API calls return errors
```bash
# Check API key format
echo $OPENAI_API_KEY | head -c 20

# Test API key with curl
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Check usage limits in OpenAI dashboard
```

#### Rate Limiting Issues
**Problem**: API calls fail with rate limit errors
```bash
# Check current usage in API dashboards
# Implement exponential backoff in code
# Use fallback APIs (Anthropic for OpenAI)
# Reduce test frequency during development
```

### Platform-Specific Issues

#### macOS/iOS Development
**Problem**: Xcode or iOS development issues
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Accept Xcode license
sudo xcodebuild -license accept

# Check iOS simulator installation
xcrun simctl list devices

# Reset iOS simulator if needed
xcrun simctl erase all
```

#### Windows/Android Development
**Problem**: Android development on Windows
```bash
# Check Java installation
java -version

# Set JAVA_HOME environment variable
set JAVA_HOME=C:\Program Files\Java\jdk-11.0.x

# Check Android SDK installation
echo %ANDROID_HOME%

# Start Android emulator
%ANDROID_HOME%\emulator\emulator -avd Pixel_8_API_33
```

#### Linux Development
**Problem**: React Native setup on Linux
```bash
# Install required dependencies
sudo apt-get update
sudo apt-get install nodejs npm openjdk-11-jdk

# Set up Android development
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 🔍 Diagnostic Commands

### Environment Diagnostics
```bash
# Check all versions
node --version
npm --version
git --version
npx react-native --version

# Check environment variables
env | grep -E "(MONGODB|OPENAI|ANTHROPIC)"

# Check project structure
find src -name "*.ts" -o -name "*.tsx" | head -10

# Run validation script
node scripts/validate-setup.js
```

### Build Diagnostics
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Check linting
npm run lint

# Check test coverage
npm run test:coverage

# Check bundle size (if applicable)
npm run build
```

### Runtime Diagnostics
```bash
# Check Metro bundler logs
npx react-native start --verbose

# Check device logs (iOS)
xcrun simctl spawn booted log stream --predicate 'process == "SMARTIES"'

# Check device logs (Android)
adb logcat | grep -i smarties
```

## 🆘 Getting Help

### Self-Help Checklist
1. **Read error messages carefully** - they often contain the solution
2. **Check this troubleshooting guide** - common issues are documented here
3. **Search Slack history** - someone may have had the same issue
4. **Try the validation script** - `node scripts/validate-setup.js`
5. **Check official documentation** - React Native, MongoDB, OpenAI docs

### When to Ask for Help
- After trying self-help for 15+ minutes
- When error messages are unclear or confusing
- When you suspect it's an environment/setup issue
- When you need clarification on project architecture

### How to Ask for Help Effectively

#### In Slack (#smarties-dev)
```
🚨 Issue: [Brief description]
💻 Platform: [iOS/Android/Both]
🔧 What I tried: [List steps you've taken]
📋 Error message: [Copy/paste exact error]
🎯 Expected: [What should happen]
📱 Environment: [Node version, OS, etc.]
```

#### Example Good Help Request
```
🚨 Issue: npm test fails with "Cannot find module 'zod'"
💻 Platform: macOS
🔧 What I tried: 
- npm install
- rm -rf node_modules && npm install
- npm cache clean --force
📋 Error message: 
Error: Cannot find module 'zod'
    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:636:15)
🎯 Expected: Tests should run successfully
📱 Environment: Node 18.17.0, npm 9.6.7, macOS 13.4
```

### Escalation Path
1. **Slack #smarties-dev** - Team members and peer help
2. **Technical Lead** - Complex technical issues
3. **Hackathon Organizers** - Infrastructure or event-related issues

## 📚 Additional Resources

### Official Documentation
- **React Native**: https://reactnative.dev/docs/getting-started
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **OpenAI API**: https://platform.openai.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs/

### Community Resources
- **React Native Community**: https://github.com/react-native-community
- **Stack Overflow**: Search for specific error messages
- **GitHub Issues**: Check React Native and dependency repositories

### Internal Resources
- **Project README**: [../README.md](../README.md)
- **Setup Guide**: [../HACKATHON_SETUP.md](../HACKATHON_SETUP.md)
- **Team Onboarding**: [./TEAM_ONBOARDING.md](./TEAM_ONBOARDING.md)
- **Shared Resources**: [./SHARED_RESOURCES.md](./SHARED_RESOURCES.md)

## 🔄 Known Issues and Workarounds

### Issue: Metro bundler port conflict
**Symptoms**: "Port 8081 already in use"
**Workaround**: 
```bash
# Kill existing Metro process
npx react-native start --port 8082
# or
lsof -ti:8081 | xargs kill -9
```

### Issue: iOS simulator keyboard not showing
**Symptoms**: Can't type in text inputs on iOS simulator
**Workaround**: 
- Hardware → Keyboard → Connect Hardware Keyboard (uncheck)
- Or press Cmd+Shift+K in simulator

### Issue: Android emulator slow performance
**Symptoms**: Android emulator runs very slowly
**Workaround**:
- Enable hardware acceleration in BIOS
- Increase emulator RAM allocation
- Use x86_64 system images instead of ARM

### Issue: Jest tests timeout
**Symptoms**: Tests fail with timeout errors
**Workaround**:
```bash
# Increase Jest timeout
npm test -- --testTimeout=30000

# Or run tests serially
npm test -- --runInBand
```

## 📞 Emergency Contacts

### During Hackathon Hours
- **Technical Lead**: [Name] - [Phone] - @handle
- **Team Lead**: [Name] - [Phone] - @handle
- **Hackathon Organizer**: [Name] - [Phone]

### After Hours
- **Slack #smarties-dev**: Post your issue, team members may help
- **Email**: [technical-lead@email.com]

---

**Remember**: Most issues have been encountered before. Don't hesitate to ask for help - we're all here to make the hackathon successful! 🚀
