/**
 * Jest Configuration for Cross-Platform Tests
 * Task 8.4: Specialized configuration for cross-platform compatibility testing
 * 
 * This configuration ensures cross-platform tests run with appropriate
 * settings for both iOS and Android platform testing scenarios.
 * 
 * Requirements: 3.5
 */

module.exports = {
  preset: 'react-native',
  displayName: 'Cross-Platform Tests',
  
  // Test file patterns - only run cross-platform tests
  testMatch: [
    '**/__tests__/cross-platform/**/*.(ts|tsx|js)',
    '**/*.cross-platform.(test|spec).(ts|tsx|js)'
  ],
  
  // Ignore other test directories
  testPathIgnorePatterns: [
    '/node_modules/',
    '/integration/',
    '/__tests__/(?!cross-platform)',
    '/src/__tests__/',
  ],
  
  // Setup files for cross-platform testing
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/__tests__/cross-platform/setup.ts'
  ],
  
  // Test environment optimized for cross-platform testing
  testEnvironment: 'node',
  
  // Transform patterns for React Native and cross-platform modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-status-bar|@react-navigation|realm|@react-native-async-storage|expo-barcode-scanner|expo-camera|expo-secure-store|expo-font|expo-constants|expo-device)/)'
  ],
  
  // Module name mapping for cross-platform testing
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    '^@/config/(.*)$': '<rootDir>/src/config/$1',
    '^@/navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
  },
  
  // Coverage configuration for cross-platform tests
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!src/**/*.types.ts',
    // Focus on cross-platform critical components
    'src/components/**/*.{ts,tsx}',
    'src/screens/**/*.{ts,tsx}',
    'src/navigation/**/*.{ts,tsx}',
    'src/services/**/*.{ts,tsx}',
  ],
  
  // Coverage thresholds for cross-platform compatibility
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    // Higher thresholds for critical cross-platform components
    'src/components/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    'src/screens/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  
  // Global configuration for cross-platform testing
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    },
    // Platform simulation globals
    __PLATFORM_IOS__: true,
    __PLATFORM_ANDROID__: true,
    __CROSS_PLATFORM_TEST__: true,
  },
  
  // Reporters for cross-platform test results
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './test-results',
      outputName: 'cross-platform-test-results.xml',
      ancestorSeparator: ' › ',
      uniqueOutputName: 'false',
      suiteNameTemplate: '{filepath}',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      addFileAttribute: 'true'
    }],
    ['<rootDir>/scripts/cross-platform-test-reporter.js', {
      outputFile: './test-results/cross-platform-summary.json'
    }]
  ],
  
  // Timeout configuration for cross-platform tests
  testTimeout: 30000, // 30 seconds for comprehensive cross-platform tests
  
  // Verbose output for detailed cross-platform test information
  verbose: true,
  
  // Error handling for cross-platform testing
  errorOnDeprecated: false,
  
  // Module directories for cross-platform dependencies
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/__tests__'
  ],
  
  // File extensions for cross-platform testing
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  
  // Clear mocks between tests for consistent cross-platform testing
  clearMocks: true,
  restoreMocks: true,
  
  // Collect coverage from cross-platform critical paths
  collectCoverage: true,
  coverageDirectory: './coverage/cross-platform',
  
  // Coverage reporters for cross-platform analysis
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Maximum worker processes for cross-platform testing
  maxWorkers: '50%',
  
  // Cache configuration for cross-platform tests
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-cross-platform',
  
  // Watch plugins for development
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Snapshot serializers for consistent cross-platform snapshots
  snapshotSerializers: [
    '@testing-library/jest-native/serializer'
  ],
  
  // Test result processor for cross-platform analysis
  testResultsProcessor: '<rootDir>/scripts/cross-platform-results-processor.js',
};