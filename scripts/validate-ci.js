#!/usr/bin/env node

/**
 * CI/CD Validation Script
 * Validates that all CI/CD components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating CI/CD Configuration...\n');

const checks = [
  {
    name: 'GitHub Actions CI Workflow',
    path: '.github/workflows/ci.yml',
    required: true
  },
  {
    name: 'Build Status Workflow',
    path: '.github/workflows/build-status.yml',
    required: false
  },
  {
    name: 'Hackathon Deployment Workflow',
    path: '.github/workflows/deploy-hackathon.yml',
    required: false
  },
  {
    name: 'Main Package.json',
    path: 'package.json',
    required: true
  },
  {
    name: 'Smarties Package.json',
    path: 'smarties/package.json',
    required: true
  }
];

let allPassed = true;

checks.forEach(check => {
  const exists = fs.existsSync(check.path);
  const status = exists ? '✅' : (check.required ? '❌' : '⚠️');
  const message = exists ? 'Found' : (check.required ? 'Missing (Required)' : 'Missing (Optional)');
  
  console.log(`${status} ${check.name}: ${message}`);
  
  if (check.required && !exists) {
    allPassed = false;
  }
});

console.log('\n📋 CI/CD Features Configured:');

// Check CI workflow features
if (fs.existsSync('.github/workflows/ci.yml')) {
  const ciContent = fs.readFileSync('.github/workflows/ci.yml', 'utf8');
  
  const features = [
    { name: 'Multi-platform builds (iOS/Android)', check: ciContent.includes('build-ios') && ciContent.includes('build-android') },
    { name: 'Automated testing', check: ciContent.includes('npm test') },
    { name: 'Code quality checks (linting)', check: ciContent.includes('lint') },
    { name: 'TypeScript validation', check: ciContent.includes('tsc --noEmit') },
    { name: 'Build artifacts upload', check: ciContent.includes('upload-artifact') },
    { name: 'Coverage reporting', check: ciContent.includes('codecov') },
    { name: 'Manual workflow trigger', check: ciContent.includes('workflow_dispatch') }
  ];
  
  features.forEach(feature => {
    const status = feature.check ? '✅' : '❌';
    console.log(`${status} ${feature.name}`);
  });
}

console.log('\n🚀 Deployment Options:');
if (fs.existsSync('.github/workflows/deploy-hackathon.yml')) {
  console.log('✅ Manual deployment to hackathon environment');
  console.log('✅ Environment selection (hackathon/demo)');
} else {
  console.log('❌ Deployment workflows not configured');
}

console.log('\n📊 Summary:');
if (allPassed) {
  console.log('✅ All required CI/CD components are configured!');
  console.log('🎉 Ready for automated builds and deployments');
} else {
  console.log('❌ Some required components are missing');
  console.log('🔧 Please check the missing files above');
}

console.log('\n💡 Next Steps:');
console.log('1. Push changes to trigger the CI pipeline');
console.log('2. Check GitHub Actions tab for build status');
console.log('3. Use manual deployment for hackathon demos');
console.log('4. Monitor build artifacts and coverage reports');