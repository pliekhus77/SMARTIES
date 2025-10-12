/**
 * End-to-End Test Setup
 * Task 7.4: Test setup for integration tests
 */

import '@testing-library/jest-native/extend-expect';

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers for consistent testing
jest.useFakeTimers();

// Global test timeout
jest.setTimeout(10000);

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllTimers();
});

// Mock database configuration
jest.mock('../../../src/config/config', () => ({
  config: {
    mongodb: {
      uri: 'mongodb://localhost:27017/test',
      database: 'smarties_e2e_test',
    },
    ai: {
      openaiApiKey: 'test-key',
      anthropicApiKey: 'test-key',
    },
    apis: {
      openFoodFactsUrl: 'https://test.openfoodfacts.org',
    },
    app: {
      nodeEnv: 'test',
      logLevel: 'error',
    },
  },
}));
