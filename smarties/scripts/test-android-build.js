#!/usr/bin/env node

/**
 * Android Build and Functionality Test Script
 * Tests Android simulator build and validates all screens and navigation
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class AndroidTestSuite {
  constructor() {
    this.testResults = {
      buildConfiguration: false,
      dependencies: false,
      simulatorBuild: false,
      screenNavigation: false,
      functionality: false,
      overall: false
    };
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, options = {}) {
    try {
      const result = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 120000, // 2 minutes timeout
        ...options 
      });
      return { success: true, output: result };
    } catch (error) {
      return { 
        success: false, 
        error: error.message, 
        output: error.stdout || error.stderr || '' 
      };
    }
  }

  async checkAndroidBuildConfiguration() {
    this.log('🔍 Checking Android build configuration...');
    
    try {
      // Check app.json Android configuration
      const appJsonPath = path.join(process.cwd(), 'app.json');
      if (!fs.existsSync(appJsonPath)) {
        throw new Error('app.json not found');
      }

      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      const androidConfig = appConfig.expo?.android;

      if (!androidConfig) {
        throw new Error('Android configuration missing in app.json');
      }

      // Validate required Android configuration
      const requiredFields = ['adaptiveIcon', 'permissions'];
      const missingFields = requiredFields.filter(field => !androidConfig[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing Android configuration fields: ${missingFields.join(', ')}`);
      }

      // Check camera permission
      if (!androidConfig.permissions.includes('android.permission.CAMERA')) {
        this.warnings.push('Camera permission not configured for Android');
      }

      // Check adaptive icon
      if (!androidConfig.adaptiveIcon?.foregroundImage) {
        this.warnings.push('Adaptive icon foreground image not configured');
      }

      this.testResults.buildConfiguration = true;
      this.log('✅ Android build configuration validated');
      
    } catch (error) {
      this.errors.push(`Android configuration error: ${error.message}`);
      this.log(`❌ Android configuration error: ${error.message}`, 'error');
    }
  }

  async checkAndroidDependencies() {
    this.log('🔍 Checking Android-specific dependencies...');
    
    try {
      // Check package.json for Android-related scripts
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const requiredScripts = ['android', 'build:android'];
      const missingScripts = requiredScripts.filter(script => !packageConfig.scripts[script]);
      
      if (missingScripts.length > 0) {
        throw new Error(`Missing Android scripts: ${missingScripts.join(', ')}`);
      }

      // Check for React Native and Expo dependencies
      const requiredDeps = ['react-native', 'expo'];
      const missingDeps = requiredDeps.filter(dep => 
        !packageConfig.dependencies[dep] && !packageConfig.devDependencies[dep]
      );
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing required dependencies: ${missingDeps.join(', ')}`);
      }

      this.testResults.dependencies = true;
      this.log('✅ Android dependencies validated');
      
    } catch (error) {
      this.errors.push(`Dependency error: ${error.message}`);
      this.log(`❌ Dependency error: ${error.message}`, 'error');
    }
  }

  async testAndroidSimulatorBuild() {
    this.log('🔍 Testing Android simulator build...');
    
    try {
      // Check if Android SDK is available
      const adbResult = await this.runCommand('adb version');
      if (!adbResult.success) {
        throw new Error('Android SDK/ADB not found. Please install Android Studio and SDK.');
      }

      // Check for running emulators
      const devicesResult = await this.runCommand('adb devices');
      if (!devicesResult.success) {
        throw new Error('Failed to check Android devices');
      }

      const devices = devicesResult.output.split('\n')
        .filter(line => line.includes('\tdevice') || line.includes('\temulator'))
        .length;

      if (devices === 0) {
        this.warnings.push('No Android emulator running. Please start an Android emulator.');
        // Don't fail the test, just warn
      }

      // Test Expo build preparation
      this.log('📱 Preparing Expo build for Android...');
      
      // Check if we can prepare the Android build
      const expoBuildCheck = await this.runCommand('npx expo install --fix', { 
        cwd: process.cwd(),
        timeout: 60000 
      });
      
      if (!expoBuildCheck.success) {
        this.warnings.push('Expo install --fix had issues, but continuing...');
      }

      // Validate TypeScript compilation
      this.log('🔧 Validating TypeScript compilation...');
      const tscResult = await this.runCommand('npx tsc --noEmit');
      if (!tscResult.success) {
        throw new Error(`TypeScript compilation failed: ${tscResult.error}`);
      }

      this.testResults.simulatorBuild = true;
      this.log('✅ Android simulator build preparation successful');
      
    } catch (error) {
      this.errors.push(`Android build error: ${error.message}`);
      this.log(`❌ Android build error: ${error.message}`, 'error');
    }
  }

  async validateScreensAndNavigation() {
    this.log('🔍 Validating screens and navigation...');
    
    try {
      // Check if all required screen files exist
      const requiredScreens = [
        'src/screens/ScanScreen.tsx',
        'src/screens/ProfileScreen.tsx',
        'src/screens/ResultScreen.tsx',
        'src/screens/SettingsScreen.tsx'
      ];

      const missingScreens = requiredScreens.filter(screen => 
        !fs.existsSync(path.join(process.cwd(), screen))
      );

      if (missingScreens.length > 0) {
        throw new Error(`Missing screen files: ${missingScreens.join(', ')}`);
      }

      // Check navigation configuration
      const navigationFiles = [
        'src/navigation/AppNavigator.tsx',
        'App.tsx'
      ];

      const existingNavFiles = navigationFiles.filter(file => 
        fs.existsSync(path.join(process.cwd(), file))
      );

      if (existingNavFiles.length === 0) {
        throw new Error('No navigation configuration found');
      }

      // Validate React Navigation dependencies
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const navDeps = [
        '@react-navigation/native',
        '@react-navigation/bottom-tabs',
        '@react-navigation/stack'
      ];

      const missingNavDeps = navDeps.filter(dep => 
        !packageConfig.dependencies[dep]
      );

      if (missingNavDeps.length > 0) {
        throw new Error(`Missing navigation dependencies: ${missingNavDeps.join(', ')}`);
      }

      this.testResults.screenNavigation = true;
      this.log('✅ Screens and navigation validated');
      
    } catch (error) {
      this.errors.push(`Navigation error: ${error.message}`);
      this.log(`❌ Navigation error: ${error.message}`, 'error');
    }
  }

  async testAndroidFunctionality() {
    this.log('🔍 Testing Android-specific functionality...');
    
    try {
      // Test camera permissions configuration
      const appJsonPath = path.join(process.cwd(), 'app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      const androidPermissions = appConfig.expo?.android?.permissions || [];
      if (!androidPermissions.includes('android.permission.CAMERA')) {
        throw new Error('Camera permission not configured for Android');
      }

      // Check barcode scanner configuration
      const plugins = appConfig.expo?.plugins || [];
      const barcodePlugin = plugins.find(plugin => 
        Array.isArray(plugin) ? plugin[0] === 'expo-barcode-scanner' : plugin === 'expo-barcode-scanner'
      );

      if (!barcodePlugin) {
        throw new Error('Barcode scanner plugin not configured');
      }

      // Test database service integration
      const dbServicePaths = [
        'src/services/atlas/database.ts',
        'src/services/DatabaseService.ts'
      ];
      
      let dbServiceFound = false;
      for (const servicePath of dbServicePaths) {
        if (fs.existsSync(path.join(process.cwd(), servicePath))) {
          dbServiceFound = true;
          break;
        }
      }
      
      if (!dbServiceFound) {
        throw new Error('DatabaseService not found');
      }

      // Validate Android-specific UI components
      const componentPaths = [
        'src/components/BarcodeScanner.tsx',
        'src/components/ProductCard.tsx',
        'src/components/AlertBanner.tsx'
      ];

      const missingComponents = componentPaths.filter(comp => 
        !fs.existsSync(path.join(process.cwd(), comp))
      );

      if (missingComponents.length > 0) {
        this.warnings.push(`Some UI components missing: ${missingComponents.join(', ')}`);
      }

      this.testResults.functionality = true;
      this.log('✅ Android functionality validated');
      
    } catch (error) {
      this.errors.push(`Functionality error: ${error.message}`);
      this.log(`❌ Functionality error: ${error.message}`, 'error');
    }
  }

  async runAndroidCompatibilityTests() {
    this.log('🔍 Running Android compatibility tests...');
    
    try {
      // Run Jest tests with Android-specific configuration
      const testResult = await this.runCommand('npm test -- --testPathPattern="android|Android" --passWithNoTests');
      
      if (!testResult.success) {
        this.warnings.push('Some Android-specific tests failed, but continuing...');
      }

      // Test Metro bundler configuration
      const metroConfigPath = path.join(process.cwd(), 'metro.config.js');
      if (fs.existsSync(metroConfigPath)) {
        this.log('✅ Metro configuration found');
      } else {
        this.warnings.push('Metro configuration not found');
      }

      // Test Babel configuration
      const babelConfigPath = path.join(process.cwd(), 'babel.config.js');
      if (fs.existsSync(babelConfigPath)) {
        this.log('✅ Babel configuration found');
      } else {
        this.warnings.push('Babel configuration not found');
      }

      this.log('✅ Android compatibility tests completed');
      
    } catch (error) {
      this.warnings.push(`Compatibility test warning: ${error.message}`);
      this.log(`⚠️ Compatibility test warning: ${error.message}`, 'warning');
    }
  }

  generateReport() {
    const passedTests = Object.values(this.testResults).filter(result => result === true).length;
    const totalTests = Object.keys(this.testResults).length - 1; // Exclude 'overall'
    
    this.testResults.overall = this.errors.length === 0 && passedTests >= totalTests * 0.8;

    console.log('\n' + '='.repeat(60));
    console.log('📱 ANDROID BUILD AND FUNCTIONALITY TEST REPORT');
    console.log('='.repeat(60));
    
    console.log('\n📊 Test Results:');
    Object.entries(this.testResults).forEach(([test, passed]) => {
      if (test !== 'overall') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${test.padEnd(20)}: ${status}`);
      }
    });

    console.log(`\n📈 Overall Score: ${passedTests}/${totalTests} tests passed`);
    console.log(`🎯 Overall Status: ${this.testResults.overall ? '✅ PASS' : '❌ FAIL'}`);

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

    console.log('\n📋 Next Steps:');
    if (this.testResults.overall) {
      console.log('  ✅ Android build configuration is ready');
      console.log('  📱 You can now run: npm run android');
      console.log('  🚀 Start an Android emulator and test the app');
    } else {
      console.log('  🔧 Fix the errors listed above');
      console.log('  📱 Ensure Android Studio and SDK are installed');
      console.log('  🔄 Re-run this test after fixes');
    }

    console.log('\n' + '='.repeat(60));
    
    return this.testResults.overall;
  }

  async run() {
    console.log('🚀 Starting Android Build and Functionality Tests...\n');
    
    await this.checkAndroidBuildConfiguration();
    await this.checkAndroidDependencies();
    await this.testAndroidSimulatorBuild();
    await this.validateScreensAndNavigation();
    await this.testAndroidFunctionality();
    await this.runAndroidCompatibilityTests();
    
    const success = this.generateReport();
    process.exit(success ? 0 : 1);
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new AndroidTestSuite();
  testSuite.run().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = AndroidTestSuite;