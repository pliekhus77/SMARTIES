/**
 * Test Environment Configuration
 * Sets up environment variables and configuration for integration tests
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env files
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.test') });

// Set test-specific environment variables
process.env.NODE_ENV = 'test';

// MongoDB configuration for tests
if (!process.env.MONGODB_TEST_URI) {
  process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017';
}

// Python configuration for embedding service tests
if (!process.env.PYTHON_PATH) {
  process.env.PYTHON_PATH = 'python';
}

// Test timeouts
process.env.TEST_TIMEOUT = '60000';
process.env.JEST_TIMEOUT = '60000';

// Logging configuration
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Performance monitoring
process.env.ENABLE_PERFORMANCE_MONITORING = 'true';

// Mock configuration
process.env.MOCK_EMBEDDING_SERVICE = 'true';
process.env.MOCK_VECTOR_SEARCH = 'true';

// Test data configuration
process.env.TEST_DATA_SIZE = '100'; // Limit test data size
process.env.TEST_BATCH_SIZE = '10'; // Smaller batches for faster tests

console.log('🔧 Test environment configured');
console.log(`  Node Environment: ${process.env.NODE_ENV}`);
console.log(`  MongoDB URI: ${process.env.MONGODB_TEST_URI ? 'Configured' : 'Not configured'}`);
console.log(`  Python Path: ${process.env.PYTHON_PATH}`);
console.log(`  Test Timeout: ${process.env.TEST_TIMEOUT}ms`);