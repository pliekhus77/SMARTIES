#!/usr/bin/env node

/**
 * MongoDB Atlas Setup Script for SMARTIES Application
 * Implements Requirements 1.1, 1.2, and 1.5 from data schema specification
 * 
 * This script:
 * - Verifies connection to MongoDB Atlas M0 cluster
 * - Creates required indexes for optimal performance
 * - Validates vector search readiness
 * - Provides storage optimization recommendations
 */

import { DatabaseManager } from '../models/DatabaseConnection';
import { VectorSearchIndexManager } from '../models/VectorSearchIndex';
import { DatabaseService } from '../services/DatabaseService';

/**
 * Setup result summary
 */
interface SetupResult {
  success: boolean;
  connectionTime: number;
  indexesCreated: number;
  storageUtilization: number;
  issues: string[];
  recommendations: string[];
}

/**
 * Main setup function
 */
async function setupMongoDBAtlas(): Promise<SetupResult> {
  console.log('🚀 SMARTIES MongoDB Atlas Setup');
  console.log('================================');
  console.log('Setting up MongoDB Atlas Vector Search infrastructure...\n');
  
  const startTime = Date.now();
  const issues: string[] = [];
  const recommendations: string[] = [];
  let indexesCreated = 0;
  let storageUtilization = 0;
  
  try {
    // Step 1: Initialize database connection
    console.log('Step 1: Connecting to MongoDB Atlas...');
    await DatabaseManager.initialize();
    
    const db = DatabaseManager.getInstance();
    const connectionStatus = db.getConnectionStatus();
    
    if (!connectionStatus.isConnected) {
      throw new Error('Failed to establish database connection');
    }
    
    console.log(`✓ Connected to cluster: ${connectionStatus.cluster}`);
    console.log(`✓ Database: ${connectionStatus.database}`);
    console.log(`✓ Connection time: ${connectionStatus.connectionTime}ms\n`);
    
    // Step 2: Create standard indexes
    console.log('Step 2: Creating database indexes...');
    const indexResults = await db.createIndexes();
    indexesCreated = indexResults.filter(r => r.success).length;
    
    const failedIndexes = indexResults.filter(r => !r.success);
    if (failedIndexes.length > 0) {
      failedIndexes.forEach(result => {
        issues.push(`Failed to create index ${result.indexName}: ${result.error}`);
      });
    }
    
    console.log(`✓ Created ${indexesCreated} indexes successfully\n`);
    
    // Step 3: Setup vector search indexes (preparation only)
    console.log('Step 3: Preparing vector search indexes...');
    const dbService = new DatabaseService();
    const vectorManager = new VectorSearchIndexManager(dbService);
    
    try {
      await vectorManager.createVectorSearchIndexes();
      console.log('✓ Vector search index definitions prepared\n');
    } catch (error) {
      issues.push(`Vector search setup failed: ${error}`);
    }
    
    // Step 4: Check storage utilization
    console.log('Step 4: Checking storage utilization...');
    const storageStats = await db.getStorageStats();
    storageUtilization = storageStats.utilizationPercentage;
    
    if (storageUtilization > 80) {
      issues.push(`High storage utilization: ${storageUtilization.toFixed(1)}%`);
    }
    
    if (storageStats.estimatedMaxDocuments < 10000) {
      issues.push(`Limited capacity: estimated max ${storageStats.estimatedMaxDocuments} documents`);
    }
    
    console.log('✓ Storage analysis completed\n');
    
    // Step 5: Validate complete setup
    console.log('Step 5: Validating setup...');
    const validation = await db.validateSetup();
    
    if (validation.issues.length > 0) {
      issues.push(...validation.issues);
    }
    
    // Step 6: Generate recommendations
    recommendations.push(...db.getOptimizationRecommendations());
    recommendations.push(...vectorManager.getPerformanceRecommendations());
    
    const setupTime = Date.now() - startTime;
    const success = issues.length === 0;
    
    // Print summary
    console.log('Setup Summary');
    console.log('=============');
    console.log(`Status: ${success ? '✅ SUCCESS' : '⚠️  COMPLETED WITH ISSUES'}`);
    console.log(`Total time: ${setupTime}ms`);
    console.log(`Connection: ${validation.connection ? '✓' : '✗'}`);
    console.log(`Indexes: ${validation.indexes ? '✓' : '✗'} (${indexesCreated} created)`);
    console.log(`Vector Search: ${validation.vectorSearchReady ? '✓' : '⚠️  Manual setup required'}`);
    console.log(`Storage: ${validation.storageOptimal ? '✓' : '⚠️'} (${storageUtilization.toFixed(1)}% used)`);
    
    if (issues.length > 0) {
      console.log('\n⚠️  Issues Detected:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      recommendations.slice(0, 5).forEach(rec => console.log(`   - ${rec}`));
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Create vector search indexes via MongoDB Atlas UI');
    console.log('   2. Configure IP whitelist for hackathon venue');
    console.log('   3. Test vector search functionality');
    console.log('   4. Import sample product data');
    
    return {
      success,
      connectionTime: connectionStatus.connectionTime,
      indexesCreated,
      storageUtilization,
      issues,
      recommendations
    };
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    
    return {
      success: false,
      connectionTime: 0,
      indexesCreated,
      storageUtilization,
      issues: [error instanceof Error ? error.message : String(error)],
      recommendations
    };
    
  } finally {
    // Clean up connection
    try {
      await DatabaseManager.shutdown();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

/**
 * Test database connection only (lightweight check)
 */
async function testConnection(): Promise<void> {
  console.log('🔍 Testing MongoDB Atlas connection...\n');
  
  try {
    const db = DatabaseManager.getInstance();
    await db.connect();
    
    const status = db.getConnectionStatus();
    const pingSuccess = await db.ping();
    
    console.log('Connection Test Results:');
    console.log(`✓ Cluster: ${status.cluster}`);
    console.log(`✓ Database: ${status.database}`);
    console.log(`✓ Connection time: ${status.connectionTime}ms`);
    console.log(`✓ Ping: ${pingSuccess ? 'Success' : 'Failed'}`);
    
    if (status.error) {
      console.log(`⚠️  Last error: ${status.error}`);
    }
    
    await DatabaseManager.shutdown();
    console.log('\n✅ Connection test completed successfully');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'setup';
  
  try {
    switch (command) {
      case 'test':
        await testConnection();
        break;
        
      case 'setup':
      default:
        const result = await setupMongoDBAtlas();
        process.exit(result.success ? 0 : 1);
    }
    
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { setupMongoDBAtlas, testConnection };