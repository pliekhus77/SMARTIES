/**
 * BulkDataLoader Usage Examples
 * Demonstrates Task 3.3 implementation - Build bulk data loading with vector embeddings
 * 
 * Examples:
 * - Basic bulk loading with embeddings
 * - Advanced configuration and monitoring
 * - Error recovery and quality assurance
 * - Integration with data processing pipeline
 * - Performance optimization techniques
 */

import { 
  BulkDataLoader, 
  createBulkDataLoader, 
  bulkLoadProductsQuick,
  BulkLoadingConfig,
  BulkLoadingProgress
} from '../BulkDataLoader';
import { DataProcessingPipeline } from '../index';
import { CreateProductInput } from '../../../types/Product';

/**
 * Example 1: Basic Bulk Loading with Vector Embeddings
 */
export async function basicBulkLoadingExample(): Promise<void> {
  console.log('🚀 Example 1: Basic Bulk Loading with Vector Embeddings');
  console.log('=' .repeat(60));
  
  // Sample product data
  const sampleProducts: CreateProductInput[] = [
    {
      code: '1234567890123',
      product_name: 'Organic Chocolate Chip Cookies',
      ingredients_text: 'organic wheat flour, organic sugar, organic chocolate chips, organic eggs, organic butter, vanilla extract, baking soda, salt',
      allergens_tags: ['en:gluten', 'en:eggs', 'en:milk'],
      labels_tags: ['en:organic', 'en:non-gmo'],
      data_quality_score: 0.9,
      source: 'openfoodfacts',
      dietary_flags: {
        vegan: false,
        vegetarian: true,
        gluten_free: false,
        kosher: false,
        halal: false,
        organic: true
      }
    },
    {
      code: '2345678901234',
      product_name: 'Gluten-Free Rice Crackers',
      ingredients_text: 'brown rice, sea salt, sunflower oil',
      allergens_tags: [],
      labels_tags: ['en:gluten-free', 'en:vegan'],
      data_quality_score: 0.85,
      source: 'openfoodfacts',
      dietary_flags: {
        vegan: true,
        vegetarian: true,
        gluten_free: true,
        kosher: false,
        halal: false
      }
    },
    {
      code: '3456789012345',
      product_name: 'Kosher Beef Jerky',
      ingredients_text: 'beef, salt, spices, natural flavoring',
      allergens_tags: [],
      labels_tags: ['en:kosher'],
      data_quality_score: 0.8,
      source: 'openfoodfacts',
      dietary_flags: {
        vegan: false,
        vegetarian: false,
        gluten_free: true,
        kosher: true,
        halal: false
      }
    }
  ];
  
  try {
    // Create bulk loader with basic configuration
    const bulkLoader = createBulkDataLoader({
      batchSize: 2,
      enableProgressTracking: true,
      enableQualityAssurance: true
    });
    
    // Progress callback to monitor loading
    const progressCallback = (progress: BulkLoadingProgress) => {
      console.log(`📊 Progress: ${progress.processedProducts}/${progress.totalProducts} products`);
      console.log(`   Embeddings: ${progress.embeddingsGenerated} generated, ${progress.embeddingsFailed} failed`);
      console.log(`   Quality Score: ${progress.qualityScore.toFixed(2)}`);
      console.log(`   Memory Usage: ${progress.memoryUsageMB.toFixed(1)} MB`);
    };
    
    // Perform bulk loading
    const result = await bulkLoader.loadProductsWithEmbeddings(sampleProducts, progressCallback);
    
    // Display results
    console.log('\n✅ Bulk Loading Results:');
    console.log(`Success: ${result.success}`);
    console.log(`Products Processed: ${result.stats.totalProducts}`);
    console.log(`Successful Inserts: ${result.stats.successfulProducts}`);
    console.log(`Failed Inserts: ${result.stats.failedProducts}`);
    console.log(`Embeddings Generated: ${result.stats.embeddingsGenerated}`);
    console.log(`Processing Time: ${result.stats.totalProcessingTime}ms`);
    console.log(`Performance: ${result.stats.performanceMetrics.productsPerSecond.toFixed(1)} products/sec`);
    console.log(`Quality Score: ${result.qualityAssurance.overallScore.toFixed(2)}`);
    
    if (result.qualityAssurance.issues.length > 0) {
      console.log('\n⚠️  Quality Issues:');
      result.qualityAssurance.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    if (result.qualityAssurance.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.qualityAssurance.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
  } catch (error) {
    console.error('❌ Bulk loading failed:', error);
  }
}

/**
 * Example 2: Advanced Configuration and Performance Optimization
 */
export async function advancedBulkLoadingExample(): Promise<void> {
  console.log('\n🔧 Example 2: Advanced Configuration and Performance Optimization');
  console.log('=' .repeat(60));
  
  // Advanced configuration for high-performance bulk loading
  const advancedConfig: BulkLoadingConfig = {
    batchSize: 100,                    // Larger batches for better throughput
    maxConcurrentBatches: 5,           // Higher concurrency
    embeddingBatchSize: 50,            // Optimize embedding generation
    enableProgressTracking: true,      // Detailed progress monitoring
    enableErrorRecovery: true,         // Robust error handling
    maxRetries: 3,                     // Retry failed operations
    retryDelayMs: 2000,               // Exponential backoff
    validateBeforeInsert: true,        // Ensure data quality
    enableQualityAssurance: true,      // Comprehensive QA checks
    skipDuplicates: true,              // Avoid duplicate insertions
    memoryThresholdMB: 1000,          // Higher memory threshold
    enableVectorValidation: true,      // Validate embedding quality
    logProgressInterval: 500           // More frequent progress updates
  };
  
  try {
    const bulkLoader = new BulkDataLoader(advancedConfig);
    
    // Generate larger dataset for performance testing
    const largeDataset = generateLargeProductDataset(1000);
    
    console.log(`📦 Processing ${largeDataset.length} products with advanced configuration...`);
    
    const startTime = Date.now();
    
    // Enhanced progress tracking
    const progressCallback = (progress: BulkLoadingProgress) => {
      const elapsedTime = Date.now() - startTime;
      const processingRate = progress.processedProducts / (elapsedTime / 1000);
      
      console.log(`⚡ Batch ${progress.currentBatch}/${progress.totalBatches} completed`);
      console.log(`   Rate: ${processingRate.toFixed(1)} products/sec`);
      console.log(`   ETA: ${Math.round(progress.estimatedTimeRemaining / 1000)}s`);
      console.log(`   Error Rate: ${(progress.errorRate * 100).toFixed(1)}%`);
    };
    
    const result = await bulkLoader.loadProductsWithEmbeddings(largeDataset, progressCallback);
    
    // Performance analysis
    console.log('\n📈 Performance Analysis:');
    console.log(`Total Processing Time: ${result.stats.totalProcessingTime / 1000}s`);
    console.log(`Average Batch Time: ${result.stats.averageBatchTime}ms`);
    console.log(`Embedding Generation Time: ${result.stats.embeddingGenerationTime / 1000}s`);
    console.log(`Database Insertion Time: ${result.stats.databaseInsertionTime / 1000}s`);
    console.log(`Peak Memory Usage: ${result.stats.memoryPeakUsageMB.toFixed(1)} MB`);
    
    console.log('\n🎯 Throughput Metrics:');
    console.log(`Products/Second: ${result.stats.performanceMetrics.productsPerSecond.toFixed(1)}`);
    console.log(`Embeddings/Second: ${result.stats.performanceMetrics.embeddingsPerSecond.toFixed(1)}`);
    console.log(`Inserts/Second: ${result.stats.performanceMetrics.insertsPerSecond.toFixed(1)}`);
    
  } catch (error) {
    console.error('❌ Advanced bulk loading failed:', error);
  }
}

/**
 * Example 3: Error Recovery and Quality Assurance
 */
export async function errorRecoveryExample(): Promise<void> {
  console.log('\n🛠️  Example 3: Error Recovery and Quality Assurance');
  console.log('=' .repeat(60));
  
  // Create dataset with some problematic products
  const problematicDataset: CreateProductInput[] = [
    // Valid product
    {
      code: '1111111111111',
      product_name: 'Valid Product',
      ingredients_text: 'water, salt',
      allergens_tags: [],
      data_quality_score: 0.9,
      source: 'openfoodfacts',
      dietary_flags: {
        vegan: true,
        vegetarian: true,
        gluten_free: true,
        kosher: false,
        halal: false
      }
    },
    // Product with missing required field (will cause validation error)
    {
      code: '', // Invalid: empty UPC
      product_name: 'Invalid Product',
      ingredients_text: 'test ingredients',
      allergens_tags: [],
      data_quality_score: 0.5,
      source: 'manual',
      dietary_flags: {
        vegan: false,
        vegetarian: false,
        gluten_free: false,
        kosher: false,
        halal: false
      }
    },
    // Product with very long ingredients (potential embedding issue)
    {
      code: '3333333333333',
      product_name: 'Complex Product',
      ingredients_text: 'a'.repeat(10000), // Very long ingredients text
      allergens_tags: ['en:gluten', 'en:milk', 'en:eggs', 'en:nuts'],
      data_quality_score: 0.6,
      source: 'openfoodfacts',
      dietary_flags: {
        vegan: false,
        vegetarian: false,
        gluten_free: false,
        kosher: false,
        halal: false
      }
    }
  ];
  
  try {
    const bulkLoader = createBulkDataLoader({
      batchSize: 1,                     // Small batches to isolate errors
      enableErrorRecovery: true,        // Enable error recovery
      maxRetries: 2,                    // Allow retries
      retryDelayMs: 1000,              // 1 second retry delay
      enableQualityAssurance: true,     // Enable QA checks
      validateBeforeInsert: true        // Validate before processing
    });
    
    const result = await bulkLoader.loadProductsWithEmbeddings(problematicDataset);
    
    console.log('\n🔍 Error Recovery Results:');
    console.log(`Total Products: ${result.stats.totalProducts}`);
    console.log(`Successful: ${result.stats.successfulProducts}`);
    console.log(`Failed: ${result.stats.failedProducts}`);
    console.log(`Error Recovery Items: ${result.errorRecovery.length}`);
    
    // Analyze error recovery
    if (result.errorRecovery.length > 0) {
      console.log('\n⚠️  Error Recovery Details:');
      result.errorRecovery.forEach((recovery, index) => {
        console.log(`   Error ${index + 1}:`);
        console.log(`     Products: ${recovery.failedProducts.length}`);
        console.log(`     Retry Attempts: ${recovery.retryAttempts}`);
        console.log(`     Strategy: ${recovery.recoveryStrategy}`);
        console.log(`     Messages: ${recovery.errorMessages.join(', ')}`);
      });
    }
    
    // Quality assurance analysis
    console.log('\n🎯 Quality Assurance Results:');
    console.log(`Overall Score: ${result.qualityAssurance.overallScore.toFixed(2)}`);
    console.log(`Data Completeness: ${(result.qualityAssurance.checks.dataCompleteness * 100).toFixed(1)}%`);
    console.log(`Embedding Quality: ${(result.qualityAssurance.checks.embeddingQuality * 100).toFixed(1)}%`);
    console.log(`Validation Passed: ${(result.qualityAssurance.checks.validationPassed * 100).toFixed(1)}%`);
    
    if (result.qualityAssurance.issues.length > 0) {
      console.log('\n❗ Quality Issues:');
      result.qualityAssurance.issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Error recovery example failed:', error);
  }
}

/**
 * Example 4: Integration with Data Processing Pipeline
 */
export async function pipelineIntegrationExample(): Promise<void> {
  console.log('\n🔗 Example 4: Integration with Data Processing Pipeline');
  console.log('=' .repeat(60));
  
  try {
    // Create complete data processing pipeline with bulk loading
    const pipeline = new DataProcessingPipeline(
      {}, // Extractor config
      {}, // Validator config
      {}, // Cleaner config
      {}, // Filter config
      {}, // Dietary config
      {   // Bulk loading config
        batchSize: 50,
        enableProgressTracking: true,
        enableQualityAssurance: true,
        enableErrorRecovery: true
      }
    );
    
    console.log('🔄 Running complete pipeline with bulk loading...');
    
    // Progress tracking for the entire pipeline
    const pipelineProgressCallback = (progress: BulkLoadingProgress) => {
      console.log(`🔄 Pipeline Progress: ${progress.processedProducts}/${progress.totalProducts}`);
      console.log(`   Current Phase: Bulk Loading with Embeddings`);
      console.log(`   Quality Score: ${progress.qualityScore.toFixed(2)}`);
    };
    
    // Run complete pipeline with bulk loading
    const pipelineResult = await pipeline.processDataWithBulkLoading(pipelineProgressCallback);
    
    console.log('\n✅ Complete Pipeline Results:');
    console.log(`Overall Success: ${pipelineResult.success}`);
    console.log(`Products Extracted: ${pipelineResult.extractionStats.totalProducts}`);
    console.log(`Products Filtered: ${pipelineResult.filterStats.selected}`);
    console.log(`Products Loaded: ${pipelineResult.bulkLoadingStats.successfulProducts}`);
    console.log(`Dietary Flags Derived: ${pipelineResult.dietaryStats.processed}`);
    console.log(`Final Quality Score: ${pipelineResult.qualityAssurance.overallScore.toFixed(2)}`);
    
    // Performance summary
    console.log('\n⚡ Performance Summary:');
    console.log(`Total Processing Time: ${pipelineResult.bulkLoadingStats.totalProcessingTime / 1000}s`);
    console.log(`End-to-End Throughput: ${pipelineResult.bulkLoadingStats.performanceMetrics.productsPerSecond.toFixed(1)} products/sec`);
    console.log(`Embeddings Generated: ${pipelineResult.bulkLoadingStats.embeddingsGenerated}`);
    
  } catch (error) {
    console.error('❌ Pipeline integration failed:', error);
  }
}

/**
 * Example 5: Quick Bulk Loading for Simple Use Cases
 */
export async function quickBulkLoadingExample(): Promise<void> {
  console.log('\n⚡ Example 5: Quick Bulk Loading for Simple Use Cases');
  console.log('=' .repeat(60));
  
  // Simple product dataset
  const simpleProducts: CreateProductInput[] = [
    {
      code: '5555555555555',
      product_name: 'Simple Snack',
      ingredients_text: 'corn, salt, oil',
      allergens_tags: [],
      data_quality_score: 0.8,
      source: 'manual',
      dietary_flags: {
        vegan: true,
        vegetarian: true,
        gluten_free: true,
        kosher: false,
        halal: false
      }
    }
  ];
  
  try {
    console.log('🚀 Using quick bulk loading function...');
    
    const success = await bulkLoadProductsQuick(simpleProducts, 10);
    
    console.log(`✅ Quick bulk loading result: ${success ? 'SUCCESS' : 'FAILED'}`);
    
  } catch (error) {
    console.error('❌ Quick bulk loading failed:', error);
  }
}

/**
 * Helper function to generate large product dataset for testing
 */
function generateLargeProductDataset(count: number): CreateProductInput[] {
  const products: CreateProductInput[] = [];
  
  const sampleIngredients = [
    'wheat flour, sugar, eggs, butter',
    'rice, vegetables, salt, oil',
    'milk, chocolate, cocoa, vanilla',
    'oats, honey, nuts, dried fruit',
    'tomatoes, basil, garlic, olive oil'
  ];
  
  const sampleAllergens = [
    ['en:gluten', 'en:eggs'],
    [],
    ['en:milk'],
    ['en:nuts'],
    []
  ];
  
  for (let i = 0; i < count; i++) {
    const ingredientIndex = i % sampleIngredients.length;
    
    products.push({
      code: `${1000000000000 + i}`,
      product_name: `Generated Product ${i + 1}`,
      ingredients_text: sampleIngredients[ingredientIndex],
      allergens_tags: sampleAllergens[ingredientIndex],
      data_quality_score: 0.7 + (Math.random() * 0.3), // Random score between 0.7-1.0
      source: 'openfoodfacts',
      dietary_flags: {
        vegan: Math.random() > 0.5,
        vegetarian: Math.random() > 0.3,
        gluten_free: Math.random() > 0.6,
        kosher: Math.random() > 0.8,
        halal: Math.random() > 0.8
      }
    });
  }
  
  return products;
}

/**
 * Main function to run all examples
 */
export async function runAllBulkLoadingExamples(): Promise<void> {
  console.log('🎯 BulkDataLoader Examples - Task 3.3 Implementation');
  console.log('=' .repeat(80));
  console.log('Demonstrating bulk data loading with vector embeddings integration\n');
  
  try {
    await basicBulkLoadingExample();
    await advancedBulkLoadingExample();
    await errorRecoveryExample();
    await pipelineIntegrationExample();
    await quickBulkLoadingExample();
    
    console.log('\n🎉 All bulk loading examples completed successfully!');
    console.log('\n📋 Summary of Features Demonstrated:');
    console.log('   ✅ Embedding generation integration');
    console.log('   ✅ Efficient bulk insert operations');
    console.log('   ✅ Progress tracking and monitoring');
    console.log('   ✅ Error recovery and retry logic');
    console.log('   ✅ Data validation and quality assurance');
    console.log('   ✅ Memory management and optimization');
    console.log('   ✅ Performance metrics and analysis');
    console.log('   ✅ Pipeline integration');
    
  } catch (error) {
    console.error('❌ Examples execution failed:', error);
  }
}

// Export for direct execution
if (require.main === module) {
  runAllBulkLoadingExamples().catch(console.error);
}