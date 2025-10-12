#!/usr/bin/env ts-node

/**
 * Script to create MongoDB Atlas Vector Search indexes for SMARTIES application
 * Implements Task 6.1: Configure vector search indexes for 384-dimension embeddings
 * 
 * Usage:
 *   npm run create-vector-indexes
 *   or
 *   npx ts-node src/scripts/create-vector-indexes.ts
 */

import { VectorSearchService } from '../services/VectorSearchService';
import { DatabaseService } from '../services/DatabaseService';

async function main() {
  console.log('🚀 SMARTIES Vector Search Index Creation');
  console.log('========================================');
  
  let databaseService: DatabaseService | null = null;
  
  try {
    // Initialize database connection
    console.log('📡 Connecting to MongoDB Atlas...');
    databaseService = DatabaseService.getInstance();
    const connectionResult = await databaseService.connect();
    
    if (!connectionResult.success) {
      throw new Error(`Database connection failed: ${connectionResult.message}`);
    }
    
    console.log('✅ Connected to MongoDB Atlas successfully');
    
    // Initialize vector search service
    const vectorSearchService = new VectorSearchService(databaseService);
    
    // Create vector search indexes
    console.log('\n🔍 Creating vector search indexes...');
    const result = await vectorSearchService.createVectorSearchIndexes();
    
    if (result.success) {
      console.log(`\n✅ ${result.message}`);
      
      // List created indexes
      console.log('\n📋 Listing vector search indexes...');
      const listResult = await vectorSearchService.listVectorSearchIndexes();
      
      if (listResult.success && listResult.indexes) {
        console.log('\nCreated Vector Search Indexes:');
        listResult.indexes.forEach(index => {
          console.log(`  ✓ ${index}`);
        });
      }
      
      // Generate manual commands for Atlas UI
      console.log('\n📝 Manual Atlas Search Index Commands:');
      console.log('=====================================');
      console.log('If you need to create these indexes manually in MongoDB Atlas UI,');
      console.log('use the following commands in the MongoDB shell or Atlas Search UI:\n');
      
      const commands = vectorSearchService.generateAtlasSearchCommands();
      commands.forEach(command => {
        console.log(command);
        console.log('\n' + '='.repeat(80) + '\n');
      });
      
    } else {
      console.error(`\n❌ ${result.message}`);
      if (result.errors) {
        result.errors.forEach(error => {
          console.error(`   - ${error}`);
        });
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error creating vector search indexes:', error);
    process.exit(1);
  } finally {
    // Clean up database connection
    if (databaseService) {
      try {
        await databaseService.disconnect();
        console.log('\n📡 Disconnected from MongoDB Atlas');
      } catch (error) {
        console.warn('Warning: Error disconnecting from database:', error);
      }
    }
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as createVectorIndexes };
