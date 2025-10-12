/**
 * Global Setup for Integration Tests
 * Runs once before all test suites
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  console.log('🌍 Global integration test setup starting...');
  
  // Check required environment variables
  const requiredEnvVars = ['MONGODB_TEST_URI'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Using default values for testing...');
  }
  
  // Test MongoDB connection
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('✅ MongoDB test connection verified');
    
    // Test basic operations
    const testDb = client.db('connection_test');
    const testCollection = testDb.collection('test');
    
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    const testDoc = await testCollection.findOne({ test: true });
    await testCollection.deleteOne({ test: true });
    
    if (testDoc) {
      console.log('✅ MongoDB read/write operations verified');
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection test failed:', error);
    throw new Error('Cannot proceed with integration tests - MongoDB unavailable');
  } finally {
    await client.close();
  }
  
  // Check Python embedding service
  try {
    const { spawn } = require('child_process');
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(process.cwd(), 'embedding_service_interface.py');
    
    if (fs.existsSync(scriptPath)) {
      console.log('✅ Embedding service script found');
      
      // Test if Python and required packages are available
      const testProcess = spawn(pythonPath, ['--version']);
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Python runtime available');
        } else {
          console.warn('⚠️ Python runtime test failed');
        }
      });
    } else {
      console.warn('⚠️ Embedding service script not found - some tests may be skipped');
    }
  } catch (error) {
    console.warn('⚠️ Embedding service check failed:', error);
  }
  
  // Create test output directories
  const outputDirs = [
    'coverage/integration',
    'test-results/integration'
  ];
  
  for (const dir of outputDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created output directory: ${dir}`);
    }
  }
  
  // Set global test configuration
  process.env.NODE_ENV = 'test';
  process.env.TEST_TIMEOUT = '60000';
  
  console.log('🎯 Global setup completed successfully');
}