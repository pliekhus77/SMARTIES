#!/usr/bin/env node

/**
 * Android Compatibility Test Script
 * Tests Android-specific functionality and compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AndroidCompatibilityTest {
  constructor() {
    this.testResults = {
      sdkCompatibility: false,
      permissionsConfig: false,
      uiComponents: false,
      navigationFlow: false,
      deviceFeatures: false
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
        timeout: 60000,
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

  async testSDKCompatibility() {
    this.log('🔍 Testing Android SDK compatibility...');
    
    try {
      // Check app.json for Android SDK configuration
      const appJsonPath = path.join(process.cwd(), 'app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      const androidConfig = appConfig.expo?.android;
      if (!androidConfig) {
        throw new Error('Android configuration missing');
      }

      // Check for edge-to-edge configuration (Android 15+ compatibility)
      if (androidConfig.edgeToEdgeEnabled !== undefined) {
        this.log('✅ Edge-to-edge configuration found');
      }

      // Check predictive back gesture (Android 14+ compatibility)
      if (androidConfig.predictiveBackGestureEnabled !== undefined) {
        this.log('✅ Predictive back gesture configuration found');
      }

      // Validate adaptive icon configuration
      if (androidConfig.adaptiveIcon) {
        const { foregroundImage, backgroundColor } = androidConfig.adaptiveIcon;
        if (foregroundImage && backgroundColor) {
          this.log('✅ Adaptive icon properly configured');
        } else {
          this.warnings.push('Adaptive icon configuration incomplete');
        }
      }

      this.testResults.sdkCompatibility = true;
      this.log('✅ Android SDK compatibility validated');
      
    } catch (error) {
      this.errors.push(`SDK compatibility error: ${error.message}`);
      this.log(`❌ SDK compatibility error: ${error.message}`, 'error');
    }
  }

  async testPermissionsConfiguration() {
    this.log('🔍 Testing Android permissions configuration...');
    
    try {
      const appJsonPath = path.join(process.cwd(), 'app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      const permissions = appConfig.expo?.android?.permissions || [];
      
      // Check required permissions for SMARTIES app
      const requiredPermissions = [
        'android.permission.CAMERA'
      ];

      const missingPermissions = requiredPermissions.filter(perm => 
        !permissions.includes(perm)
      );

      if (missingPermissions.length > 0) {
        throw new Error(`Missing required permissions: ${missingPermissions.join(', ')}`);
      }

      // Check plugin configurations for permissions
      const plugins = appConfig.expo?.plugins || [];
      
      // Validate barcode scanner plugin
      const barcodePlugin = plugins.find(plugin => 
        Array.isArray(plugin) ? plugin[0] === 'expo-barcode-scanner' : plugin === 'expo-barcode-scanner'
      );

      if (barcodePlugin) {
        if (Array.isArray(barcodePlugin) && barcodePlugin[1]?.cameraPermission) {
          this.log('✅ Barcode scanner camera permission configured');
        } else {
          this.warnings.push('Barcode scanner permission description missing');
        }
      }

      // Validate camera plugin
      const cameraPlugin = plugins.find(plugin => 
        Array.isArray(plugin) ? plugin[0] === 'expo-camera' : plugin === 'expo-camera'
      );

      if (cameraPlugin) {
        if (Array.isArray(cameraPlugin) && cameraPlugin[1]?.cameraPermission) {
          this.log('✅ Camera plugin permission configured');
        } else {
          this.warnings.push('Camera plugin permission description missing');
        }
      }

      this.testResults.permissionsConfig = true;
      this.log('✅ Android permissions configuration validated');
      
    } catch (error) {
      this.errors.push(`Permissions error: ${error.message}`);
      this.log(`❌ Permissions error: ${error.message}`, 'error');
    }
  }

  async testUIComponents() {
    this.log('🔍 Testing Android UI components...');
    
    try {
      // Check for Android-specific UI considerations
      const componentPaths = [
        'src/components/BarcodeScanner.tsx',
        'src/components/ProductCard.tsx',
        'src/components/AlertBanner.tsx',
        'src/components/LoadingSpinner.tsx'
      ];

      let foundComponents = 0;
      componentPaths.forEach(compPath => {
        if (fs.existsSync(path.join(process.cwd(), compPath))) {
          foundComponents++;
          this.log(`✅ Found component: ${path.basename(compPath)}`);
        } else {
          this.warnings.push(`Component not found: ${compPath}`);
        }
      });

      // Check for React Native Paper (Material Design for Android)
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageConfig.dependencies['react-native-paper']) {
        this.log('✅ React Native Paper (Material Design) configured');
      } else {
        this.warnings.push('React Native Paper not found - consider for Android Material Design');
      }

      // Check for vector icons
      if (packageConfig.dependencies['react-native-vector-icons'] || 
          packageConfig.dependencies['@expo/vector-icons']) {
        this.log('✅ Vector icons configured');
      } else {
        this.warnings.push('Vector icons not configured');
      }

      this.testResults.uiComponents = foundComponents >= componentPaths.length * 0.5;
      this.log('✅ Android UI components validated');
      
    } catch (error) {
      this.errors.push(`UI components error: ${error.message}`);
      this.log(`❌ UI components error: ${error.message}`, 'error');
    }
  }

  async testNavigationFlow() {
    this.log('🔍 Testing Android navigation flow...');
    
    try {
      // Check navigation configuration
      const appTsxPath = path.join(process.cwd(), 'App.tsx');
      if (!fs.existsSync(appTsxPath)) {
        throw new Error('App.tsx not found');
      }

      const appContent = fs.readFileSync(appTsxPath, 'utf8');
      
      // Check for navigation container
      if (!appContent.includes('NavigationContainer')) {
        throw new Error('NavigationContainer not found in App.tsx');
      }

      // Check for gesture handler (required for Android navigation)
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageConfig.dependencies['react-native-gesture-handler']) {
        throw new Error('react-native-gesture-handler not found - required for Android navigation');
      }

      // Check for safe area context (important for Android edge-to-edge)
      if (!packageConfig.dependencies['react-native-safe-area-context']) {
        this.warnings.push('react-native-safe-area-context not found - recommended for Android');
      }

      // Check for screens (required for native navigation performance)
      if (!packageConfig.dependencies['react-native-screens']) {
        this.warnings.push('react-native-screens not found - recommended for performance');
      }

      // Validate screen files exist
      const screenPaths = [
        'src/screens/ScanScreen.tsx',
        'src/screens/ProfileScreen.tsx',
        'src/screens/ResultScreen.tsx',
        'src/screens/SettingsScreen.tsx'
      ];

      const missingScreens = screenPaths.filter(screen => 
        !fs.existsSync(path.join(process.cwd(), screen))
      );

      if (missingScreens.length > 0) {
        throw new Error(`Missing screen files: ${missingScreens.join(', ')}`);
      }

      this.testResults.navigationFlow = true;
      this.log('✅ Android navigation flow validated');
      
    } catch (error) {
      this.errors.push(`Navigation error: ${error.message}`);
      this.log(`❌ Navigation error: ${error.message}`, 'error');
    }
  }

  async testDeviceFeatures() {
    this.log('🔍 Testing Android device features...');
    
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check camera/barcode scanning dependencies
      const cameraFeatures = [
        'expo-camera',
        'expo-barcode-scanner'
      ];

      const missingCameraFeatures = cameraFeatures.filter(feature => 
        !packageConfig.dependencies[feature]
      );

      if (missingCameraFeatures.length > 0) {
        throw new Error(`Missing camera features: ${missingCameraFeatures.join(', ')}`);
      }

      // Check storage features
      const storageFeatures = [
        '@react-native-async-storage/async-storage',
        'expo-secure-store'
      ];

      const availableStorage = storageFeatures.filter(feature => 
        packageConfig.dependencies[feature]
      );

      if (availableStorage.length === 0) {
        this.warnings.push('No storage solution configured');
      } else {
        this.log(`✅ Storage configured: ${availableStorage.join(', ')}`);
      }

      // Check notification support
      if (packageConfig.dependencies['expo-notifications']) {
        this.log('✅ Notifications support configured');
      } else {
        this.warnings.push('Notifications not configured');
      }

      // Check location services (optional for SMARTIES)
      if (packageConfig.dependencies['expo-location']) {
        this.log('✅ Location services configured');
      }

      this.testResults.deviceFeatures = true;
      this.log('✅ Android device features validated');
      
    } catch (error) {
      this.errors.push(`Device features error: ${error.message}`);
      this.log(`❌ Device features error: ${error.message}`, 'error');
    }
  }

  generateReport() {
    const passedTests = Object.values(this.testResults).filter(result => result === true).length;
    const totalTests = Object.keys(this.testResults).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('🤖 ANDROID COMPATIBILITY TEST REPORT');
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

    console.log('\n📋 Android-Specific Recommendations:');
    console.log('  📱 Test on multiple Android versions (API 21+)');
    console.log('  🎨 Verify Material Design compliance');
    console.log('  🔄 Test back button behavior');
    console.log('  📐 Test different screen sizes and densities');
    console.log('  🔋 Monitor battery usage during scanning');

    console.log('\n' + '='.repeat(60));
    
    return overallPass;
  }

  async run() {
    console.log('🚀 Starting Android Compatibility Tests...\n');
    
    await this.testSDKCompatibility();
    await this.testPermissionsConfiguration();
    await this.testUIComponents();
    await this.testNavigationFlow();
    await this.testDeviceFeatures();
    
    const success = this.generateReport();
    process.exit(success ? 0 : 1);
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new AndroidCompatibilityTest();
  testSuite.run().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = AndroidCompatibilityTest;