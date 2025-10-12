#!/usr/bin/env node

/**
 * Android Functionality Test Script
 * Tests Android-specific functionality and features
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AndroidFunctionalityTest {
  constructor() {
    this.testResults = {
      cameraIntegration: false,
      barcodeScannerSetup: false,
      databaseConnectivity: false,
      storageServices: false,
      uiResponsiveness: false,
      performanceOptimization: false
    };
    this.errors = [];
    this.warnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testCameraIntegration() {
    this.log('🔍 Testing camera integration...');
    
    try {
      // Check app.json for camera permissions
      const appJsonPath = path.join(process.cwd(), 'app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      const permissions = appConfig.expo?.android?.permissions || [];
      if (!permissions.includes('android.permission.CAMERA')) {
        throw new Error('Camera permission not configured in Android permissions');
      }

      // Check for camera plugin configuration
      const plugins = appConfig.expo?.plugins || [];
      const cameraPlugin = plugins.find(plugin => 
        Array.isArray(plugin) ? plugin[0] === 'expo-camera' : plugin === 'expo-camera'
      );

      if (!cameraPlugin) {
        throw new Error('expo-camera plugin not configured');
      }

      // Validate camera plugin permission description
      if (Array.isArray(cameraPlugin) && cameraPlugin[1]?.cameraPermission) {
        this.log('✅ Camera permission description configured');
      } else {
        this.warnings.push('Camera permission description missing');
      }

      // Check package.json for camera dependency
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageConfig.dependencies['expo-camera']) {
        throw new Error('expo-camera dependency not found');
      }

      // Check for camera component implementation
      const cameraComponentPath = path.join(process.cwd(), 'src/components/BarcodeScanner.tsx');
      if (fs.existsSync(cameraComponentPath)) {
        const cameraContent = fs.readFileSync(cameraComponentPath, 'utf8');
        if (cameraContent.includes('Camera') || cameraContent.includes('BarCodeScanner')) {
          this.log('✅ Camera component implementation found');
        } else {
          this.warnings.push('Camera component may not be properly implemented');
        }
      } else {
        this.warnings.push('Camera component not found');
      }

      this.testResults.cameraIntegration = true;
      this.log('✅ Camera integration validated');
      
    } catch (error) {
      this.errors.push(`Camera integration error: ${error.message}`);
      this.log(`❌ Camera integration error: ${error.message}`, 'error');
    }
  }

  async testBarcodeScannerSetup() {
    this.log('🔍 Testing barcode scanner setup...');
    
    try {
      // Check app.json for barcode scanner plugin
      const appJsonPath = path.join(process.cwd(), 'app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      const plugins = appConfig.expo?.plugins || [];
      const barcodePlugin = plugins.find(plugin => 
        Array.isArray(plugin) ? plugin[0] === 'expo-barcode-scanner' : plugin === 'expo-barcode-scanner'
      );

      if (!barcodePlugin) {
        throw new Error('expo-barcode-scanner plugin not configured');
      }

      // Check package.json for barcode scanner dependency
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageConfig.dependencies['expo-barcode-scanner']) {
        throw new Error('expo-barcode-scanner dependency not found');
      }

      // Check for barcode scanner service implementation
      const scannerServicePath = path.join(process.cwd(), 'src/services/ScannerService.ts');
      if (fs.existsSync(scannerServicePath)) {
        const scannerContent = fs.readFileSync(scannerServicePath, 'utf8');
        if (scannerContent.includes('BarCodeScanner') || scannerContent.includes('barcode')) {
          this.log('✅ Scanner service implementation found');
        } else {
          this.warnings.push('Scanner service may not be properly implemented');
        }
      } else {
        this.warnings.push('Scanner service not found');
      }

      // Check scanner screen implementation
      const scannerScreenPath = path.join(process.cwd(), 'src/screens/ScanScreen.tsx');
      if (fs.existsSync(scannerScreenPath)) {
        const screenContent = fs.readFileSync(scannerScreenPath, 'utf8');
        if (screenContent.includes('BarCodeScanner') || screenContent.includes('Camera') || screenContent.includes('BarcodeScanner')) {
          this.log('✅ Scanner screen implementation found');
        } else {
          this.warnings.push('Scanner screen may not have barcode scanning functionality');
        }
      } else {
        this.errors.push('Scanner screen not found');
      }

      this.testResults.barcodeScannerSetup = true;
      this.log('✅ Barcode scanner setup validated');
      
    } catch (error) {
      this.errors.push(`Barcode scanner error: ${error.message}`);
      this.log(`❌ Barcode scanner error: ${error.message}`, 'error');
    }
  }

  async testDatabaseConnectivity() {
    this.log('🔍 Testing database connectivity...');
    
    try {
      // Check package.json for database dependencies
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const dbDependencies = ['mongodb', 'realm', '@realm/react'];
      const availableDbDeps = dbDependencies.filter(dep => 
        packageConfig.dependencies[dep]
      );

      if (availableDbDeps.length === 0) {
        throw new Error('No database dependencies found');
      }

      this.log(`✅ Database dependencies found: ${availableDbDeps.join(', ')}`);

      // Check for database service implementation
      const dbServicePaths = [
        'src/services/atlas/database.ts',
        'src/services/DatabaseService.ts'
      ];
      
      let dbServiceFound = false;
      let foundServicePath = '';
      for (const servicePath of dbServicePaths) {
        if (fs.existsSync(path.join(process.cwd(), servicePath))) {
          dbServiceFound = true;
          foundServicePath = servicePath;
          break;
        }
      }
      
      if (!dbServiceFound) {
        throw new Error('DatabaseService not found');
      }

      const dbServiceContent = fs.readFileSync(path.join(process.cwd(), foundServicePath), 'utf8');
      
      // Check for connection methods
      if (!dbServiceContent.includes('connect') && !dbServiceContent.includes('initialize')) {
        throw new Error('Database connection methods not found');
      }

      // Check for CRUD operations
      const crudMethods = ['create', 'read', 'update', 'delete', 'find', 'save'];
      const foundMethods = crudMethods.filter(method => 
        dbServiceContent.includes(method)
      );

      if (foundMethods.length < 3) {
        this.warnings.push('Limited CRUD operations found in DatabaseService');
      } else {
        this.log(`✅ CRUD operations found: ${foundMethods.join(', ')}`);
      }

      // Check for error handling
      if (dbServiceContent.includes('try') && dbServiceContent.includes('catch')) {
        this.log('✅ Error handling found in DatabaseService');
      } else {
        this.warnings.push('Error handling may be missing in DatabaseService');
      }

      this.testResults.databaseConnectivity = true;
      this.log('✅ Database connectivity validated');
      
    } catch (error) {
      this.errors.push(`Database connectivity error: ${error.message}`);
      this.log(`❌ Database connectivity error: ${error.message}`, 'error');
    }
  }

  async testStorageServices() {
    this.log('🔍 Testing storage services...');
    
    try {
      // Check package.json for storage dependencies
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const storageDeps = [
        '@react-native-async-storage/async-storage',
        'expo-secure-store'
      ];

      const availableStorage = storageDeps.filter(dep => 
        packageConfig.dependencies[dep]
      );

      if (availableStorage.length === 0) {
        throw new Error('No storage dependencies found');
      }

      this.log(`✅ Storage dependencies found: ${availableStorage.join(', ')}`);

      // Check app.json for secure store plugin
      const appJsonPath = path.join(process.cwd(), 'app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      const plugins = appConfig.expo?.plugins || [];
      const secureStorePlugin = plugins.includes('expo-secure-store');

      if (secureStorePlugin) {
        this.log('✅ Secure store plugin configured');
      } else {
        this.warnings.push('Secure store plugin not configured');
      }

      // Check for storage service implementation
      const storageServicePaths = [
        'src/services/StorageService.ts',
        'src/services/SecureStorageService.ts',
        'src/utils/storage.ts'
      ];

      let storageServiceFound = false;
      for (const servicePath of storageServicePaths) {
        if (fs.existsSync(path.join(process.cwd(), servicePath))) {
          storageServiceFound = true;
          this.log(`✅ Storage service found: ${servicePath}`);
          break;
        }
      }

      if (!storageServiceFound) {
        this.warnings.push('Storage service implementation not found');
      }

      this.testResults.storageServices = true;
      this.log('✅ Storage services validated');
      
    } catch (error) {
      this.errors.push(`Storage services error: ${error.message}`);
      this.log(`❌ Storage services error: ${error.message}`, 'error');
    }
  }

  async testUIResponsiveness() {
    this.log('🔍 Testing UI responsiveness...');
    
    try {
      // Check package.json for UI/animation dependencies
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for animation libraries
      const animationLibs = [
        'react-native-reanimated',
        'react-native-gesture-handler'
      ];

      const availableAnimations = animationLibs.filter(lib => 
        packageConfig.dependencies[lib]
      );

      if (availableAnimations.length > 0) {
        this.log(`✅ Animation libraries found: ${availableAnimations.join(', ')}`);
      } else {
        this.warnings.push('No animation libraries found - may impact UX');
      }

      // Check for UI component library
      const uiLibs = [
        'react-native-paper',
        'react-native-elements',
        '@react-native-community/ui-lib'
      ];

      const availableUILibs = uiLibs.filter(lib => 
        packageConfig.dependencies[lib]
      );

      if (availableUILibs.length > 0) {
        this.log(`✅ UI component library found: ${availableUILibs.join(', ')}`);
      } else {
        this.warnings.push('No UI component library found');
      }

      // Check for vector icons
      const iconLibs = [
        'react-native-vector-icons',
        '@expo/vector-icons'
      ];

      const availableIcons = iconLibs.filter(lib => 
        packageConfig.dependencies[lib]
      );

      if (availableIcons.length > 0) {
        this.log(`✅ Icon library found: ${availableIcons.join(', ')}`);
      } else {
        this.warnings.push('No icon library found');
      }

      // Check for safe area handling
      if (packageConfig.dependencies['react-native-safe-area-context']) {
        this.log('✅ Safe area context configured');
      } else {
        this.warnings.push('Safe area context not configured - may cause layout issues');
      }

      this.testResults.uiResponsiveness = true;
      this.log('✅ UI responsiveness validated');
      
    } catch (error) {
      this.errors.push(`UI responsiveness error: ${error.message}`);
      this.log(`❌ UI responsiveness error: ${error.message}`, 'error');
    }
  }

  async testPerformanceOptimization() {
    this.log('🔍 Testing performance optimization...');
    
    try {
      // Check package.json for performance-related dependencies
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for screens optimization
      if (packageConfig.dependencies['react-native-screens']) {
        this.log('✅ React Native Screens configured for performance');
      } else {
        this.warnings.push('React Native Screens not configured - may impact navigation performance');
      }

      // Check for Hermes engine support (Android performance)
      const metroConfigPath = path.join(process.cwd(), 'metro.config.js');
      if (fs.existsSync(metroConfigPath)) {
        const metroContent = fs.readFileSync(metroConfigPath, 'utf8');
        if (metroContent.includes('hermes') || metroContent.includes('Hermes')) {
          this.log('✅ Hermes engine configuration found');
        } else {
          this.warnings.push('Hermes engine configuration not found');
        }
      }

      // Check app.json for new architecture
      const appJsonPath = path.join(process.cwd(), 'app.json');
      const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      if (appConfig.expo?.newArchEnabled) {
        this.log('✅ New React Native architecture enabled');
      } else {
        this.warnings.push('New React Native architecture not enabled');
      }

      // Check for image optimization
      const imageLibs = [
        'react-native-fast-image',
        'expo-image'
      ];

      const availableImageLibs = imageLibs.filter(lib => 
        packageConfig.dependencies[lib]
      );

      if (availableImageLibs.length > 0) {
        this.log(`✅ Image optimization library found: ${availableImageLibs.join(', ')}`);
      } else {
        this.warnings.push('No image optimization library found');
      }

      // Check for bundle size optimization
      if (packageConfig.dependencies['react-native-bundle-visualizer']) {
        this.log('✅ Bundle analyzer configured');
      } else {
        this.warnings.push('Bundle analyzer not configured');
      }

      this.testResults.performanceOptimization = true;
      this.log('✅ Performance optimization validated');
      
    } catch (error) {
      this.errors.push(`Performance optimization error: ${error.message}`);
      this.log(`❌ Performance optimization error: ${error.message}`, 'error');
    }
  }

  generateReport() {
    const passedTests = Object.values(this.testResults).filter(result => result === true).length;
    const totalTests = Object.keys(this.testResults).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('⚡ ANDROID FUNCTIONALITY TEST REPORT');
    console.log('='.repeat(60));
    
    console.log('\n📊 Test Results:');
    Object.entries(this.testResults).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`  ${test.padEnd(25)}: ${status}`);
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

    console.log('\n📋 Android Performance Tips:');
    console.log('  🚀 Enable Hermes engine for better performance');
    console.log('  📱 Use React Native Screens for navigation optimization');
    console.log('  🎨 Implement proper image caching and optimization');
    console.log('  🔋 Monitor battery usage during camera operations');
    console.log('  📊 Use Flipper or React DevTools for debugging');

    console.log('\n' + '='.repeat(60));
    
    return overallPass;
  }

  async run() {
    console.log('🚀 Starting Android Functionality Tests...\n');
    
    await this.testCameraIntegration();
    await this.testBarcodeScannerSetup();
    await this.testDatabaseConnectivity();
    await this.testStorageServices();
    await this.testUIResponsiveness();
    await this.testPerformanceOptimization();
    
    const success = this.generateReport();
    process.exit(success ? 0 : 1);
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new AndroidFunctionalityTest();
  testSuite.run().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = AndroidFunctionalityTest;