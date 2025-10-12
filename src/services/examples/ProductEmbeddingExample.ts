/**
 * Product Embedding Generation Example
 * Demonstrates the enhanced embedding generation for product data
 * with text normalization, quality validation, and consistency checks
 */

import { HuggingFaceEmbeddingService } from '../EmbeddingService';
import { EmbeddingRequest } from '../../types/EmbeddingService';

async function demonstrateProductEmbeddings() {
  console.log('🍪 Product Embedding Generation Demo');
  console.log('=' .repeat(50));

  // Initialize the embedding service
  const embeddingService = new HuggingFaceEmbeddingService({
    service_script_path: '../../../embedding_service_interface.py',
    timeout_seconds: 30,
    cache_config: {
      max_entries: 1000,
      ttl_hours: 24,
      cleanup_interval_minutes: 60,
      memory_limit_mb: 50
    }
  });

  try {
    // Initialize the service
    console.log('\n🔧 Initializing embedding service...');
    await embeddingService.initialize();
    console.log('✅ Service initialized successfully');

    // Get model information
    const modelInfo = await embeddingService.getModelInfo();
    console.log('\n📊 Model Information:');
    console.log(`Model: ${modelInfo.model_name}`);
    console.log(`Dimensions: ${modelInfo.embedding_dimension}`);
    console.log(`Max Sequence Length: ${modelInfo.max_sequence_length}`);

    // Example 1: Ingredient Text Embedding with Normalization
    console.log('\n🥄 Example 1: Ingredient Text Embedding');
    console.log('-'.repeat(40));
    
    const ingredientTexts = [
      'WHEAT FLOUR, SUGAR, CHOCOLATE CHIPS (SUGAR, CHOCOLATE, COCOA BUTTER), EGGS, BUTTER, VANILLA EXTRACT',
      'Organic almonds, sea salt, natural flavoring',
      'ingredients: milk chocolate, cocoa butter, sugar, milk powder, soy lecithin',
      'Contains: wheat flour, cane sugar, eggs, may contain: tree nuts'
    ];

    for (const ingredientText of ingredientTexts) {
      console.log(`\nOriginal: ${ingredientText}`);
      
      const embedding = await embeddingService.generateIngredientEmbedding(ingredientText);
      
      if (embedding) {
        console.log(`✅ Generated embedding: ${embedding.length} dimensions`);
        console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
        console.log(`   Magnitude: ${Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0)).toFixed(4)}`);
      } else {
        console.log('❌ Failed to generate embedding');
      }
    }

    // Example 2: Product Name Embedding with Normalization
    console.log('\n🏷️ Example 2: Product Name Embedding');
    console.log('-'.repeat(40));
    
    const productNames = [
      'Oreo Original Chocolate Sandwich Cookies',
      'PEPPERIDGE FARM Goldfish Crackers - Cheddar',
      'Lay\'s Classic Potato Chips',
      'Ben & Jerry\'s Chocolate Chip Cookie Dough Ice Cream',
      'Kellogg\'s Frosted Flakes Cereal'
    ];

    for (const productName of productNames) {
      console.log(`\nProduct: ${productName}`);
      
      const embedding = await embeddingService.generateProductNameEmbedding(productName);
      
      if (embedding) {
        console.log(`✅ Generated embedding: ${embedding.length} dimensions`);
        console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
      } else {
        console.log('❌ Failed to generate embedding');
      }
    }

    // Example 3: Allergen Profile Embedding
    console.log('\n⚠️ Example 3: Allergen Profile Embedding');
    console.log('-'.repeat(40));
    
    const allergenProfiles = [
      ['en:wheat', 'en:eggs', 'en:milk'],
      ['tree-nuts', 'peanuts'],
      'contains: soy, may contain: sesame',
      ['en:fish', 'en:shellfish'],
      [] // No allergens
    ];

    for (const allergens of allergenProfiles) {
      console.log(`\nAllergens: ${Array.isArray(allergens) ? allergens.join(', ') : allergens || 'none'}`);
      
      try {
        // Handle empty allergen case
        const allergenInput = (Array.isArray(allergens) && allergens.length === 0) ? 'no known allergens' : allergens;
        const embedding = await embeddingService.generateAllergenEmbedding(allergenInput);
        
        if (embedding) {
          console.log(`✅ Generated embedding: ${embedding.length} dimensions`);
          console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
        } else {
          console.log('❌ Failed to generate embedding');
        }
      } catch (error) {
        console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Example 4: Batch Processing with Mixed Types
    console.log('\n📦 Example 4: Batch Processing');
    console.log('-'.repeat(40));
    
    const batchRequests: EmbeddingRequest[] = [
      {
        id: 'ingredient_1',
        text: 'organic wheat flour, brown sugar, dark chocolate chips',
        type: 'ingredient'
      },
      {
        id: 'product_1',
        text: 'Organic Dark Chocolate Chip Cookies',
        type: 'product_name'
      },
      {
        id: 'allergen_1',
        text: 'wheat, milk, soy',
        type: 'allergen'
      },
      {
        id: 'ingredient_2',
        text: 'almonds, sea salt, rosemary extract',
        type: 'ingredient'
      },
      {
        id: 'product_2',
        text: 'Rosemary Roasted Almonds',
        type: 'product_name'
      }
    ];

    console.log(`\nProcessing ${batchRequests.length} embedding requests...`);
    
    const startTime = Date.now();
    const responses = await embeddingService.generateEmbeddingsBatch(batchRequests);
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Batch processing completed in ${processingTime}ms`);
    console.log(`   Average time per embedding: ${(processingTime / responses.length).toFixed(1)}ms`);
    
    let successCount = 0;
    let cachedCount = 0;
    
    for (const response of responses) {
      if (response.success) {
        successCount++;
        if (response.cached) {
          cachedCount++;
        }
        console.log(`   ${response.id}: ✅ ${response.cached ? '(cached)' : '(generated)'}`);
      } else {
        console.log(`   ${response.id}: ❌ ${response.error}`);
      }
    }
    
    console.log(`\nBatch Results:`);
    console.log(`   Success rate: ${successCount}/${responses.length} (${(successCount/responses.length*100).toFixed(1)}%)`);
    console.log(`   Cache hit rate: ${cachedCount}/${successCount} (${successCount > 0 ? (cachedCount/successCount*100).toFixed(1) : 0}%)`);

    // Example 5: Quality Validation Demo
    console.log('\n🔍 Example 5: Quality Validation');
    console.log('-'.repeat(40));
    
    const testCases = [
      { text: '', type: 'ingredient', expected: 'fail' },
      { text: 'a', type: 'ingredient', expected: 'pass' },
      { text: 'product', type: 'product_name', expected: 'fail' }, // Too generic
      { text: 'Delicious Chocolate Cookies', type: 'product_name', expected: 'pass' },
      { text: 'invalid allergen format', type: 'allergen', expected: 'pass' }, // Will be normalized
    ];

    for (const testCase of testCases) {
      console.log(`\nTesting: "${testCase.text}" (${testCase.type})`);
      
      try {
        let embedding;
        switch (testCase.type) {
          case 'ingredient':
            embedding = await embeddingService.generateIngredientEmbedding(testCase.text);
            break;
          case 'product_name':
            embedding = await embeddingService.generateProductNameEmbedding(testCase.text);
            break;
          case 'allergen':
            embedding = await embeddingService.generateAllergenEmbedding(testCase.text);
            break;
        }
        
        if (embedding) {
          console.log(`✅ Generated valid embedding (${embedding.length} dims)`);
        } else {
          console.log(`❌ Validation failed or generation error`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Display service statistics
    console.log('\n📈 Service Statistics');
    console.log('-'.repeat(40));
    
    const stats = embeddingService.getStats();
    console.log(`Total requests: ${stats.total_requests}`);
    console.log(`Cache hits: ${stats.cache_hits}`);
    console.log(`Cache misses: ${stats.cache_misses}`);
    console.log(`Cache hit rate: ${stats.total_requests > 0 ? (stats.cache_hits / stats.total_requests * 100).toFixed(1) : 0}%`);
    console.log(`Average generation time: ${stats.average_generation_time.toFixed(1)}ms`);
    console.log(`Batch processing rate: ${stats.batch_processing_rate.toFixed(1)} items/sec`);
    console.log(`Error count: ${stats.error_count}`);
    
    const cacheStats = embeddingService.getCacheStats();
    console.log(`\nCache Statistics:`);
    console.log(`Cache size: ${cacheStats.size} entries`);
    console.log(`Memory usage: ${cacheStats.memory_usage_mb.toFixed(1)} MB`);
    console.log(`Cache hit rate: ${(cacheStats.hit_rate * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Cleanup
    await embeddingService.shutdown();
    console.log('\n🔧 Service shutdown complete');
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateProductEmbeddings()
    .then(() => {
      console.log('\n🎉 Product embedding demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateProductEmbeddings };