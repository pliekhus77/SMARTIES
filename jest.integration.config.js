/**
 * Jest Configuration for Integration Tests
 * Specialized configuration for Task 3.4 integration tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/src/services/data/__tests__/*Integration.test.ts',
    '**/src/services/data/__tests__/integration-*.test.ts'
  ],
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/src/services/data/__tests__/integration-setup.ts'],
  
  // TypeScript support
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  
  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1'
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/services/data/**/*.ts',
    '!src/services/data/**/*.test.ts',
    '!src/services/data/**/*.d.ts',
    '!src/services/data/__tests__/**/*'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test timeouts (longer for integration tests)
  testTimeout: 60000, // 60 seconds
  
  // Verbose output
  verbose: true,
  
  // Detect open handles (useful for MongoDB connections)
  detectOpenHandles: true,
  forceExit: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/src/services/data/__tests__/global-setup.ts',
  globalTeardown: '<rootDir>/src/services/data/__tests__/global-teardown.ts',
  
  // Test result processor
  testResultsProcessor: '<rootDir>/src/services/data/__tests__/test-results-processor.js',
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/integration',
      filename: 'integration-test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'Data Pipeline Integration Tests'
    }],
    ['jest-junit', {
      outputDirectory: './coverage/integration',
      outputName: 'junit.xml',
      suiteName: 'Data Pipeline Integration Tests'
    }]
  ],
  
  // Environment variables for tests
  setupFiles: ['<rootDir>/src/services/data/__tests__/test-env.ts'],
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Performance monitoring
  logHeapUsage: true,
  
  // Parallel execution (disabled for integration tests to avoid conflicts)
  maxWorkers: 1,
  
  // Cache configuration
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-integration',
  
  // Watch mode configuration (for development)
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/'
  ]
};