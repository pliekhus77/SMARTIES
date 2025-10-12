#!/usr/bin/env node

/**
 * Android Validation Suite
 * Comprehensive test suite for Android build and functionality validation
 */

const AndroidBuildTest = require('./test-android-build');
const AndroidCompatibilityTest = require('./test-android-compatibility');
const AndroidNavigationTest = require('./test-android-navigation');
const AndroidFunctionalityTest = require('./test-android-functionality');

class AndroidValidationSuite {
  constructor() {
    this.testSuites = [
      { name: 'Android Build Test', class: AndroidBuildTest },
      { name: 'Android Compatibility Test', class: AndroidCompatibilityTest },
      { name: 'Android Navigation Test', class: AndroidNavigationTest },
      { name: 'Android Functionality Test', class: AndroidFunctionalityTest }
    ];
    this.results = {};
    this.overallErrors = [];
    this.overallWarnings = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTestSuite(testSuite) {
    this.log(`🚀 Running ${testSuite.name}...`);
    
    try {
      const testInstance = new testSuite.class();
      
      // Capture console output
      const originalLog = console.log;
      const originalError = console.error;
      let output = '';
      
      console.log = (...args) => {
        output += args.join(' ') + '\n';
        originalLog(...args);
      };
      
      console.error = (...args) => {
        output += args.join(' ') + '\n';
        originalError(...args);
      };

      // Run the test suite methods individually to avoid process.exit
      if (testSuite.class === AndroidBuildTest) {
        await testInstance.checkAndroidBuildConfiguration();
        await testInstance.checkAndroidDependencies();
        await testInstance.testAndroidSimulatorBuild();
        await testInstance.validateScreensAndNavigation();
        await testInstance.testAndroidFunctionality();
      } else if (testSuite.class === AndroidCompatibilityTest) {
        await testInstance.testSDKCompatibility();
        await testInstance.testPermissionsConfiguration();
        await testInstance.testUIComponents();
        await testInstance.testNavigationFlow();
        await testInstance.testDeviceFeatures();
      } else if (testSuite.class === AndroidNavigationTest) {
        await testInstance.testNavigationSetup();
        await testInstance.testScreenComponents();
        await testInstance.testTabNavigation();
        await testInstance.testStackNavigation();
        await testInstance.testBackButtonHandling();
        await testInstance.testDeepLinking();
      } else if (testSuite.class === AndroidFunctionalityTest) {
        await testInstance.testCameraIntegration();
        await testInstance.testBarcodeScannerSetup();
        await testInstance.testDatabaseConnectivity();
        await testInstance.testStorageServices();
        await testInstance.testUIResponsiveness();
        await testInstance.testPerformanceOptimization();
      }

      // Restore console
      console.log = originalLog;
      console.error = originalError;

      // Collect results
      const passedTests = Object.values(testInstance.testResults).filter(result => result === true).length;
      const totalTests = Object.keys(testInstance.testResults).length;
      const success = testInstance.errors.length === 0 && passedTests >= totalTests * 0.8;

      this.results[testSuite.name] = {
        success,
        passedTests,
        totalTests,
        errors: testInstance.errors || [],
        warnings: testInstance.warnings || [],
        testResults: testInstance.testResults,
        output
      };

      // Collect overall errors and warnings
      this.overallErrors.push(...(testInstance.errors || []));
      this.overallWarnings.push(...(testInstance.warnings || []));

      this.log(`${success ? '✅' : '❌'} ${testSuite.name} completed: ${passedTests}/${totalTests} tests passed`);
      
      return success;
      
    } catch (error) {
      this.log(`❌ ${testSuite.name} failed: ${error.message}`, 'error');
      this.results[testSuite.name] = {
        success: false,
        passedTests: 0,
        totalTests: 0,
        errors: [error.message],
        warnings: [],
        testResults: {},
        output: ''
      };
      this.overallErrors.push(`${testSuite.name}: ${error.message}`);
      return false;
    }
  }

  generateComprehensiveReport() {
    const totalSuites = this.testSuites.length;
    const passedSuites = Object.values(this.results).filter(result => result.success).length;
    const overallSuccess = passedSuites >= totalSuites * 0.8 && this.overallErrors.length === 0;

    console.log('\n' + '='.repeat(80));
    console.log('🤖 COMPREHENSIVE ANDROID VALIDATION REPORT');
    console.log('='.repeat(80));
    
    console.log('\n📊 Test Suite Results:');
    Object.entries(this.results).forEach(([suiteName, result]) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      const score = `${result.passedTests}/${result.totalTests}`;
      console.log(`  ${suiteName.padEnd(30)}: ${status} (${score})`);
    });

    console.log(`\n📈 Overall Score: ${passedSuites}/${totalSuites} test suites passed`);
    console.log(`🎯 Overall Status: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);

    // Detailed results by category
    console.log('\n📋 Detailed Results by Category:');
    
    // Build Configuration
    const buildResult = this.results['Android Build Test'];
    if (buildResult) {
      console.log('\n🔧 Build Configuration:');
      Object.entries(buildResult.testResults).forEach(([test, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`    ${status} ${test}`);
      });
    }

    // Compatibility
    const compatResult = this.results['Android Compatibility Test'];
    if (compatResult) {
      console.log('\n🤖 Android Compatibility:');
      Object.entries(compatResult.testResults).forEach(([test, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`    ${status} ${test}`);
      });
    }

    // Navigation
    const navResult = this.results['Android Navigation Test'];
    if (navResult) {
      console.log('\n🧭 Navigation:');
      Object.entries(navResult.testResults).forEach(([test, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`    ${status} ${test}`);
      });
    }

    // Functionality
    const funcResult = this.results['Android Functionality Test'];
    if (funcResult) {
      console.log('\n⚡ Functionality:');
      Object.entries(funcResult.testResults).forEach(([test, passed]) => {
        const status = passed ? '✅' : '❌';
        console.log(`    ${status} ${test}`);
      });
    }

    // Critical errors
    if (this.overallErrors.length > 0) {
      console.log('\n❌ Critical Errors:');
      this.overallErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    // Warnings
    if (this.overallWarnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.overallWarnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    // Recommendations
    console.log('\n📋 Android Development Recommendations:');
    
    if (overallSuccess) {
      console.log('  ✅ Android configuration is ready for development');
      console.log('  📱 You can now run: npm run android');
      console.log('  🚀 Start an Android emulator to test the app');
      console.log('  🧪 Run integration tests on physical devices');
    } else {
      console.log('  🔧 Fix critical errors before proceeding');
      console.log('  📱 Ensure Android Studio and SDK are properly installed');
      console.log('  🔄 Re-run validation after making fixes');
    }

    console.log('\n📱 Next Steps for Android Testing:');
    console.log('  1. Start Android emulator (API 21+ recommended)');
    console.log('  2. Run: npm run android');
    console.log('  3. Test barcode scanning functionality');
    console.log('  4. Verify navigation between all screens');
    console.log('  5. Test database connectivity and offline mode');
    console.log('  6. Validate camera permissions and functionality');
    console.log('  7. Test on different Android versions and screen sizes');

    console.log('\n🔧 Android Development Tools:');
    console.log('  📱 Android Studio - IDE and emulator');
    console.log('  🔍 Flipper - Debugging and inspection');
    console.log('  📊 React DevTools - Component debugging');
    console.log('  ⚡ Hermes - JavaScript engine optimization');
    console.log('  🎨 Material Design - UI guidelines');

    console.log('\n' + '='.repeat(80));
    
    return overallSuccess;
  }

  async run() {
    console.log('🚀 Starting Comprehensive Android Validation Suite...\n');
    console.log('This will run all Android-related tests to validate build and functionality.\n');
    
    let allPassed = true;
    
    for (const testSuite of this.testSuites) {
      const success = await this.runTestSuite(testSuite);
      if (!success) {
        allPassed = false;
      }
      console.log(''); // Add spacing between test suites
    }
    
    const overallSuccess = this.generateComprehensiveReport();
    
    // Save results to file
    const fs = require('fs');
    const path = require('path');
    const resultsPath = path.join(process.cwd(), 'test-results', 'android-validation-results.json');
    
    // Ensure test-results directory exists
    const testResultsDir = path.dirname(resultsPath);
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      overallSuccess,
      results: this.results,
      errors: this.overallErrors,
      warnings: this.overallWarnings
    }, null, 2));
    
    console.log(`\n📄 Detailed results saved to: ${resultsPath}`);
    
    process.exit(overallSuccess ? 0 : 1);
  }
}

// Run the validation suite
if (require.main === module) {
  const validationSuite = new AndroidValidationSuite();
  validationSuite.run().catch(error => {
    console.error('❌ Validation suite failed:', error);
    process.exit(1);
  });
}

module.exports = AndroidValidationSuite;