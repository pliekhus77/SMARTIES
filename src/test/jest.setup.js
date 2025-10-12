/**
 * Jest setup file to configure test environment
 */

// Set NODE_ENV to test to disable timers in services
process.env.NODE_ENV = 'test';

// Set shorter timeouts for tests
jest.setTimeout(10000);