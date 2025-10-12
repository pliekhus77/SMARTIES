/**
 * Integration Test Setup
 * Global setup for all integration tests
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Extend Jest timeout for integration tests
jest.setTimeout(60000);

// Global test configuration
declare global {
  var __MONGO_CLIENT__: MongoClient | undefined;
  var __TEST_DB_NAME__: string;
}

// Setup before all tests
beforeAll(async () => {
  console.log('🔧 Setting up integration test environment...');
  
  // Set test database name
  global.__TEST_DB_NAME__ = `smarties_test_${Date.now()}`;
  
  // Setup MongoDB connection if not already done
  if (!global.__MONGO_CLIENT__) {
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017';
    global.__MONGO_CLIENT__ = new MongoClient(mongoUri);
    
    try {
      await global.__MONGO_CLIENT__.connect();
      console.log('✅ MongoDB test connection established');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB for testing:', error);
      throw error;
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...');
  
  if (global.__MONGO_CLIENT__) {
    try {
      // Drop test database
      const db = global.__MONGO_CLIENT__.db(global.__TEST_DB_NAME__);
      await db.dropDatabase();
      console.log('✅ Test database cleaned up');
      
      // Close connection
      await global.__MONGO_CLIENT__.close();
      console.log('✅ MongoDB test connection closed');
    } catch (error) {
      console.error('⚠️ Error during cleanup:', error);
    }
  }
});

// Setup before each test
beforeEach(async () => {
  // Clear any test data before each test
  if (global.__MONGO_CLIENT__) {
    const db = global.__MONGO_CLIENT__.db(global.__TEST_DB_NAME__);
    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  }
});

// Error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Memory monitoring
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  originalConsoleLog(`[MEM: ${memMB}MB]`, ...args);
};