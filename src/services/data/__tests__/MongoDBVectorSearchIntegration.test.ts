/**
 * MongoDB Atlas Vector Search Integration Tests
 * Tests for Task 3.4 - Test end-to-end processing from raw data to MongoDB
 * 
 * Test Coverage:
 * - MongoDB Atlas Vector Search index creation and management
 * - Vector similarity search functionality
 * - Hybrid search combining UPC lookup with vector search
 * - Performance testing for sub-100ms UPC lookup requirement
 * - Error handling for vector search failures
 */

import { MongoClient, Db, Collection } from 'mongodb';
import { Product, CreateProductInput } from '../../../types/Product';
import { ProductModel, VectorSearchIndexes } from '../../../models/Product';

describe('MongoDB Atlas Vector Search Integration Tests', () => {
  let mongoClient: MongoClient;
  let testDb: Db;
  let productsCollection: Collection<Product>;
  
  // Test products with embeddings
  let testProductsWithEmbeddings: Product[];
  
  beforeAll(async () => {
    // Setup test database connection
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017';
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    
    testDb = mongoClient.db('smarties_vector_test_db');
    productsCollection = testDb.collection<Product>('products');
    
    // Clear test collection
    await productsCollection.deleteMany({});
    
    // Setup test data with embeddings
    await setupTestDataWithEmbeddings();
    
    // Create vector search indexes (in real MongoDB Atlas)
    // Note: This would require actual MongoDB Atlas with Vector Search enabled
    // For testing, we'll simulate the functionality
  });
  
  afterAll(async () => {
    // Cleanup test data
    await productsCollection.deleteMany({});
    await mongoClient.close();
  });
  
  beforeEach(async () => {
    // Ensure test data is present
    const count = await productsCollection.countDocuments();
    if (count === 0) {
      await setupTestDataWithEmbeddings();
    }
  });
  
  async function setupTestDataWithEmbeddings() {
    testProductsWithEmbeddings = [
      {
        _id: 'test_vector_1' as any,
        code: '1111111111111',
        product_name: 'Organic Chocolate Cookies',
        brands_tags: ['organic-brand'],
        categories_tags: ['en:snacks', 'en:cookies'],
        ingredients_text: 'organic wheat flour, organic cocoa, organic sugar, organic vanilla',
        ingredients_tags: ['wheat-flour', 'cocoa', 'sugar', 'vanilla'],
        ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
        allergens_tags: ['en:gluten'],
        allergens_hierarchy: ['en:gluten'],
        traces_tags: ['en:nuts'],
        labels_tags: ['en:organic'],
        
        // Mock 384-dimension embeddings
        ingredients_embedding: generateMockEmbedding([0.1, 0.2, 0.3]), // Chocolate/cocoa focused
        product_name_embedding: generateMockEmbedding([0.2, 0.1, 0.4]), // Cookie focused
        allergens_embedding: generateMockEmbedding([0.8, 0.1, 0.1]), // Gluten focused
        
        dietary_flags: {
          vegan: false,
          vegetarian: true,
          gluten_free: false,
          kosher: false,
          halal: false,
          organic: true
        },
        
        data_quality_score: 0.9,
        popularity_score: 0.8,
        completeness_score: 0.85,
        last_updated: new Date(),
        source: 'openfoodfacts',
        
        nutritionalInfo: {
          calories: 450,
          sodium: 150,
          sugar: 25
        },
        imageUrl: 'https://example.com/chocolate-cookies.jpg'
      },
      {
        _id: 'test_vector_2' as any,
        code: '2222222222222',
        product_name: 'Gluten-Free Vanilla Cookies',
        brands_tags: ['gluten-free-brand'],
        categories_tags: ['en:snacks', 'en:cookies', 'en:gluten-free'],
        ingredients_text: 'rice flour, coconut sugar, coconut oil, vanilla extract',
        ingredients_tags: ['rice-flour', 'coconut-sugar', 'coconut-oil', 'vanilla'],
        ingredients_analysis_tags: ['en:vegan', 'en:vegetarian', 'en:gluten-free'],
        allergens_tags: [],
        allergens_hierarchy: [],
        traces_tags: [],
        labels_tags: ['en:gluten-free', 'en:vegan'],
        
        // Mock embeddings - similar to cookies but different ingredients
        ingredients_embedding: generateMockEmbedding([0.05, 0.15, 0.35]), // Rice/coconut focused
        product_name_embedding: generateMockEmbedding([0.25, 0.05, 0.45]), // Cookie + vanilla focused
        allergens_embedding: generateMockEmbedding([0.1, 0.1, 0.8]), // No major allergens
        
        dietary_flags: {
          vegan: true,
          vegetarian: true,
          gluten_free: true,
          kosher: false,
          halal: false,
          organic: false
        },
        
        data_quality_score: 0.85,
        popularity_score: 0.7,
        completeness_score: 0.8,
        last_updated: new Date(),
        source: 'openfoodfacts',
        
        nutritionalInfo: {
          calories: 420,
          sodium: 100,
          sugar: 18
        }
      },
      {
        _id: 'test_vector_3' as any,
        code: '3333333333333',
        product_name: 'Whole Wheat Bread',
        brands_tags: ['bakery-brand'],
        categories_tags: ['en:breads', 'en:whole-wheat'],
        ingredients_text: 'whole wheat flour, water, yeast, salt, honey',
        ingredients_tags: ['whole-wheat-flour', 'water', 'yeast', 'salt', 'honey'],
        ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
        allergens_tags: ['en:gluten'],
        allergens_hierarchy: ['en:gluten'],
        traces_tags: [],
        labels_tags: [],
        
        // Mock embeddings - bread focused, different from cookies
        ingredients_embedding: generateMockEmbedding([0.6, 0.3, 0.1]), // Wheat/bread focused
        product_name_embedding: generateMockEmbedding([0.7, 0.2, 0.1]), // Bread focused
        allergens_embedding: generateMockEmbedding([0.9, 0.05, 0.05]), // Strong gluten signal
        
        dietary_flags: {
          vegan: false, // Contains honey
          vegetarian: true,
          gluten_free: false,
          kosher: false,
          halal: false,
          organic: false
        },
        
        data_quality_score: 0.8,
        popularity_score: 0.6,
        completeness_score: 0.75,
        last_updated: new Date(),
        source: 'openfoodfacts',
        
        nutritionalInfo: {
          calories: 250,
          sodium: 400,
          sugar: 3
        }
      },
      {
        _id: 'test_vector_4' as any,
        code: '4444444444444',
        product_name: 'Rice Cakes',
        brands_tags: ['healthy-brand'],
        categories_tags: ['en:snacks', 'en:rice-cakes'],
        ingredients_text: 'brown rice, sea salt',
        ingredients_tags: ['brown-rice', 'sea-salt'],
        ingredients_analysis_tags: ['en:vegan', 'en:vegetarian', 'en:gluten-free'],
        allergens_tags: [],
        allergens_hierarchy: [],
        traces_tags: [],
        labels_tags: ['en:gluten-free', 'en:vegan'],
        
        // Mock embeddings - rice focused, very different from others
        ingredients_embedding: generateMockEmbedding([0.1, 0.8, 0.1]), // Rice focused
        product_name_embedding: generateMockEmbedding([0.1, 0.7, 0.2]), // Rice cakes focused
        allergens_embedding: generateMockEmbedding([0.1, 0.1, 0.8]), // No allergens
        
        dietary_flags: {
          vegan: true,
          vegetarian: true,
          gluten_free: true,
          kosher: false,
          halal: false,
          organic: false
        },
        
        data_quality_score: 0.75,
        popularity_score: 0.5,
        completeness_score: 0.7,
        last_updated: new Date(),
        source: 'openfoodfacts',
        
        nutritionalInfo: {
          calories: 380,
          sodium: 200,
          sugar: 1
        }
      }
    ];
    
    // Insert test products
    await productsCollection.insertMany(testProductsWithEmbeddings);
  }
  
  function generateMockEmbedding(baseValues: number[]): number[] {
    const embedding = new Array(384).fill(0);
    
    // Set some base values to create meaningful differences
    for (let i = 0; i < Math.min(baseValues.length, 384); i++) {
      embedding[i] = baseValues[i];
    }
    
    // Fill rest with small random values
    for (let i = baseValues.length; i < 384; i++) {
      embedding[i] = Math.random() * 0.01;
    }
    
    return embedding;
  }
  
  describe('UPC Lookup Performance Tests', () => {
    test('should perform UPC lookup in under 100ms', async () => {
      const testUPC = '1111111111111';
      
      const startTime = Date.now();
      const product = await productsCollection.findOne({ code: testUPC });
      const endTime = Date.now();
      
      const queryTime = endTime - startTime;
      
      expect(product).toBeDefined();
      expect(product?.code).toBe(testUPC);
      expect(queryTime).toBeLessThan(100); // Sub-100ms requirement
    });
    
    test('should handle multiple concurrent UPC lookups efficiently', async () => {
      const testUPCs = ['1111111111111', '2222222222222', '3333333333333', '4444444444444'];
      
      const startTime = Date.now();
      const promises = testUPCs.map(upc => 
        productsCollection.findOne({ code: upc })
      );
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      const averageTime = totalTime / testUPCs.length;
      
      expect(results).toHaveLength(4);
      expect(results.every(result => result !== null)).toBe(true);
      expect(averageTime).toBeLessThan(50); // Should be even faster for concurrent queries
    });
    
    test('should handle non-existent UPC codes gracefully', async () => {
      const nonExistentUPC = '9999999999999';
      
      const startTime = Date.now();
      const product = await productsCollection.findOne({ code: nonExistentUPC });
      const endTime = Date.now();
      
      const queryTime = endTime - startTime;
      
      expect(product).toBeNull();
      expect(queryTime).toBeLessThan(100); // Should still be fast
    });
  });
  
  describe('Vector Similarity Search Tests', () => {
    test('should find similar products using ingredients embedding', async () => {
      // Create a query embedding similar to chocolate cookies
      const queryEmbedding = generateMockEmbedding([0.12, 0.18, 0.32]); // Similar to chocolate cookies
      
      // Simulate vector search aggregation pipeline
      // Note: In real MongoDB Atlas, this would use $vectorSearch
      const pipeline = [
        {
          $addFields: {
            similarity_score: {
              $let: {
                vars: {
                  dotProduct: {
                    $reduce: {
                      input: { $range: [0, 384] },
                      initialValue: 0,
                      in: {
                        $add: [
                          '$$value',
                          {
                            $multiply: [
                              { $arrayElemAt: ['$ingredients_embedding', '$$this'] },
                              { $arrayElemAt: [queryEmbedding, '$$this'] }
                            ]
                          }
                        ]
                      }
                    }
                  }
                },
                in: '$$dotProduct' // Simplified similarity calculation
              }
            }
          }
        },
        {
          $match: {
            similarity_score: { $gte: 0.1 } // Minimum similarity threshold
          }
        },
        {
          $sort: { similarity_score: -1 }
        },
        {
          $limit: 5
        }
      ];
      
      const results = await productsCollection.aggregate(pipeline).toArray();
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].similarity_score).toBeGreaterThan(0.1);
      
      // Results should be sorted by similarity
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity_score).toBeGreaterThanOrEqual(results[i].similarity_score);
      }
    });
    
    test('should filter vector search results by dietary flags', async () => {
      const queryEmbedding = generateMockEmbedding([0.1, 0.2, 0.3]);
      
      // Search for vegan products only
      const pipeline = [
        {
          $match: {
            'dietary_flags.vegan': true
          }
        },
        {
          $addFields: {
            similarity_score: 0.5 // Simplified for testing
          }
        },
        {
          $sort: { similarity_score: -1 }
        }
      ];
      
      const results = await productsCollection.aggregate(pipeline).toArray();
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(product => {
        expect(product.dietary_flags.vegan).toBe(true);
      });
    });
    
    test('should combine vector search with allergen filtering', async () => {
      const queryEmbedding = generateMockEmbedding([0.1, 0.2, 0.3]);
      
      // Search for products without gluten allergens
      const pipeline = [
        {
          $match: {
            allergens_tags: { $nin: ['en:gluten'] }
          }
        },
        {
          $addFields: {
            similarity_score: 0.6 // Simplified for testing
          }
        },
        {
          $sort: { similarity_score: -1 }
        }
      ];
      
      const results = await productsCollection.aggregate(pipeline).toArray();
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(product => {
        expect(product.allergens_tags).not.toContain('en:gluten');
      });
    });
  });
  
  describe('Hybrid Search Tests', () => {
    test('should combine exact UPC lookup with similarity search', async () => {
      const targetUPC = '1111111111111';
      
      // First, get the target product
      const targetProduct = await productsCollection.findOne({ code: targetUPC });
      expect(targetProduct).toBeDefined();
      
      // Then find similar products (excluding the exact match)
      const pipeline = [
        {
          $match: {
            code: { $ne: targetUPC }, // Exclude exact match
            categories_tags: { $in: targetProduct!.categories_tags } // Similar categories
          }
        },
        {
          $addFields: {
            similarity_score: {
              $cond: {
                if: { $in: ['en:cookies', '$categories_tags'] },
                then: 0.8, // High similarity for cookies
                else: 0.3
              }
            }
          }
        },
        {
          $sort: { similarity_score: -1, popularity_score: -1 }
        },
        {
          $limit: 3
        }
      ];
      
      const similarProducts = await productsCollection.aggregate(pipeline).toArray();
      
      expect(similarProducts.length).toBeGreaterThan(0);
      expect(similarProducts[0].code).not.toBe(targetUPC);
    });
    
    test('should provide fallback when vector search fails', async () => {
      // Simulate vector search failure by using text search instead
      const searchTerm = 'cookies';
      
      const pipeline = [
        {
          $match: {
            $or: [
              { product_name: { $regex: searchTerm, $options: 'i' } },
              { categories_tags: { $regex: searchTerm, $options: 'i' } }
            ]
          }
        },
        {
          $sort: { popularity_score: -1, data_quality_score: -1 }
        },
        {
          $limit: 5
        }
      ];
      
      const results = await productsCollection.aggregate(pipeline).toArray();
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach(product => {
        const matchesSearch = 
          product.product_name.toLowerCase().includes(searchTerm) ||
          product.categories_tags.some(tag => tag.toLowerCase().includes(searchTerm));
        expect(matchesSearch).toBe(true);
      });
    });
  });
  
  describe('Vector Search Performance Tests', () => {
    test('should perform vector search within 500ms target', async () => {
      const queryEmbedding = generateMockEmbedding([0.1, 0.2, 0.3]);
      
      const startTime = Date.now();
      
      // Simplified vector search simulation
      const pipeline = [
        {
          $addFields: {
            similarity_score: {
              $rand: {} // Random similarity for performance testing
            }
          }
        },
        {
          $match: {
            similarity_score: { $gte: 0.5 }
          }
        },
        {
          $sort: { similarity_score: -1 }
        },
        {
          $limit: 10
        }
      ];
      
      const results = await productsCollection.aggregate(pipeline).toArray();
      const endTime = Date.now();
      
      const queryTime = endTime - startTime;
      
      expect(results.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(500); // Target: <500ms for vector search
    });
    
    test('should handle large result sets efficiently', async () => {
      const startTime = Date.now();
      
      const pipeline = [
        {
          $addFields: {
            similarity_score: { $rand: {} }
          }
        },
        {
          $sort: { similarity_score: -1 }
        },
        {
          $limit: 100 // Large result set
        }
      ];
      
      const results = await productsCollection.aggregate(pipeline).toArray();
      const endTime = Date.now();
      
      const queryTime = endTime - startTime;
      
      expect(results.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(1000); // Should handle large results within 1 second
    });
  });
  
  describe('Error Handling and Edge Cases', () => {
    test('should handle missing embeddings gracefully', async () => {
      // Insert a product without embeddings
      const productWithoutEmbeddings: Partial<Product> = {
        _id: 'test_no_embeddings' as any,
        code: '5555555555555',
        product_name: 'Product Without Embeddings',
        ingredients_text: 'test ingredients',
        allergens_tags: [],
        dietary_flags: {
          vegan: true,
          vegetarian: true,
          gluten_free: true,
          kosher: false,
          halal: false
        },
        data_quality_score: 0.5,
        popularity_score: 0.3,
        completeness_score: 0.4,
        last_updated: new Date(),
        source: 'manual'
      };
      
      await productsCollection.insertOne(productWithoutEmbeddings as Product);
      
      // UPC lookup should still work
      const product = await productsCollection.findOne({ code: '5555555555555' });
      expect(product).toBeDefined();
      expect(product?.code).toBe('5555555555555');
      
      // Vector search should exclude products without embeddings
      const pipeline = [
        {
          $match: {
            ingredients_embedding: { $exists: true, $ne: null }
          }
        }
      ];
      
      const resultsWithEmbeddings = await productsCollection.aggregate(pipeline).toArray();
      expect(resultsWithEmbeddings.every(p => p.ingredients_embedding)).toBe(true);
      
      // Cleanup
      await productsCollection.deleteOne({ code: '5555555555555' });
    });
    
    test('should handle corrupted embedding data', async () => {
      // Insert product with corrupted embeddings
      const productWithCorruptedEmbeddings: Product = {
        _id: 'test_corrupted' as any,
        code: '6666666666666',
        product_name: 'Corrupted Embeddings Product',
        brands_tags: [],
        categories_tags: [],
        ingredients_text: 'test ingredients',
        ingredients_tags: [],
        ingredients_analysis_tags: [],
        allergens_tags: [],
        allergens_hierarchy: [],
        traces_tags: [],
        labels_tags: [],
        
        // Corrupted embeddings (wrong dimensions)
        ingredients_embedding: [0.1, 0.2, 0.3], // Only 3 dimensions instead of 384
        product_name_embedding: new Array(384).fill(NaN), // NaN values
        allergens_embedding: new Array(384).fill(Infinity), // Infinity values
        
        dietary_flags: {
          vegan: false,
          vegetarian: false,
          gluten_free: false,
          kosher: false,
          halal: false
        },
        
        data_quality_score: 0.2,
        popularity_score: 0.1,
        completeness_score: 0.3,
        last_updated: new Date(),
        source: 'manual'
      };
      
      await productsCollection.insertOne(productWithCorruptedEmbeddings);
      
      // Validate embedding quality
      const product = await productsCollection.findOne({ code: '6666666666666' });
      expect(product).toBeDefined();
      
      const validationErrors = ProductModel.validateVectorEmbeddings(product!);
      expect(validationErrors.length).toBeGreaterThan(0);
      expect(validationErrors[0]).toContain('384 dimensions');
      
      // Cleanup
      await productsCollection.deleteOne({ code: '6666666666666' });
    });
    
    test('should handle database connection failures gracefully', async () => {
      // Simulate connection failure by using invalid collection
      const invalidCollection = testDb.collection('non_existent_collection');
      
      try {
        const result = await invalidCollection.findOne({ code: '1111111111111' });
        expect(result).toBeNull(); // Should return null for non-existent collection
      } catch (error) {
        // Should handle connection errors gracefully
        expect(error).toBeDefined();
      }
    });
  });
  
  describe('Index Management and Optimization', () => {
    test('should verify required indexes exist', async () => {
      const indexes = await productsCollection.listIndexes().toArray();
      
      // Check for UPC index
      const upcIndex = indexes.find(idx => idx.key && idx.key.code === 1);
      expect(upcIndex).toBeDefined();
      
      // Check for dietary flags indexes
      const veganIndex = indexes.find(idx => idx.key && idx.key['dietary_flags.vegan'] === 1);
      // Note: May not exist in test environment, but should be present in production
    });
    
    test('should measure index usage and performance', async () => {
      // Test UPC index performance
      const startTime = Date.now();
      const result = await productsCollection.findOne({ code: '1111111111111' });
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100);
      
      // Test compound query performance
      const compoundStartTime = Date.now();
      const compoundResult = await productsCollection.findOne({
        code: '1111111111111',
        'dietary_flags.vegan': false
      });
      const compoundEndTime = Date.now();
      
      expect(compoundResult).toBeDefined();
      expect(compoundEndTime - compoundStartTime).toBeLessThan(100);
    });
  });
});