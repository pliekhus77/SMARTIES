#!/usr/bin/env node

/**
 * SMARTIES Hackathon Setup Validation Script
 * 
 * This script validates that the development environment is properly configured
 * and all team members can successfully run the application.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: []
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
  results.passed++;
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
  results.failed++;
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
  results.warnings++;
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function runCommand(command, description) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output: output.trim() };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

function checkNodeVersion() {
  log('\n📋 Checking Node.js version...', colors.bold);
  
  const result = runCommand('node --version');
  if (!result.success) {
    logError('Node.js is not installed or not in PATH');
    return false;
  }
  
  const version = result.output.replace('v', '');
  const majorVersion = parseInt(version.split('.')[0]);
  
  if (majorVersion >= 18) {
    logSuccess(`Node.js version ${version} (✓ >= 18.0.0)`);
    return true;
  } else {
    logError(`Node.js version ${version} (✗ requires >= 18.0.0)`);
    return false;
  }
}

function checkNpmVersion() {
  log('\n📦 Checking npm version...', colors.bold);
  
  const result = runCommand('npm --version');
  if (!result.success) {
    logError('npm is not installed or not in PATH');
    return false;
  }
  
  logSuccess(`npm version ${result.output}`);
  return true;
}

function checkGitVersion() {
  log('\n🔧 Checking Git version...', colors.bold);
  
  const result = runCommand('git --version');
  if (!result.success) {
    logError('Git is not installed or not in PATH');
    return false;
  }
  
  logSuccess(`${result.output}`);
  return true;
}

function checkProjectStructure() {
  log('\n📁 Checking project structure...', colors.bold);
  
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    '.env.example',
    'src/config/config.ts',
    'src/test/setup.ts'
  ];
  
  const requiredDirs = [
    'src',
    'src/components',
    'src/services',
    'src/utils',
    'src/test'
  ];
  
  let allGood = true;
  
  // Check files
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`Found ${file}`);
    } else {
      logError(`Missing ${file}`);
      allGood = false;
    }
  }
  
  // Check directories
  for (const dir of requiredDirs) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      logSuccess(`Found directory ${dir}/`);
    } else {
      logError(`Missing directory ${dir}/`);
      allGood = false;
    }
  }
  
  return allGood;
}

function checkEnvironmentFile() {
  log('\n🔐 Checking environment configuration...', colors.bold);
  
  if (!fs.existsSync('.env')) {
    logWarning('.env file not found - copy .env.example to .env and configure');
    return false;
  }
  
  logSuccess('Found .env file');
  
  // Check if .env has required variables
  const envContent = fs.readFileSync('.env', 'utf8');
  const requiredVars = [
    'MONGODB_URI',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY'
  ];
  
  let hasAllVars = true;
  for (const varName of requiredVars) {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=`)) {
      logSuccess(`Environment variable ${varName} is set`);
    } else {
      logWarning(`Environment variable ${varName} needs to be configured`);
      hasAllVars = false;
    }
  }
  
  return hasAllVars;
}

function checkDependencies() {
  log('\n📚 Checking dependencies...', colors.bold);
  
  if (!fs.existsSync('node_modules')) {
    logError('node_modules not found - run "npm install"');
    return false;
  }
  
  logSuccess('node_modules directory exists');
  
  // Check if package.json dependencies are installed
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const criticalDeps = ['zod', 'typescript', 'jest', 'ts-jest'];
  let allInstalled = true;
  
  for (const dep of criticalDeps) {
    const depPath = path.join('node_modules', dep);
    if (fs.existsSync(depPath)) {
      logSuccess(`Dependency ${dep} is installed`);
    } else {
      logError(`Dependency ${dep} is missing`);
      allInstalled = false;
    }
  }
  
  return allInstalled;
}

function checkTypeScriptCompilation() {
  log('\n🔧 Checking TypeScript compilation...', colors.bold);
  
  const result = runCommand('npx tsc --noEmit');
  if (result.success) {
    logSuccess('TypeScript compilation successful');
    return true;
  } else {
    logError('TypeScript compilation failed');
    logInfo('Run "npx tsc --noEmit" to see detailed errors');
    return false;
  }
}

function checkTests() {
  log('\n🧪 Running tests...', colors.bold);
  
  // Run unit tests
  logInfo('Running unit tests...');
  const unitResult = runCommand('npm run test:unit');
  if (unitResult.success) {
    logSuccess('Unit tests passed');
  } else {
    logError('Unit tests failed');
    logInfo('Run "npm run test:unit" to see detailed errors');
  }
  
  // Run configuration tests specifically
  logInfo('Testing configuration loading...');
  const configResult = runCommand('npm test -- src/config/__tests__/config.test.ts');
  if (configResult.success) {
    logSuccess('Configuration tests passed');
  } else {
    logError('Configuration tests failed - check .env file');
  }
  
  return unitResult.success && configResult.success;
}

function checkPlatformTools() {
  log('\n📱 Checking platform development tools...', colors.bold);
  
  // Check for iOS development (macOS only)
  if (process.platform === 'darwin') {
    const xcodeResult = runCommand('xcode-select --print-path');
    if (xcodeResult.success) {
      logSuccess('Xcode Command Line Tools installed');
    } else {
      logWarning('Xcode Command Line Tools not found - iOS development not available');
    }
  } else {
    logInfo('Not on macOS - iOS development not available');
  }
  
  // Check for Android development
  const javaResult = runCommand('java -version');
  if (javaResult.success) {
    logSuccess('Java is installed (required for Android development)');
  } else {
    logWarning('Java not found - Android development may not work');
  }
  
  return true; // Platform tools are optional for basic development
}

function generateReport() {
  log('\n📊 Validation Report', colors.bold);
  log('='.repeat(50), colors.blue);
  
  const total = results.passed + results.failed + results.warnings;
  const successRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
  
  log(`✅ Passed: ${results.passed}`, colors.green);
  log(`❌ Failed: ${results.failed}`, colors.red);
  log(`⚠️  Warnings: ${results.warnings}`, colors.yellow);
  log(`📈 Success Rate: ${successRate}%`, successRate >= 80 ? colors.green : colors.red);
  
  if (results.failed === 0) {
    log('\n🎉 Environment validation successful!', colors.green + colors.bold);
    log('Your development environment is ready for the hackathon.', colors.green);
  } else if (results.failed <= 2) {
    log('\n⚠️  Environment validation completed with minor issues.', colors.yellow + colors.bold);
    log('Please address the failed checks before starting development.', colors.yellow);
  } else {
    log('\n❌ Environment validation failed.', colors.red + colors.bold);
    log('Please fix the issues above before proceeding.', colors.red);
  }
  
  log('\n📋 Next Steps:', colors.bold);
  if (results.failed === 0) {
    log('1. Join the team Slack channel');
    log('2. Review the project documentation');
    log('3. Start coding! 🚀');
  } else {
    log('1. Fix the failed validation checks');
    log('2. Run this script again to verify fixes');
    log('3. Ask for help in #smarties-dev if needed');
  }
  
  log('\n📞 Need help? Post in #smarties-dev Slack channel', colors.blue);
}

function main() {
  log('🚀 SMARTIES Hackathon Environment Validation', colors.bold + colors.blue);
  log('='.repeat(50), colors.blue);
  
  // Run all validation checks
  checkNodeVersion();
  checkNpmVersion();
  checkGitVersion();
  checkProjectStructure();
  checkEnvironmentFile();
  checkDependencies();
  checkTypeScriptCompilation();
  checkTests();
  checkPlatformTools();
  
  // Generate final report
  generateReport();
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the validation
if (require.main === module) {
  main();
}

module.exports = {
  checkNodeVersion,
  checkNpmVersion,
  checkGitVersion,
  checkProjectStructure,
  checkEnvironmentFile,
  checkDependencies,
  checkTypeScriptCompilation,
  checkTests,
  checkPlatformTools
};
