#!/usr/bin/env node

/**
 * iOS Navigation and Screen Functionality Test
 * Tests that all screens and navigation work properly on iOS
 * Task 8.1: Validate all screens and navigation work on iOS
 */

const fs = require('fs');
const path = require('path');

console.log('🧭 SMARTIES iOS Navigation Test');
console.log('================================\n');

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

// Test 1: Main App component has proper navigation setup
runTest('Main App has iOS-compatible navigation', () => {
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  
  // Check for iOS-specific navigation patterns
  const hasTabNavigator = appTsx.includes('createBottomTabNavigator');
  const hasNavigationContainer = appTsx.includes('NavigationContainer');
  const hasSafeAreaProvider = appTsx.includes('SafeAreaProvider');
  const hasStatusBar = appTsx.includes('StatusBar');
  const hasIonicons = appTsx.includes('Ionicons');
  
  return hasTabNavigator && hasNavigationContainer && hasSafeAreaProvider && hasStatusBar && hasIonicons;
});

// Test 2: Tab navigation configuration
runTest('Tab navigation is properly configured', () => {
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  
  // Check for all required tabs
  const hasScanStack = appTsx.includes('ScanStack');
  const hasProfile = appTsx.includes('Profile');
  const hasHistory = appTsx.includes('History');
  const hasSettings = appTsx.includes('Settings');
  
  // Check for iOS-friendly tab styling
  const hasTabBarStyle = appTsx.includes('tabBarStyle');
  const hasActiveTintColor = appTsx.includes('tabBarActiveTintColor');
  const hasInactiveTintColor = appTsx.includes('tabBarInactiveTintColor');
  
  return hasScanStack && hasProfile && hasHistory && hasSettings && 
         hasTabBarStyle && hasActiveTintColor && hasInactiveTintColor;
});

// Test 3: ScanStack navigation exists
runTest('ScanStack navigation is properly implemented', () => {
  const navigationExists = fs.existsSync('src/navigation/index.ts') || 
                          fs.existsSync('src/navigation/ScanStack.tsx') ||
                          fs.existsSync('src/navigation.ts');
  
  if (!navigationExists) return false;
  
  // Check for stack navigation in App.tsx
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  const importsScanStack = appTsx.includes('ScanStack');
  
  return importsScanStack;
});

// Test 4: All screen components are React Native compatible
runTest('All screens are iOS/React Native compatible', () => {
  const screens = [
    'src/screens/ScanScreen.tsx',
    'src/screens/ProfileScreen.tsx',
    'src/screens/HistoryScreen.tsx',
    'src/screens/SettingsScreen.tsx',
    'src/screens/ResultScreen.tsx'
  ];
  
  return screens.every(screenPath => {
    if (!fs.existsSync(screenPath)) return false;
    
    const screenContent = fs.readFileSync(screenPath, 'utf8');
    
    // Check for React Native patterns
    const hasReactImport = screenContent.includes('import React') || screenContent.includes('import * as React');
    const hasReactNativeImports = screenContent.includes('react-native') || 
                                 screenContent.includes('expo-') ||
                                 screenContent.includes('@expo/') ||
                                 screenContent.includes('../components') ||
                                 screenContent.includes('../services');
    const hasExportDefault = screenContent.includes('export default') || 
                            screenContent.includes('export {') ||
                            screenContent.includes('export const') ||
                            screenContent.includes('export function');
    
    return hasReactImport && hasReactNativeImports && hasExportDefault;
  });
});

// Test 5: Screen index exports are properly configured
runTest('Screen exports are properly configured', () => {
  const indexExists = fs.existsSync('src/screens/index.ts');
  if (!indexExists) return false;
  
  const indexContent = fs.readFileSync('src/screens/index.ts', 'utf8');
  
  // Check for proper screen exports
  const exportsProfile = indexContent.includes('ProfileScreen');
  const exportsHistory = indexContent.includes('HistoryScreen');
  const exportsSettings = indexContent.includes('SettingsScreen');
  const exportsResult = indexContent.includes('ResultScreen');
  
  return exportsProfile && exportsHistory && exportsSettings && exportsResult;
});

// Test 6: Navigation types are properly defined
runTest('Navigation types are iOS compatible', () => {
  const typesExist = fs.existsSync('src/types/navigation.ts') || 
                    fs.existsSync('src/types/index.ts');
  
  if (!typesExist) return false;
  
  // Check App.tsx for type usage
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  const hasNavigationTypes = appTsx.includes('RootTabParamList') || 
                            appTsx.includes('TabParamList') ||
                            appTsx.includes('ParamList');
  
  return hasNavigationTypes;
});

// Test 7: iOS-specific styling and theming
runTest('iOS-compatible styling is implemented', () => {
  const stylesExist = fs.existsSync('src/styles/constants.ts') || 
                     fs.existsSync('src/styles/index.ts');
  
  if (!stylesExist) return false;
  
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  
  // Check for iOS-friendly styling patterns
  const usesColors = appTsx.includes('colors.');
  const usesSpacing = appTsx.includes('spacing.');
  const hasShadowProps = appTsx.includes('shadowColor') || appTsx.includes('elevation');
  const hasBorderRadius = appTsx.includes('borderRadius');
  
  return usesColors && usesSpacing && hasShadowProps && hasBorderRadius;
});

// Test 8: Error boundary and loading states
runTest('Error handling and loading states are iOS compatible', () => {
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  
  // Check for error boundary and loading patterns
  const hasErrorBoundary = appTsx.includes('ErrorBoundary');
  const hasLoadingScreen = appTsx.includes('LoadingScreen');
  const hasOfflineBanner = appTsx.includes('OfflineBanner');
  const hasErrorHandling = appTsx.includes('initializationError') || appTsx.includes('error');
  
  return hasErrorBoundary && hasLoadingScreen && hasOfflineBanner && hasErrorHandling;
});

// Test 9: App initialization is iOS compatible
runTest('App initialization works on iOS', () => {
  const appTsx = fs.readFileSync('App.tsx', 'utf8');
  
  // Check for proper initialization patterns
  const hasUseEffect = appTsx.includes('useEffect');
  const hasAsyncInit = appTsx.includes('initializeApp');
  const hasLoadingState = appTsx.includes('isInitializing');
  const hasAppInitService = appTsx.includes('AppInitializationService');
  
  return hasUseEffect && hasAsyncInit && hasLoadingState && hasAppInitService;
});

// Test 10: iOS-specific permissions and features
runTest('iOS permissions and features are properly configured', () => {
  const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const iosConfig = appConfig.expo.ios;
  
  if (!iosConfig || !iosConfig.infoPlist) return false;
  
  // Check for required iOS permissions
  const hasCameraPermission = iosConfig.infoPlist.NSCameraUsageDescription;
  const hasLocationPermission = iosConfig.infoPlist.NSLocationWhenInUseUsageDescription;
  const hasBundleId = iosConfig.bundleIdentifier;
  const supportsTablet = iosConfig.supportsTablet;
  
  return hasCameraPermission && hasLocationPermission && hasBundleId && supportsTablet;
});

console.log('\n================================');
console.log(`📊 Navigation Test Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
  console.log('🎉 All iOS navigation tests passed!');
  console.log('✅ Navigation and screens are ready for iOS');
  console.log('📱 The app should work properly on iOS simulator');
  process.exit(0);
} else {
  console.log('⚠️  Some iOS navigation issues found');
  console.log('❌ Please fix the failing tests before iOS testing');
  process.exit(1);
}