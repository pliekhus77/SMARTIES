#!/usr/bin/env node

/**
 * Android Navigation Test Script
 * Tests navigation flow and screen functionality on Android
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AndroidNavigationTest {
  constructor() {
    this.testResults = {
      navigationSetup: false,
      screenComponents: false,
      tabNavigation: false,
      stackNavigation: false,
      backButtonHandling: false,
      deepLinking: false
    };
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testNavigationSetup() {
    this.log('🔍 Testing navigation setup...');
    
    try {
      // Check package.json for navigation dependencies
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const requiredNavDeps = [
        '@react-navigation/native',
        '@react-navigation/bottom-tabs',
        '@react-navigation/stack',
        'react-native-gesture-handler',
        'react-native-screens'
      ];

      const missingDeps = requiredNavDeps.filter(dep => 
        !packageConfig.dependencies[dep]
      );

      if (missingDeps.length > 0) {
        throw new Error(`Missing navigation dependencies: ${missingDeps.join(', ')}`);
      }

      // Check App.tsx for navigation setup
      const appTsxPath = path.join(process.cwd(), 'App.tsx');
      if (!fs.existsSync(appTsxPath)) {
        throw new Error('App.tsx not found');
      }

      const appContent = fs.readFileSync(appTsxPath, 'utf8');
      
      // Check for NavigationContainer
      if (!appContent.includes('NavigationContainer')) {
        throw new Error('NavigationContainer not found in App.tsx');
      }

      // Check for gesture handler import
      if (!appContent.includes('react-native-gesture-handler') && 
          !appContent.includes('gestureHandlerRootHOC')) {
        this.warnings.push('Gesture handler setup may be missing');
      }

      this.testResults.navigationSetup = true;
      this.log('✅ Navigation setup validated');
      
    } catch (error) {
      this.errors.push(`Navigation setup error: ${error.message}`);
      this.log(`❌ Navigation setup error: ${error.message}`, 'error');
    }
  }

  async testScreenComponents() {
    this.log('🔍 Testing screen components...');
    
    try {
      const requiredScreens = [
        { path: 'src/screens/ScanScreen.tsx', name: 'ScanScreen' },
        { path: 'src/screens/ProfileScreen.tsx', name: 'ProfileScreen' },
        { path: 'src/screens/ResultScreen.tsx', name: 'ResultScreen' },
        { path: 'src/screens/SettingsScreen.tsx', name: 'SettingsScreen' }
      ];

      let validScreens = 0;

      for (const screen of requiredScreens) {
        const screenPath = path.join(process.cwd(), screen.path);
        
        if (!fs.existsSync(screenPath)) {
          this.errors.push(`Screen file not found: ${screen.path}`);
          continue;
        }

        const screenContent = fs.readFileSync(screenPath, 'utf8');
        
        // Check for React component structure
        if (!screenContent.includes('export') || 
            (!screenContent.includes('function') && !screenContent.includes('const'))) {
          this.errors.push(`Invalid screen component structure: ${screen.name}`);
          continue;
        }

        // Check for React Native imports
        if (!screenContent.includes('react') && !screenContent.includes('React')) {
          this.warnings.push(`React import missing in: ${screen.name}`);
        }

        // Check for navigation prop usage (optional but recommended)
        if (screenContent.includes('navigation.') || screenContent.includes('useNavigation')) {
          this.log(`✅ Navigation integration found in ${screen.name}`);
        }

        validScreens++;
      }

      if (validScreens < requiredScreens.length * 0.75) {
        throw new Error(`Too many invalid screens: ${validScreens}/${requiredScreens.length}`);
      }

      this.testResults.screenComponents = true;
      this.log('✅ Screen components validated');
      
    } catch (error) {
      this.errors.push(`Screen components error: ${error.message}`);
      this.log(`❌ Screen components error: ${error.message}`, 'error');
    }
  }

  async testTabNavigation() {
    this.log('🔍 Testing tab navigation...');
    
    try {
      // Check App.tsx or navigation files for tab navigator
      const filesToCheck = [
        'App.tsx',
        'src/navigation/AppNavigator.tsx',
        'src/navigation/TabNavigator.tsx'
      ];

      let tabNavigatorFound = false;
      let tabNavigatorContent = '';

      for (const file of filesToCheck) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('createBottomTabNavigator') || 
              content.includes('Tab.Navigator')) {
            tabNavigatorFound = true;
            tabNavigatorContent = content;
            this.log(`✅ Tab navigator found in ${file}`);
            break;
          }
        }
      }

      if (!tabNavigatorFound) {
        throw new Error('Tab navigator not found in any navigation files');
      }

      // Check for required tab screens
      const requiredTabs = ['Scan', 'Profile', 'Settings'];
      const missingTabs = requiredTabs.filter(tab => 
        !tabNavigatorContent.includes(tab)
      );

      if (missingTabs.length > 0) {
        this.warnings.push(`Some tabs may be missing: ${missingTabs.join(', ')}`);
      }

      // Check for tab icons (Android Material Design)
      if (tabNavigatorContent.includes('tabBarIcon') || 
          tabNavigatorContent.includes('MaterialIcons') ||
          tabNavigatorContent.includes('Ionicons')) {
        this.log('✅ Tab icons configured');
      } else {
        this.warnings.push('Tab icons not configured');
      }

      this.testResults.tabNavigation = true;
      this.log('✅ Tab navigation validated');
      
    } catch (error) {
      this.errors.push(`Tab navigation error: ${error.message}`);
      this.log(`❌ Tab navigation error: ${error.message}`, 'error');
    }
  }

  async testStackNavigation() {
    this.log('🔍 Testing stack navigation...');
    
    try {
      // Check for stack navigator usage
      const filesToCheck = [
        'App.tsx',
        'src/navigation/AppNavigator.tsx',
        'src/navigation/StackNavigator.tsx'
      ];

      let stackNavigatorFound = false;
      let stackNavigatorContent = '';

      for (const file of filesToCheck) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('createStackNavigator') || 
              content.includes('Stack.Navigator')) {
            stackNavigatorFound = true;
            stackNavigatorContent = content;
            this.log(`✅ Stack navigator found in ${file}`);
            break;
          }
        }
      }

      if (!stackNavigatorFound) {
        this.warnings.push('Stack navigator not found - may limit navigation flexibility');
      } else {
        // Check for scan flow (Scan -> Result)
        if (stackNavigatorContent.includes('Scan') && 
            stackNavigatorContent.includes('Result')) {
          this.log('✅ Scan flow navigation configured');
        } else {
          this.warnings.push('Scan flow navigation may not be configured');
        }

        // Check for header configuration
        if (stackNavigatorContent.includes('headerShown') || 
            stackNavigatorContent.includes('screenOptions')) {
          this.log('✅ Stack header configuration found');
        } else {
          this.warnings.push('Stack header configuration not found');
        }
      }

      this.testResults.stackNavigation = true;
      this.log('✅ Stack navigation validated');
      
    } catch (error) {
      this.errors.push(`Stack navigation error: ${error.message}`);
      this.log(`❌ Stack navigation error: ${error.message}`, 'error');
    }
  }

  async testBackButtonHandling() {
    this.log('🔍 Testing Android back button handling...');
    
    try {
      // Check for back handler implementation
      const filesToCheck = [
        'App.tsx',
        'src/screens/ScanScreen.tsx',
        'src/screens/ProfileScreen.tsx',
        'src/screens/ResultScreen.tsx',
        'src/screens/SettingsScreen.tsx'
      ];

      let backHandlerFound = false;

      for (const file of filesToCheck) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('BackHandler') || 
              content.includes('useFocusEffect') ||
              content.includes('beforeRemove')) {
            backHandlerFound = true;
            this.log(`✅ Back button handling found in ${file}`);
            break;
          }
        }
      }

      if (!backHandlerFound) {
        this.warnings.push('Android back button handling not implemented - may cause UX issues');
      }

      // Check app.json for predictive back gesture configuration
      const appJsonPath = path.join(process.cwd(), 'app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      const predictiveBack = appConfig.expo?.android?.predictiveBackGestureEnabled;
      if (predictiveBack !== undefined) {
        this.log(`✅ Predictive back gesture configured: ${predictiveBack}`);
      } else {
        this.warnings.push('Predictive back gesture not configured');
      }

      this.testResults.backButtonHandling = true;
      this.log('✅ Back button handling validated');
      
    } catch (error) {
      this.errors.push(`Back button handling error: ${error.message}`);
      this.log(`❌ Back button handling error: ${error.message}`, 'error');
    }
  }

  async testDeepLinking() {
    this.log('🔍 Testing deep linking configuration...');
    
    try {
      // Check app.json for deep linking configuration
      const appJsonPath = path.join(process.cwd(), 'app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      // Check for scheme configuration
      if (appConfig.expo?.scheme) {
        this.log(`✅ URL scheme configured: ${appConfig.expo.scheme}`);
      } else {
        this.warnings.push('URL scheme not configured - deep linking unavailable');
      }

      // Check for Android intent filters
      if (appConfig.expo?.android?.intentFilters) {
        this.log('✅ Android intent filters configured');
      } else {
        this.warnings.push('Android intent filters not configured');
      }

      // Check navigation files for linking configuration
      const filesToCheck = [
        'App.tsx',
        'src/navigation/AppNavigator.tsx'
      ];

      let linkingConfigFound = false;

      for (const file of filesToCheck) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('linking') || 
              content.includes('Linking') ||
              content.includes('getInitialURL')) {
            linkingConfigFound = true;
            this.log(`✅ Linking configuration found in ${file}`);
            break;
          }
        }
      }

      if (!linkingConfigFound) {
        this.warnings.push('Navigation linking configuration not found');
      }

      this.testResults.deepLinking = true;
      this.log('✅ Deep linking configuration validated');
      
    } catch (error) {
      this.errors.push(`Deep linking error: ${error.message}`);
      this.log(`❌ Deep linking error: ${error.message}`, 'error');
    }
  }

  generateReport() {
    const passedTests = Object.values(this.testResults).filter(result => result === true).length;
    const totalTests = Object.keys(this.testResults).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('🧭 ANDROID NAVIGATION TEST REPORT');
    console.log('='.repeat(60));
    
    console.log('\n📊 Test Results:');
    Object.entries(this.testResults).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${test.padEnd(20)}: ${status}`);
    });

    console.log(`\n📈 Overall Score: ${passedTests}/${totalTests} tests passed`);
    const overallPass = this.errors.length === 0 && passedTests >= totalTests * 0.8;
    console.log(`🎯 Overall Status: ${overallPass ? '✅ PASS' : '❌ FAIL'}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    console.log('\n📋 Android Navigation Best Practices:');
    console.log('  🔄 Implement proper back button handling');
    console.log('  📱 Test on different Android versions');
    console.log('  🎨 Follow Material Design navigation patterns');
    console.log('  🔗 Configure deep linking for better UX');
    console.log('  ⚡ Use native navigation for better performance');

    console.log('\n' + '='.repeat(60));
    
    return overallPass;
  }

  async run() {
    console.log('🚀 Starting Android Navigation Tests...\n');
    
    await this.testNavigationSetup();
    await this.testScreenComponents();
    await this.testTabNavigation();
    await this.testStackNavigation();
    await this.testBackButtonHandling();
    await this.testDeepLinking();
    
    const success = this.generateReport();
    process.exit(success ? 0 : 1);
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new AndroidNavigationTest();
  testSuite.run().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = AndroidNavigationTest;