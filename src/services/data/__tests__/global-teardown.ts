/**
 * Global Teardown for Integration Tests
 * Runs once after all test suites complete
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

export default async function globalTeardown() {
  console.log('🧹 Global integration test teardown starting...');
  
  // Clean up any remaining test databases
  const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    
    // List all databases and clean up test databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    
    const testDatabases = databases.databases.filter(db => 
      db.name.startsWith('smarties_test_') || 
      db.name.includes('integration_test') ||
      db.name === 'connection_test'
    );
    
    for (const testDb of testDatabases) {
      try {
        await client.db(testDb.name).dropDatabase();
        console.log(`🗑️ Cleaned up test database: ${testDb.name}`);
      } catch (error) {
        console.warn(`⚠️ Failed to clean up database ${testDb.name}:`, error);
      }
    }
    
  } catch (error) {
    console.warn('⚠️ Error during database cleanup:', error);
  } finally {
    await client.close();
  }
  
  // Generate test summary report
  try {
    const coverageDir = path.join(process.cwd(), 'coverage/integration');
    const testResultsDir = path.join(process.cwd(), 'test-results/integration');
    
    // Create summary of test artifacts
    const summary = {
      timestamp: new Date().toISOString(),
      testRun: 'Integration Tests',
      artifacts: {
        coverage: fs.existsSync(coverageDir) ? fs.readdirSync(coverageDir) : [],
        testResults: fs.existsSync(testResultsDir) ? fs.readdirSync(testResultsDir) : []
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        mongoUri: process.env.MONGODB_TEST_URI ? 'Configured' : 'Default',
        pythonPath: process.env.PYTHON_PATH || 'Default'
      }
    };
    
    const summaryPath = path.join(process.cwd(), 'integration-test-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Test summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.warn('⚠️ Failed to generate test summary:', error);
  }
  
  // Clean up temporary files
  try {
    const tempFiles = [
      'integration-test-report.json',
      'test-mongodb-connection.log'
    ];
    
    for (const file of tempFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up temporary file: ${file}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Error cleaning up temporary files:', error);
  }
  
  // Memory usage report
  const memUsage = process.memoryUsage();
  console.log('📊 Final memory usage:');
  console.log(`  Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
  console.log(`  Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`);
  console.log(`  External: ${Math.round(memUsage.external / 1024 / 1024)} MB`);
  
  console.log('✅ Global teardown completed');
}