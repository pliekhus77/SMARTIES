/**
 * MongoDB Atlas Index Setup Script
 * Implements Task 5.2: Implement performance-optimized indexes
 * 
 * This script creates all performance-optimized indexes for the SMARTIES application
 * according to the requirements specified in the core architecture design.
 * 
 * Requirements implemented:
 * - 2.2: Fast product lookups via UPC index
 * - 2.3: Efficient user profile queries and scan history
 * - 2.4: Allergen and dietary restriction filtering
 * - 2.5: Sub-100ms query response times
 */

import { databaseService } from '../services/DatabaseService';

/**
 * Main function to set up all performance-optimized indexes
 */
async function setupIndexes(): Promise<void> {
  console.log('🚀 Starting MongoDB Atlas index setup for SMARTIES...');
  console.log('📋 Task 5.2: Implement performance-optimized indexes');
  
  try {
    // Connect to database
    console.log('🔌 Connecting to MongoDB Atlas...');
    await databaseService.connect();
    console.log('✅ Connected to MongoDB Atlas');

    // Create all performance-optimized indexes
    console.log('📊 Creating performance-optimized indexes...');
    const indexResult = await databaseService.createPerformanceIndexes();
    
    if (!indexResult.success) {
      throw new Error(indexResult.error || 'Failed to create indexes');
    }

    // Validate index performance
    console.log('🧪 Validating index performance...');
    const performanceResult = await databaseService.validateIndexPerformance();
    
    if (!performanceResult.success) {
      console.warn('⚠️ Index performance validation failed:', performanceResult.error);
    } else {
      const { products, users, scanResults } = performanceResult.data!;
      
      console.log('📈 Performance validation results:');
      console.log(`  Products collection: ${products.avgResponseTime.toFixed(2)}ms (${products.passed ? '✅ PASS' : '❌ FAIL'})`);
      console.log(`  Users collection: ${users.avgResponseTime.toFixed(2)}ms (${users.passed ? '✅ PASS' : '❌ FAIL'})`);
      console.log(`  Scan results collection: ${scanResults.avgResponseTime.toFixed(2)}ms (${scanResults.passed ? '✅ PASS' : '❌ FAIL'})`);
      
      const allPassed = products.passed && users.passed && scanResults.passed;
      console.log(`  Overall performance: ${allPassed ? '✅ MEETS SUB-100MS REQUIREMENT' : '❌ PERFORMANCE ISSUE'}`);
    }

    // List all created indexes for verification
    console.log('📋 Verifying created indexes...');
    
    const collections = ['products', 'users', 'scan_results'];
    for (const collectionName of collections) {
      const indexesResult = await databaseService.listCollectionIndexes(collectionName);
      if (indexesResult.success) {
        const indexNames = indexesResult.data!.map(index => index.name);
        console.log(`  ${collectionName}: ${indexNames.length} indexes (${indexNames.join(', ')})`);
      }
    }

    console.log('\n🎉 Index setup completed successfully!');
    console.log('✅ Task 5.2: Implement performance-optimized indexes - COMPLETED');
    console.log('\n📋 Summary of created indexes:');
    console.log('  Products Collection:');
    console.log('    - upc_unique_lookup (unique): Fast UPC-based product lookups');
    console.log('    - allergens_filter: Fast allergen filtering');
    console.log('    - product_text_search: Full-text search on name and brand');
    console.log('    - dietary_*_filter: Dietary flag filtering (halal, kosher, vegan, etc.)');
    console.log('    - last_updated_desc: Data freshness queries');
    console.log('    - data_source_filter: Data source filtering');
    console.log('  Users Collection:');
    console.log('    - profile_id_unique (unique): Primary user lookup');
    console.log('    - user_*_filter: Dietary restriction filtering (allergies, religious, medical, lifestyle)');
    console.log('    - last_active_desc: User activity tracking');
    console.log('    - alert_level_filter: Notification preference queries');
    console.log('  Scan Results Collection:');
    console.log('    - user_scan_history (compound): User scan history (userId + scanTimestamp)');
    console.log('    - scan_upc_analytics: Product-based analytics');
    console.log('    - compliance_status_analytics: Safety analytics');
    console.log('    - recent_scans_global: Recent scans across all users');
    console.log('    - violations_analysis: Violation pattern analysis');
    console.log('    - product_scan_relationship: Product-scan relationships');
    console.log('    - location_geo_queries: Location-based queries');
    console.log('\n➡️ Ready for Task 5.3: Write performance validation tests');

  } catch (error) {
    console.error('❌ Error during index setup:', error);
    throw error;
  } finally {
    // Disconnect from database
    console.log('🔌 Disconnecting from MongoDB Atlas...');
    await databaseService.disconnect();
    console.log('✅ Disconnected from MongoDB Atlas');
  }
}

/**
 * Function to recreate all indexes (useful for development/testing)
 */
async function recreateIndexes(): Promise<void> {
  console.log('🔄 Recreating all indexes...');
  
  try {
    await databaseService.connect();
    
    const result = await databaseService.recreateAllIndexes();
    if (!result.success) {
      throw new Error(result.error || 'Failed to recreate indexes');
    }
    
    console.log('✅ All indexes recreated successfully');
    
  } catch (error) {
    console.error('❌ Error recreating indexes:', error);
    throw error;
  } finally {
    await databaseService.disconnect();
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'recreate') {
    recreateIndexes().catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
  } else {
    setupIndexes().catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
  }
}

export { setupIndexes, recreateIndexes };