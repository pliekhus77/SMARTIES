#!/usr/bin/env node

const fs = require('fs');

const screens = [
  'src/screens/ScanScreen.tsx',
  'src/screens/ProfileScreen.tsx',
  'src/screens/HistoryScreen.tsx',
  'src/screens/SettingsScreen.tsx',
  'src/screens/ResultScreen.tsx'
];

screens.forEach(screenPath => {
  console.log(`\n=== Checking ${screenPath} ===`);
  
  if (!fs.existsSync(screenPath)) {
    console.log('❌ File does not exist');
    return;
  }
  
  const screenContent = fs.readFileSync(screenPath, 'utf8');
  
  const hasReactImport = screenContent.includes('import React') || screenContent.includes('import * as React');
  const hasReactNativeImports = screenContent.includes('react-native') || 
                               screenContent.includes('expo-') ||
                               screenContent.includes('@expo/') ||
                               screenContent.includes('../components') ||
                               screenContent.includes('../services');
  const hasExportDefault = screenContent.includes('export default') || 
                          screenContent.includes('export {') ||
                          screenContent.includes('export const');
  
  console.log(`React import: ${hasReactImport}`);
  console.log(`React Native imports: ${hasReactNativeImports}`);
  console.log(`Export: ${hasExportDefault}`);
  console.log(`Overall: ${hasReactImport && hasReactNativeImports && hasExportDefault}`);
  
  // Show first few lines for debugging
  const lines = screenContent.split('\n').slice(0, 10);
  console.log('First 10 lines:');
  lines.forEach((line, i) => console.log(`${i+1}: ${line}`));
});