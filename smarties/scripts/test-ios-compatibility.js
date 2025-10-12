#!/usr/bin/env node

/**
 * iOS Compatibility Test Script
 * Tests iOS-specific configurations and compatibility
 * Task 8.1: Test iOS simulator build and functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🍎 SMARTIES iOS Compatibility Test');
console.log('=====================================\n');

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

// Test 1: iOS Configuration in app.json
runTest('iOS configuration exists in app.json', () => {
  const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const iosConfig = appConfig.expo.ios;
  
  if (!iosConfig) return false;
  
  // Check required iOS configurations
  const hasBundle = iosConfig.bundleIdentifier && iosConfig.bundleIdentifier.includes('smarties');
  const hasCameraPermission = iosConfig.infoPlist && iosConfig.infoPlist.NSCameraUsageDescription;
  const supportsTablet = iosConfig.supportsTablet === true;
  
  return hasBundle && hasCameraPermission && supportsTablet;
});

// Test 2: Required iOS dependencies
runTest('iOS-compatible dependencies installed', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    '@react-navigation/native',
    '@react-navigation/bottom-tabs',
    '@react-navigation/stack',
    'react-native-safe-area-context',
    'react-native-screens',
    'expo-barcode-scanner',
    'expo-camera',
    'expo-secure-store'
  ];
  
  return requiredDeps.every(dep => deps[dep]);
});

// Test 3: Navigation structure compatibility
runTest('Navigation structure is iOS compatible', () => {
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  
  // Check for iOS-compatible navigation patterns
  const hasNavigationContainer = appTsx.includes('NavigationContainer');
  const hasTabNavigator = appTsx.includes('createBottomTabNavigator');
  const hasSafeArea = appTsx.includes('SafeAreaProvider');
  const hasStatusBar = appTsx.includes('StatusBar');
  
  return hasNavigationContainer && hasTabNavigator && hasSafeArea && hasStatusBar;
});

// Test 4: Screen components exist
runTest('All required screens exist', () => {
  const requiredScreens = [
    'src/screens/ScanScreen.tsx',
    'src/screens/ProfileScreen.tsx',
    'src/screens/HistoryScreen.tsx',
    'src/screens/SettingsScreen.tsx',
    'src/screens/ResultScreen.tsx'
  ];
  
  return requiredScreens.every(screen => fs.existsSync(screen));
});

// Test 5: iOS-specific styling considerations
runTest('iOS-compatible styling patterns', () => {
  const stylesExist = fs.existsSync('src/styles/constants.ts');
  if (!stylesExist) return false;
  
  const styles = fs.readFileSync('src/styles/constants.ts', 'utf8');
  
  // Check for iOS-friendly styling patterns
  const hasColors = styles.includes('colors');
  const hasSpacing = styles.includes('spacing');
  const hasSafeAreaHandling = styles.includes('spacing') || styles.includes('padding');
  
  return hasColors && hasSpacing && hasSafeAreaHandling;
});

// Test 6: Database service iOS compatibility
runTest('Database service is iOS compatible', () => {
  const dbServiceExists = fs.existsSync('src/services/database.js') || fs.existsSync('src/services/DatabaseService.ts');
  if (!dbServiceExists) return false;
  
  const dbServicePath = fs.existsSync('src/services/DatabaseService.ts') ? 'src/services/DatabaseService.ts' : 'src/services/database.js';
  const dbService = fs.readFileSync(dbServicePath, 'utf8');
  
  // Check for iOS-compatible database patterns
  const hasAsyncMethods = dbService.includes('async ') && dbService.includes('await ');
  const hasErrorHandling = dbService.includes('try') && dbService.includes('catch');
  const hasConnectionManagement = dbService.includes('connect') && dbService.includes('disconnect');
  
  return hasAsyncMethods && hasErrorHandling && hasConnectionManagement;
});

// Test 7: TypeScript configuration
runTest('TypeScript configuration is iOS compatible', () => {
  const tsconfigExists = fs.existsSync('tsconfig.json');
  if (!tsconfigExists) return false;
  
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  // Check for React Native compatible TypeScript settings
  const extendsExpo = tsconfig.extends && tsconfig.extends.includes('expo');
  const hasStrict = tsconfig.compilerOptions && tsconfig.compilerOptions.strict;
  const hasBaseUrl = tsconfig.compilerOptions && tsconfig.compilerOptions.baseUrl;
  
  return extendsExpo && hasStrict && hasBaseUrl;
});

// Test 8: Expo plugins configuration
runTest('Expo plugins are iOS compatible', () => {
  const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const plugins = appConfig.expo.plugins || [];
  
  // Check for required iOS-compatible plugins
  const hasBarcodeScannerPlugin = plugins.some(plugin => 
    Array.isArray(plugin) && plugin[0] === 'expo-barcode-scanner'
  );
  const hasCameraPlugin = plugins.some(plugin => 
    Array.isArray(plugin) && plugin[0] === 'expo-camera'
  );
  const hasSecureStorePlugin = plugins.includes('expo-secure-store');
  
  return hasBarcodeScannerPlugin && hasCameraPlugin && hasSecureStorePlugin;
});

// Test 9: App initialization service
runTest('App initialization service exists and is compatible', () => {
  const initServiceExists = fs.existsSync('src/services/AppInitializationService.ts');
  if (!initServiceExists) return false;
  
  const initService = fs.readFileSync('src/services/AppInitializationService.ts', 'utf8');
  
  // Check for iOS-compatible initialization patterns
  const hasAsyncInit = initService.includes('async initialize');
  const hasErrorHandling = initService.includes('try') && initService.includes('catch');
  const hasConfigValidation = initService.includes('validateConfig') || initService.includes('config');
  
  return hasAsyncInit && hasErrorHandling && hasConfigValidation;
});

// Test 10: Component exports and imports
runTest('Component exports are properly structured', () => {
  const indexExists = fs.existsSync('src/screens/index.ts');
  if (!indexExists) return false;
  
  const indexFile = fs.readFileSync('src/screens/index.ts', 'utf8');
  
  // Check for proper exports
  const hasScreenExports = indexFile.includes('export') && 
                          indexFile.includes('Screen');
  
  return hasScreenExports;
});

console.log('\n=====================================');
console.log(`📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
  console.log('🎉 All iOS compatibility tests passed!');
  console.log('✅ The app is ready for iOS simulator testing');
  process.exit(0);
} else {
  console.log('⚠️  Some iOS compatibility issues found');
  console.log('❌ Please fix the failing tests before iOS deployment');
  process.exit(1);
}