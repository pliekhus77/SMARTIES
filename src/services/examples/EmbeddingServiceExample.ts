/**
 * Embedding Service Usage Examples
 * Demonstrates how to use the HuggingFace Embedding Service for SMARTIES
 */

import { embeddingService, createEmbeddingService } from '../EmbeddingService';
import { EmbeddingRequest } from '../../types/EmbeddingService';

/**
 * Example 1: Basic single embedding generation
 */
export async function basicEmbeddingExample(): Promise<void> {
  console.log('🔧 Basic Embedding Generation Example');
  console.log('=' * 50);

  try {
    // Initialize the service
    await embeddingService.initialize();
    console.log('✓ Embedding service initialized');

    // Generate ingredient embedding
    const ingredientsText = 'wheat flour, sugar, chocolate chips, eggs, butter, vanilla extract';
    const ingredientEmbedding = await embeddingService.generateIngredientEmbedding(ingredientsText);
    console.log(`✓ Ingredient embedding generated: ${ingredientEmbedding.length} dimensions`);

    // Generate product name embedding
    const productName = 'Chocolate Chip Cookies';
    const nameEmbedding = await embeddingService.generateProductNameEmbedding(productName);
    console.log(`✓ Product name embedding generated: ${nameEmbedding.length} dimensions`);

    // Generate allergen embedding
    const allergens = ['wheat', 'eggs', 'milk'];
    const allergenEmbedding = await embeddingService.generateAllergenEmbedding(allergens);
    console.log(`✓ Allergen embedding generated: ${allergenEmbedding.length} dimensions`);

    // Display statistics
    const stats = embeddingService.getStats();
    console.log('\n📊 Service Statistics:');
    console.log(`Total requests: ${stats.total_requests}`);
    console.log(`Cache hits: ${stats.cache_hits}`);
    console.log(`Cache misses: ${stats.cache_misses}`);
    console.log(`Average generation time: ${stats.average_generation_time.toFixed(2)}ms`);

  } catch (error) {
    console.error('❌ Error in basic embedding example:', error);
  }
}

/**
 * Example 2: Batch processing for multiple products
 */
export async function batchProcessingExample(): Promise<void> {
  console.log('\n🚀 Batch Processing Example');
  console.log('=' * 50);

  try {
    // Ensure service is initialized
    if (!embeddingService.isReady()) {
      await embeddingService.initialize();
    }

    // Prepare batch requests for multiple products
    const batchRequests: EmbeddingRequest[] = [
      {
        id: 'product_1_ingredients',
        text: 'organic almonds, sea salt',
        type: 'ingredient'
      },
      {
        id: 'product_1_name',
        text: 'Organic Salted Almonds',
        type: 'product_name'
      },
      {
        id: 'product_1_allergens',
        text: 'tree nuts',
        type: 'allergen'
      },
      {
        id: 'product_2_ingredients',
        text: 'milk chocolate, cocoa butter, sugar, milk powder',
        type: 'ingredient'
      },
      {
        id: 'product_2_name',
        text: 'Milk Chocolate Bar',
        type: 'product_name'
      },
      {
        id: 'product_2_allergens',
        text: 'milk, may contain nuts',
        type: 'allergen'
      }
    ];

    console.log(`Processing ${batchRequests.length} embedding requests...`);

    // Process batch with progress callback
    const responses = await embeddingService.generateEmbeddingsBatch(batchRequests, {
      batch_size: 3,
      progress_callback: (processed, total) => {
        console.log(`Progress: ${processed}/${total} (${Math.round(processed/total*100)}%)`);
      }
    });

    // Analyze results
    const successful = responses.filter(r => r.success);
    const cached = responses.filter(r => r.cached);
    const failed = responses.filter(r => !r.success);

    console.log(`\n✓ Batch processing completed:`);
    console.log(`  Successful: ${successful.length}/${responses.length}`);
    console.log(`  From cache: ${cached.length}/${responses.length}`);
    console.log(`  Failed: ${failed.length}/${responses.length}`);

    // Display failed requests if any
    if (failed.length > 0) {
      console.log('\n❌ Failed requests:');
      failed.forEach(response => {
        console.log(`  ${response.id}: ${response.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error in batch processing example:', error);
  }
}

/**
 * Example 3: Caching demonstration
 */
export async function cachingExample(): Promise<void> {
  console.log('\n💾 Caching Example');
  console.log('=' * 50);

  try {
    // Ensure service is initialized
    if (!embeddingService.isReady()) {
      await embeddingService.initialize();
    }

    const testText = 'wheat flour, sugar, eggs, butter';

    console.log('Generating embedding for the first time...');
    const startTime1 = Date.now();
    const embedding1 = await embeddingService.generateIngredientEmbedding(testText);
    const time1 = Date.now() - startTime1;
    console.log(`✓ First generation took ${time1}ms`);

    console.log('Generating same embedding again (should be cached)...');
    const startTime2 = Date.now();
    const embedding2 = await embeddingService.generateIngredientEmbedding(testText);
    const time2 = Date.now() - startTime2;
    console.log(`✓ Second generation took ${time2}ms`);

    // Verify embeddings are identical
    const identical = embedding1.length === embedding2.length && 
                     embedding1.every((val, idx) => val === embedding2[idx]);
    console.log(`✓ Embeddings identical: ${identical}`);
    console.log(`✓ Speed improvement: ${Math.round((time1 - time2) / time1 * 100)}%`);

    // Display cache statistics
    const cacheStats = embeddingService.getCacheStats();
    console.log('\n📊 Cache Statistics:');
    console.log(`  Size: ${cacheStats.size} entries`);
    console.log(`  Hit rate: ${(cacheStats.hit_rate * 100).toFixed(1)}%`);
    console.log(`  Memory usage: ${cacheStats.memory_usage_mb.toFixed(2)} MB`);

  } catch (error) {
    console.error('❌ Error in caching example:', error);
  }
}

/**
 * Example 4: Custom configuration
 */
export async function customConfigExample(): Promise<void> {
  console.log('\n⚙️ Custom Configuration Example');
  console.log('=' * 50);

  try {
    // Create service with custom configuration
    const customService = createEmbeddingService({
      batch_size: 16,
      timeout_seconds: 60,
      max_retries: 5,
      cache_config: {
        max_entries: 5000,
        ttl_hours: 12,
        cleanup_interval_minutes: 30,
        memory_limit_mb: 50
      }
    });

    await customService.initialize();
    console.log('✓ Custom embedding service initialized');

    // Get model information
    const modelInfo = await customService.getModelInfo();
    console.log('\n📋 Model Information:');
    console.log(`  Model: ${modelInfo.model_name}`);
    console.log(`  Dimensions: ${modelInfo.embedding_dimension}`);
    console.log(`  Max sequence length: ${modelInfo.max_sequence_length}`);
    console.log(`  Batch size: ${modelInfo.batch_size}`);
    console.log(`  CPU threads: ${modelInfo.cpu_threads}`);

    // Test with custom service
    const embedding = await customService.generateIngredientEmbedding('test ingredients');
    console.log(`✓ Generated embedding with ${embedding.length} dimensions`);

    // Cleanup
    await customService.shutdown();
    console.log('✓ Custom service shut down');

  } catch (error) {
    console.error('❌ Error in custom configuration example:', error);
  }
}

/**
 * Example 5: Error handling and recovery
 */
export async function errorHandlingExample(): Promise<void> {
  console.log('\n🛡️ Error Handling Example');
  console.log('=' * 50);

  try {
    // Ensure service is initialized
    if (!embeddingService.isReady()) {
      await embeddingService.initialize();
    }

    // Test validation errors
    console.log('Testing validation errors...');
    
    try {
      await embeddingService.generateIngredientEmbedding('');
      console.log('❌ Should have thrown validation error');
    } catch (error) {
      console.log('✓ Caught validation error for empty text');
    }

    try {
      await embeddingService.generateIngredientEmbedding('a'.repeat(1000));
      console.log('❌ Should have thrown validation error');
    } catch (error) {
      console.log('✓ Caught validation error for text too long');
    }

    // Test batch validation errors
    console.log('\nTesting batch validation errors...');
    
    const invalidBatch: EmbeddingRequest[] = [
      { id: '', text: 'test', type: 'ingredient' }, // Empty ID
      { id: '2', text: '', type: 'product_name' }, // Empty text
      { id: '2', text: 'duplicate', type: 'allergen' } // Duplicate ID
    ];

    try {
      await embeddingService.generateEmbeddingsBatch(invalidBatch);
      console.log('❌ Should have thrown batch validation error');
    } catch (error) {
      console.log('✓ Caught batch validation error');
    }

    console.log('\n✓ Error handling working correctly');

  } catch (error) {
    console.error('❌ Error in error handling example:', error);
  }
}

/**
 * Example 6: Product data processing workflow
 */
export async function productProcessingWorkflow(): Promise<void> {
  console.log('\n🏭 Product Processing Workflow Example');
  console.log('=' * 50);

  try {
    // Ensure service is initialized
    if (!embeddingService.isReady()) {
      await embeddingService.initialize();
    }

    // Simulate processing a batch of products from OpenFoodFacts
    const products = [
      {
        id: 'product_001',
        name: 'Organic Whole Wheat Bread',
        ingredients: 'organic whole wheat flour, water, organic cane sugar, yeast, sea salt',
        allergens: ['wheat', 'may contain sesame']
      },
      {
        id: 'product_002',
        name: 'Almond Milk Chocolate',
        ingredients: 'cocoa mass, almond milk powder, cocoa butter, organic cane sugar',
        allergens: ['tree nuts', 'may contain milk']
      },
      {
        id: 'product_003',
        name: 'Gluten-Free Pasta',
        ingredients: 'brown rice flour, quinoa flour, water, xanthan gum',
        allergens: []
      }
    ];

    console.log(`Processing ${products.length} products...`);

    // Create batch requests for all embeddings needed
    const allRequests: EmbeddingRequest[] = [];
    
    products.forEach(product => {
      allRequests.push(
        {
          id: `${product.id}_name`,
          text: product.name,
          type: 'product_name'
        },
        {
          id: `${product.id}_ingredients`,
          text: product.ingredients,
          type: 'ingredient'
        },
        {
          id: `${product.id}_allergens`,
          text: product.allergens.join(', ') || 'none',
          type: 'allergen'
        }
      );
    });

    // Process all embeddings in batch
    const startTime = Date.now();
    const responses = await embeddingService.generateEmbeddingsBatch(allRequests, {
      batch_size: 6, // Process 2 products at a time
      progress_callback: (processed, total) => {
        const percentage = Math.round(processed / total * 100);
        console.log(`  Progress: ${processed}/${total} (${percentage}%)`);
      }
    });
    const processingTime = Date.now() - startTime;

    // Organize results by product
    const productEmbeddings = new Map();
    
    responses.forEach(response => {
      if (response.success) {
        const [productId, embeddingType] = response.id.split('_');
        if (!productEmbeddings.has(productId)) {
          productEmbeddings.set(productId, {});
        }
        productEmbeddings.get(productId)[embeddingType] = response.embedding;
      }
    });

    console.log(`\n✓ Processing completed in ${processingTime}ms`);
    console.log(`✓ Generated embeddings for ${productEmbeddings.size} products`);
    console.log(`✓ Average time per product: ${Math.round(processingTime / products.length)}ms`);

    // Display final statistics
    const finalStats = embeddingService.getStats();
    console.log('\n📊 Final Statistics:');
    console.log(`  Total requests: ${finalStats.total_requests}`);
    console.log(`  Cache hit rate: ${Math.round(finalStats.cache_hits / finalStats.total_requests * 100)}%`);
    console.log(`  Average generation time: ${finalStats.average_generation_time.toFixed(2)}ms`);
    console.log(`  Error count: ${finalStats.error_count}`);

  } catch (error) {
    console.error('❌ Error in product processing workflow:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🧪 Running Embedding Service Examples');
  console.log('=' * 60);

  try {
    await basicEmbeddingExample();
    await batchProcessingExample();
    await cachingExample();
    await customConfigExample();
    await errorHandlingExample();
    await productProcessingWorkflow();

    console.log('\n🎉 All examples completed successfully!');
    
    // Cleanup
    await embeddingService.shutdown();
    console.log('✓ Service shut down cleanly');

  } catch (error) {
    console.error('❌ Error running examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}