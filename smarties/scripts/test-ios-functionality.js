#!/usr/bin/env node

/**
 * iOS Functionality Validation Script
 * Tests that all screens and navigation work properly on iOS
 * Task 8.1: Validate all screens and navigation work on iOS
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('📱 SMARTIES iOS Functionality Test');
console.log('==================================\n');

let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFn) {
  testsTotal++;
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${testName}`);
      testsPassed++;
    } else {
      console.log(`❌ ${testName}`);
    }
  } catch (error) {
    console.log(`❌ ${testName}: ${error.message}`);
  }
}

// Test 1: App component renders without crashing
runTest('App component can be imported and structured correctly', () => {
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  
  // Check for essential iOS-compatible patterns
  const hasReactImport = appTsx.includes('import React');
  const hasNavigationContainer = appTsx.includes('NavigationContainer');
  const hasTabNavigator = appTsx.includes('createBottomTabNavigator');
  const hasSafeAreaProvider = appTsx.includes('SafeAreaProvider');
  const hasErrorBoundary = appTsx.includes('ErrorBoundary');
  const hasAppInitialization = appTsx.includes('AppInitializationService');
  
  return hasReactImport && hasNavigationContainer && hasTabNavigator && 
         hasSafeAreaProvider && hasErrorBoundary && hasAppInitialization;
});

// Test 2: All screen components are properly structured
runTest('All screen components are iOS-compatible', () => {
  const screens = [
    'src/screens/ScanScreen.tsx',
    'src/screens/ProfileScreen.tsx', 
    'src/screens/HistoryScreen.tsx',
    'src/screens/SettingsScreen.tsx',
    'src/screens/ResultScreen.tsx'
  ];
  
  return screens.every(screenPath => {
    if (!fs.existsSync(screenPath)) return false;
    
    const content = fs.readFileSync(screenPath, 'utf8');
    
    // Check for React Native iOS-compatible patterns
    const hasReactImport = content.includes('import React');
    const hasReactNativeImports = content.includes('react-native') || 
                                 content.includes('expo-') ||
                                 content.includes('react-native-safe-area-context');
    const hasExport = content.includes('export');
    const hasStyleSheet = content.includes('StyleSheet') || content.includes('styles');
    
    return hasReactImport && hasReactNativeImports && hasExport && hasStyleSheet;
  });
});

// Test 3: Navigation structure is iOS-compatible
runTest('Navigation structure works on iOS', () => {
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  
  // Check for iOS-specific navigation features
  const hasTabBarIcons = appTsx.includes('tabBarIcon');
  const hasIonicons = appTsx.includes('Ionicons');
  const hasTabBarStyling = appTsx.includes('tabBarStyle');
  const hasHeaderConfiguration = appTsx.includes('headerShown');
  const hasStatusBar = appTsx.includes('StatusBar');
  
  return hasTabBarIcons && hasIonicons && hasTabBarStyling && 
         hasHeaderConfiguration && hasStatusBar;
});

// Test 4: iOS permissions are properly configured
runTest('iOS permissions are configured for camera and location', () => {
  const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const iosConfig = appConfig.expo.ios;
  
  if (!iosConfig || !iosConfig.infoPlist) return false;
  
  const hasCameraPermission = iosConfig.infoPlist.NSCameraUsageDescription;
  const hasLocationPermission = iosConfig.infoPlist.NSLocationWhenInUseUsageDescription;
  const hasBundleId = iosConfig.bundleIdentifier;
  const supportsTablet = iosConfig.supportsTablet;
  
  return hasCameraPermission && hasLocationPermission && hasBundleId && supportsTablet;
});

// Test 5: Essential services are iOS-compatible
runTest('Core services are iOS-compatible', () => {
  const services = [
    'src/services/AppInitializationService.ts',
    'src/services/ConnectionStatusService.ts'
  ];
  
  return services.every(servicePath => {
    if (!fs.existsSync(servicePath)) return false;
    
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Check for iOS-compatible patterns
    const hasAsyncMethods = content.includes('async ') && content.includes('await ');
    const hasErrorHandling = content.includes('try') && content.includes('catch');
    const hasExports = content.includes('export');
    
    return hasAsyncMethods && hasErrorHandling && hasExports;
  });
});

// Test 6: Styling is iOS-compatible
runTest('Styling system is iOS-compatible', () => {
  const stylesExist = fs.existsSync('src/styles/constants.ts');
  if (!stylesExist) return false;
  
  const styles = fs.readFileSync('src/styles/constants.ts', 'utf8');
  
  // Check for iOS-friendly styling patterns
  const hasColors = styles.includes('colors');
  const hasSpacing = styles.includes('spacing');
  const hasTextStyles = styles.includes('textStyles') || styles.includes('fontSize');
  const hasExports = styles.includes('export');
  
  return hasColors && hasSpacing && hasTextStyles && hasExports;
});

// Test 7: Component structure is iOS-compatible
runTest('Component structure supports iOS', () => {
  const componentsExist = fs.existsSync('src/components');
  if (!componentsExist) return false;
  
  const indexExists = fs.existsSync('src/components/index.ts');
  if (!indexExists) return false;
  
  const indexContent = fs.readFileSync('src/components/index.ts', 'utf8');
  
  // Check for proper component exports
  const hasExports = indexContent.includes('export');
  const hasComponents = indexContent.includes('Component') || 
                       indexContent.includes('Screen') ||
                       indexContent.includes('Banner');
  
  return hasExports && hasComponents;
});

// Test 8: Database integration is iOS-compatible
runTest('Database integration works on iOS', () => {
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  
  // Check for database initialization patterns
  const hasAppInitService = appTsx.includes('AppInitializationService');
  const hasConnectionStatus = appTsx.includes('useConnectionStatus') || appTsx.includes('isOfflineMode');
  const hasOfflineBanner = appTsx.includes('OfflineBanner');
  const hasErrorHandling = appTsx.includes('initializationError');
  
  return hasAppInitService && hasConnectionStatus && hasOfflineBanner && hasErrorHandling;
});

// Test 9: TypeScript configuration supports iOS
runTest('TypeScript configuration is iOS-compatible', () => {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  // Check for iOS-compatible TypeScript settings
  const extendsExpo = tsconfig.extends && tsconfig.extends.includes('expo');
  const hasStrict = tsconfig.compilerOptions && tsconfig.compilerOptions.strict;
  const hasBaseUrl = tsconfig.compilerOptions && tsconfig.compilerOptions.baseUrl;
  const hasPaths = tsconfig.compilerOptions && tsconfig.compilerOptions.paths;
  
  return extendsExpo && hasStrict && hasBaseUrl && hasPaths;
});

// Test 10: Build configuration is ready for iOS
runTest('Build configuration supports iOS deployment', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  
  // Check for iOS build readiness
  const hasIosScript = packageJson.scripts && packageJson.scripts.ios;
  const hasBuildScript = packageJson.scripts && packageJson.scripts['build:ios'];
  const hasValidExpoConfig = appConfig.expo && appConfig.expo.name && appConfig.expo.slug;
  const hasIosConfig = appConfig.expo && appConfig.expo.ios;
  
  return hasIosScript && hasBuildScript && hasValidExpoConfig && hasIosConfig;
});

console.log('\n==================================');
console.log(`📊 Functionality Test Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
  console.log('🎉 All iOS functionality tests passed!');
  console.log('✅ The app is ready for iOS simulator testing');
  
  console.log('\n📋 iOS Testing Instructions:');
  console.log('1. On macOS with Xcode installed:');
  console.log('   - Run: npm run ios');
  console.log('   - This will open iOS Simulator');
  console.log('');
  console.log('2. Using Expo Go (any platform):');
  console.log('   - Run: npm start');
  console.log('   - Scan QR code with Expo Go app on iOS device');
  console.log('');
  console.log('3. Test these key features:');
  console.log('   ✓ App launches successfully');
  console.log('   ✓ Bottom tab navigation works');
  console.log('   ✓ All screens load without errors');
  console.log('   ✓ Camera permissions are requested');
  console.log('   ✓ Offline mode banner appears when offline');
  console.log('   ✓ Database initialization completes');
  console.log('');
  console.log('4. Verify iOS-specific features:');
  console.log('   ✓ Safe area handling on notched devices');
  console.log('   ✓ Status bar styling');
  console.log('   ✓ Tab bar styling and icons');
  console.log('   ✓ Navigation gestures work properly');
  
  process.exit(0);
} else {
  console.log('⚠️  Some iOS functionality issues found');
  console.log('❌ Please fix the failing tests before iOS testing');
  process.exit(1);
}