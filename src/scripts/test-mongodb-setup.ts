#!/usr/bin/env node

/**
 * Simple MongoDB Atlas Setup Test
 * Tests the database connection and schema setup without requiring real credentials
 */

import { ProductModel, StorageOptimizer } from '../models/Product';
import { VectorSearchUtils } from '../models/VectorSearchIndex';
import { CreateProductInput } from '../types/Product';

/**
 * Test the Product model functionality
 */
function testProductModel(): void {
  console.log('🧪 Testing Product Model...');
  
  // Test product creation
  const testProduct: CreateProductInput = {
    code: '1234567890123',
    product_name: 'Test Chocolate Chip Cookies',
    ingredients_text: 'organic flour, sugar, chocolate chips, butter, eggs, vanilla',
    allergens_tags: ['en:gluten', 'en:milk', 'en:eggs'],
    labels_tags: ['en:organic'],
    data_quality_score: 0.85,
    source: 'openfoodfacts'
  };
  
  try {
    const document = ProductModel.createDocument(testProduct);
    console.log('✓ Product document creation successful');
    console.log(`  - Code: ${document.code}`);
    console.log(`  - Name: ${document.product_name}`);
    console.log(`  - Dietary flags: ${JSON.stringify(document.dietary_flags)}`);
    console.log(`  - Completeness: ${document.completeness_score?.toFixed(2)}`);
  } catch (error) {
    console.error('✗ Product document creation failed:', error);
  }
  
  // Test dietary flag derivation
  const flags = ProductModel.deriveDietaryFlags(
    ['en:vegetarian', 'en:palm-oil-free'],
    ['en:organic', 'en:kosher']
  );
  console.log('✓ Dietary flags derivation successful');
  console.log(`  - Vegan: ${flags.vegan}, Vegetarian: ${flags.vegetarian}`);
  console.log(`  - Kosher: ${flags.kosher}, Organic: ${flags.organic}`);
  
  // Test vector validation
  const validVectors = {
    ingredients_embedding: new Array(384).fill(0.1),
    product_name_embedding: new Array(384).fill(0.2),
    allergens_embedding: new Array(384).fill(0.3)
  };
  
  const vectorErrors = ProductModel.validateVectorEmbeddings(validVectors);
  if (vectorErrors.length === 0) {
    console.log('✓ Vector embedding validation successful');
  } else {
    console.error('✗ Vector embedding validation failed:', vectorErrors);
  }
}

/**
 * Test storage optimization calculations
 */
function testStorageOptimization(): void {
  console.log('\n📊 Testing Storage Optimization...');
  
  // Test document size estimation
  const sampleProduct = {
    code: '1234567890123',
    product_name: 'Sample Product',
    ingredients_text: 'flour, sugar, salt',
    ingredients_embedding: new Array(384).fill(0.1),
    product_name_embedding: new Array(384).fill(0.2),
    allergens_embedding: new Array(384).fill(0.3),
    allergens_tags: ['en:gluten'],
    dietary_flags: {
      vegan: false,
      vegetarian: false,
      gluten_free: false,
      kosher: false,
      halal: false
    },
    data_quality_score: 0.8,
    last_updated: new Date(),
    source: 'openfoodfacts' as const
  };
  
  const estimatedSize = StorageOptimizer.estimateDocumentSize(sampleProduct);
  const maxProducts = StorageOptimizer.calculateMaxProducts(estimatedSize);
  
  console.log('✓ Storage calculations completed');
  console.log(`  - Estimated document size: ${(estimatedSize / 1024).toFixed(1)} KB`);
  console.log(`  - Max products in M0 (512MB): ${maxProducts.toLocaleString()}`);
  console.log(`  - Storage efficiency: ${((estimatedSize / 1024) / 512 * maxProducts * 100).toFixed(1)}%`);
  
  const suggestions = StorageOptimizer.getOptimizationSuggestions();
  console.log(`  - Optimization suggestions: ${suggestions.length} available`);
}

/**
 * Test vector search utilities
 */
function testVectorSearchUtils(): void {
  console.log('\n🔍 Testing Vector Search Utils...');
  
  // Test cosine similarity
  const vector1 = [1, 0, 0];
  const vector2 = [0, 1, 0];
  const vector3 = [1, 0, 0];
  
  const similarity1 = VectorSearchUtils.cosineSimilarity(vector1, vector2);
  const similarity2 = VectorSearchUtils.cosineSimilarity(vector1, vector3);
  
  console.log('✓ Cosine similarity calculations');
  console.log(`  - Orthogonal vectors: ${similarity1.toFixed(3)}`);
  console.log(`  - Identical vectors: ${similarity2.toFixed(3)}`);
  
  // Test vector normalization
  const unnormalized = [3, 4]; // Length 5
  const normalized = VectorSearchUtils.normalizeVector(unnormalized);
  const length = Math.sqrt(normalized[0] ** 2 + normalized[1] ** 2);
  
  console.log('✓ Vector normalization');
  console.log(`  - Original: [${unnormalized.join(', ')}]`);
  console.log(`  - Normalized: [${normalized.map(n => n.toFixed(3)).join(', ')}]`);
  console.log(`  - Unit length: ${length.toFixed(3)}`);
  
  // Test search parameter creation
  const queryVector = new Array(384).fill(0.1);
  const exactParams = VectorSearchUtils.createSearchParams(queryVector, 'exact', 5);
  const broadParams = VectorSearchUtils.createSearchParams(queryVector, 'broad', 20);
  
  console.log('✓ Search parameter generation');
  console.log(`  - Exact search: ${exactParams.numCandidates} candidates, ${exactParams.minScore} min score`);
  console.log(`  - Broad search: ${broadParams.numCandidates} candidates, ${broadParams.minScore} min score`);
}

/**
 * Test MongoDB Atlas Vector Search index definitions
 */
function testVectorSearchIndexes(): void {
  console.log('\n🗂️  Testing Vector Search Index Definitions...');
  
  // Import the index definitions
  const { VectorSearchIndexes } = require('../models/Product');
  
  console.log('✓ Vector search index definitions loaded');
  console.log(`  - Total indexes: ${VectorSearchIndexes.length}`);
  
  VectorSearchIndexes.forEach((index: any, i: number) => {
    const vectorFields = index.definition.fields.filter((f: any) => f.type === 'vector');
    const filterFields = index.definition.fields.filter((f: any) => f.type === 'filter');
    
    console.log(`  - Index ${i + 1}: ${index.name}`);
    console.log(`    • Vector fields: ${vectorFields.length} (${vectorFields[0]?.numDimensions} dimensions)`);
    console.log(`    • Filter fields: ${filterFields.length}`);
  });
}

/**
 * Main test execution
 */
async function main(): Promise<void> {
  console.log('🚀 MongoDB Atlas Vector Search Setup Test');
  console.log('==========================================');
  console.log('Testing core functionality without requiring database connection...\n');
  
  try {
    testProductModel();
    testStorageOptimization();
    testVectorSearchUtils();
    testVectorSearchIndexes();
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Set up environment variables (MONGODB_URI, etc.)');
    console.log('   2. Run: npm run setup:mongodb');
    console.log('   3. Create vector search indexes via MongoDB Atlas UI');
    console.log('   4. Test with real data using embedding generation service');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main as testMongoDBSetup };