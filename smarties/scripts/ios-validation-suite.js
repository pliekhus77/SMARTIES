#!/usr/bin/env node

/**
 * Complete iOS Validation Suite
 * Task 8.1: Test iOS simulator build and functionality
 * 
 * This script validates:
 * - iOS build settings and dependencies
 * - Screen and navigation compatibility
 * - App functionality on iOS
 */

const { execSync } = require('child_process');

console.log('🍎 SMARTIES iOS Validation Suite');
console.log('=================================\n');

const testSuites = [
  {
    name: 'iOS Compatibility Tests',
    script: 'test-ios-compatibility.js',
    description: 'Validates iOS-specific configurations and dependencies'
  },
  {
    name: 'iOS Navigation Tests', 
    script: 'test-ios-navigation.js',
    description: 'Tests navigation structure and screen compatibility'
  },
  {
    name: 'iOS Functionality Tests',
    script: 'test-ios-functionality.js', 
    description: 'Validates app functionality and iOS features'
  }
];

let totalSuitesPassed = 0;
let totalSuites = testSuites.length;

for (const suite of testSuites) {
  console.log(`🧪 Running ${suite.name}...`);
  console.log(`📝 ${suite.description}\n`);
  
  try {
    execSync(`node scripts/${suite.script}`, { stdio: 'inherit' });
    console.log(`✅ ${suite.name} PASSED\n`);
    totalSuitesPassed++;
  } catch (error) {
    console.log(`❌ ${suite.name} FAILED\n`);
  }
}

console.log('=================================');
console.log(`📊 Overall Results: ${totalSuitesPassed}/${totalSuites} test suites passed`);

if (totalSuitesPassed === totalSuites) {
  console.log('🎉 ALL iOS VALIDATION TESTS PASSED!');
  console.log('✅ SMARTIES is ready for iOS simulator testing');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. iOS Simulator Testing (macOS required):');
  console.log('   npm run ios');
  console.log('');
  console.log('2. Expo Go Testing (any platform):');
  console.log('   npm start');
  console.log('   Scan QR code with Expo Go app');
  console.log('');
  console.log('3. Key iOS Features to Test:');
  console.log('   • App launches and initializes');
  console.log('   • Bottom tab navigation');
  console.log('   • All screens render correctly');
  console.log('   • Camera permissions work');
  console.log('   • Safe area handling');
  console.log('   • Offline mode functionality');
  console.log('   • Database connectivity');
  
  process.exit(0);
} else {
  console.log('⚠️  Some iOS validation tests failed');
  console.log('❌ Please fix failing tests before iOS deployment');
  process.exit(1);
}