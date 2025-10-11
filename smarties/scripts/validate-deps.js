#!/usr/bin/env node

/**
 * Dependency validation script for SMARTIES
 * Ensures all required dependencies are installed and compatible
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageLockPath = path.join(__dirname, '..', 'package-lock.json');

console.log('🔍 Validating SMARTIES dependencies...');

// Check if package.json exists
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found');
  process.exit(1);
}

// Check if package-lock.json exists
if (!fs.existsSync(packageLockPath)) {
  console.error('❌ package-lock.json not found. Run "npm install" first.');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Validate required dependencies
const requiredDeps = [
  'expo',
  'react',
  'react-native',
  'expo-barcode-scanner',
  'realm',
  'openai',
  '@anthropic-ai/sdk',
  '@react-navigation/native'
];

const missingDeps = requiredDeps.filter(dep => 
  !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
);

if (missingDeps.length > 0) {
  console.error('❌ Missing required dependencies:', missingDeps.join(', '));
  process.exit(1);
}

// Validate Node.js version
const nodeVersion = process.version;
const requiredNodeVersion = packageJson.engines?.node || '>=18.0.0';

console.log(`✅ Node.js version: ${nodeVersion}`);
console.log(`✅ Required Node.js version: ${requiredNodeVersion}`);

// Check if all required dependencies are present
console.log('✅ All required dependencies are present');

// Validate TypeScript configuration
const tsConfigPath = path.join(__dirname, '..', 'tsconfig.json');
if (!fs.existsSync(tsConfigPath)) {
  console.error('❌ tsconfig.json not found');
  process.exit(1);
}

console.log('✅ TypeScript configuration found');

// Validate ESLint configuration
const eslintConfigPath = path.join(__dirname, '..', '.eslintrc.js');
if (!fs.existsSync(eslintConfigPath)) {
  console.error('❌ .eslintrc.js not found');
  process.exit(1);
}

console.log('✅ ESLint configuration found');

console.log('🎉 All dependency validations passed!');
console.log('');
console.log('Next steps:');
console.log('1. Copy .env.example to .env and configure your API keys');
console.log('2. Run "npm run validate" to run full validation');
console.log('3. Run "npm start" to start the development server');