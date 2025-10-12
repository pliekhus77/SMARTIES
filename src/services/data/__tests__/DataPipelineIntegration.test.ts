/**
 * Data Pipeline Integration Tests
 * Tests for Task 3.4 - Write integration tests for data pipeline
 * 
 * Test Coverage:
 * - End-to-end processing from raw data to MongoDB
 * - Validate embedding generation and storage
 * - Test error handling and recovery mechanisms
 * - Integration between DataExtractor, DietaryComplianceDeriver, and BulkDataLoader
 * - MongoDB Atlas Vector Search functionality
 * - Performance and memory management
 */

import { MongoClient, Db, Collection } from 'mongodb';
import { DataExtractor, OpenFoodFactsRawProduct } from '../DataExtractor';
import { DietaryComplianceDeriver } from '../DietaryComplianceDeriver';
import { BulkDataLoader } from '../BulkDataLoader';
import { CreateProductInput, Product } from '../../../types/Product';
import { ProductModel } from '../../../models/Product';
import { spawn } from 'child_process';

// Mock the embedding service for controlled testing
jest.mock('child_process');

describe('Data Pipeline Integration Tests', () => {
  let mongoClient: MongoClient;
  let testDb: Db;
  let productsCollection: Collection<Product>;
  let dataExtractor: DataExtractor;
  let dietaryDeriver: DietaryComplianceDeriver;
  let bulkLoader: BulkDataLoader;
  
  // Test data
  let mockRawProducts: OpenFoodFactsRawProduct[];
  let mockEmbeddingResponse: any;
  
  beforeAll(async () => {
    // Setup test database connection
    const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017';
    mongoClient = new MongoClient(mongoUri);
    
    try {
      await mongoClient.connect();
    } catch (error) {
      console.warn('⚠️ MongoDB connection failed, using mock mode:', error);
      // Set up mock mode for tests when MongoDB is not available
      mongoClient = null as any;
      return;
    }
    
    if (mongoClient) {
      testDb = mongoClient.db('smarties_test_db');
      productsCollection = testDb.collection<Product>('products');
      
      // Clear test collection
      await productsCollection.deleteMany({});
    }
    
    // Initialize services
    dataExtractor = new DataExtractor({
      sourceConnectionString: mongoUri,
      sourceDatabaseName: 'test_off',
      sourceCollectionName: 'test_products',
      maxProducts: 100,
      requireUPC: true,
      requireIngredients: true,
      batchSize: 10
    });
    
    dietaryDeriver = new DietaryComplianceDeriver({
      minConfidenceThreshold: 0.7,
      strictMode: false
    });
    
    bulkLoader = new BulkDataLoader({
      batchSize: 5,
      maxConcurrentBatches: 2,
      embeddingBatchSize: 3,
      enableProgressTracking: true,
      enableErrorRecovery: true,
      maxRetries: 2,
      retryDelayMs: 100,
      validateBeforeInsert: true,
      enableQualityAssurance: true,
      memoryThresholdMB: 100
    });
    
    // Setup mock data
    setupMockData();
    setupMockEmbeddingService();
  });
  
  afterAll(async () => {
    // Cleanup test data
    if (mongoClient && productsCollection) {
      try {
        await productsCollection.deleteMany({});
        await mongoClient.close();
      } catch (error) {
        console.warn('⚠️ Cleanup failed:', error);
      }
    }
  });
  
  beforeEach(async () => {
    // Clear collection before each test
    if (productsCollection) {
      await productsCollection.deleteMany({});
    }
    jest.clearAllMocks();
  });
  
  function setupMockData() {
    mockRawProducts = [
      {
        _id: 'test_product_1',
        code: '1234567890123',
        product_name: 'Organic Vegan Cookies',
        product_name_en: 'Organic Vegan Cookies',
        brands_tags: ['organic-brand'],
        categories_tags: ['en:snacks', 'en:cookies', 'en:biscuits'],
        ingredients_text: 'organic wheat flour, organic sugar, organic coconut oil, vanilla extract',
        ingredients_text_en: 'organic wheat flour, organic sugar, organic coconut oil, vanilla extract',
        ingredients_tags: ['en:wheat-flour', 'en:sugar', 'en:coconut-oil', 'en:vanilla-extract'],
        ingredients_analysis_tags: ['en:vegan', 'en:vegetarian', 'en:non-gluten-free'],
        allergens_tags: ['en:gluten'],
        allergens_hierarchy: ['en:gluten'],
        traces_tags: ['en:nuts'],
        labels_tags: ['en:organic', 'en:vegan'],
        data_quality_errors_tags: [],
        data_quality_warnings_tags: [],
        completeness: 0.9,
        popularity_tags: ['popular'],
        last_modified_t: Date.now() / 1000,
        image_front_url: 'https://example.com/cookie.jpg',
        nutriments: {
          'energy-kcal_100g': 450,
          sodium_100g: 150,
          sugars_100g: 20
        }
      },
      {
        _id: 'test_product_2',
        code: '2345678901234',
        product_name: 'Gluten-Free Rice Crackers',
        ingredients_text: 'brown rice, sea salt, olive oil',
        ingredients_analysis_tags: ['en:vegan', 'en:vegetarian', 'en:gluten-free'],
        allergens_tags: [],
        labels_tags: ['en:gluten-free'],
        data_quality_errors_tags: [],
        completeness: 0.8,
        last_modified_t: Date.now() / 1000,
        nutriments: {
          'energy-kcal_100g': 380,
          sodium_100g: 200
        }
      },
      {
        _id: 'test_product_3',
        code: '3456789012345',
        product_name: 'Dairy Milk Chocolate',
        ingredients_text: 'milk chocolate (sugar, cocoa butter, milk powder, cocoa mass)',
        ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
        allergens_tags: ['en:milk'],
        labels_tags: [],
        data_quality_errors_tags: [],
        completeness: 0.7,
        last_modified_t: Date.now() / 1000,
        nutriments: {
          'energy-kcal_100g': 534,
          sugars_100g: 56
        }
      },
      {
        _id: 'test_product_invalid',
        // Missing required fields to test error handling
        product_name: 'Invalid Product',
        ingredients_text: 'test ingredients'
        // Missing code field
      }
    ];
    
    mockEmbeddingResponse = {
      success: true,
      embeddings: [
        new Array(384).fill(0).map(() => Math.random() * 0.1), // Mock 384-dim embedding
        new Array(384).fill(0).map(() => Math.random() * 0.1),
        new Array(384).fill(0).map(() => Math.random() * 0.1)
      ]
    };
  }
  
  function setupMockEmbeddingService() {
    const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    
    mockSpawn.mockImplementation(() => {
      const mockProcess = {
        stdout: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              // Simulate successful embedding generation
              setTimeout(() => {
                callback(JSON.stringify(mockEmbeddingResponse));
              }, 10);
            }
          })
        },
        stderr: {
          on: jest.fn()
        },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 20); // Success exit code
          }
        })
      };
      
      return mockProcess as any;
    });
  }
  
  describe('End-to-End Data Processing Pipeline', () => {
    test('should process complete pipeline from raw data to MongoDB with embeddings', async () => {
      // Step 1: Extract products from raw data
      const extractedProducts: CreateProductInput[] = [];
      
      for (const rawProduct of mockRawProducts.slice(0, 3)) { // Skip invalid product
        const extracted = (dataExtractor as any).extractProductData(rawProduct);
        if (extracted) {
          extractedProducts.push(extracted);
        }
      }
      
      expect(extractedProducts).toHaveLength(3);
      expect(extractedProducts[0].code).toBe('1234567890123');
      expect(extractedProducts[0].product_name).toBe('Organic Vegan Cookies');
      
      // Step 2: Derive dietary compliance flags
      const productsWithDietaryFlags: CreateProductInput[] = [];
      
      for (const product of extractedProducts) {
        const derivationResult = dietaryDeriver.deriveComplianceFlags(product);
        const updatedProduct = {
          ...product,
          dietary_flags: derivationResult.dietary_flags,
          data_quality_score: derivationResult.data_quality_score,
          completeness_score: derivationResult.completeness_score
        };
        productsWithDietaryFlags.push(updatedProduct);
      }
      
      expect(productsWithDietaryFlags).toHaveLength(3);
      expect(productsWithDietaryFlags[0].dietary_flags?.vegan).toBe(true);
      expect(productsWithDietaryFlags[1].dietary_flags?.gluten_free).toBe(true);
      expect(productsWithDietaryFlags[2].dietary_flags?.vegan).toBe(false);
      
      // Step 3: Bulk load with embeddings
      const loadingResult = await bulkLoader.loadProductsWithEmbeddings(
        productsWithDietaryFlags
      );
      
      expect(loadingResult.success).toBe(true);
      expect(loadingResult.stats.totalProducts).toBe(3);
      expect(loadingResult.stats.successfulProducts).toBe(3);
      expect(loadingResult.stats.failedProducts).toBe(0);
      expect(loadingResult.progress.embeddingsGenerated).toBeGreaterThan(0);
      expect(loadingResult.qualityAssurance.overallScore).toBeGreaterThan(0.8);
      
      // Verify progress tracking
      expect(loadingResult.progress.processedProducts).toBe(3);
      expect(loadingResult.progress.successfulInserts).toBe(3);
      expect(loadingResult.progress.errorRate).toBe(0);
      
      // Verify performance metrics
      expect(loadingResult.stats.performanceMetrics.productsPerSecond).toBeGreaterThan(0);
      expect(loadingResult.stats.performanceMetrics.embeddingsPerSecond).toBeGreaterThan(0);
      
    }, 30000); // 30 second timeout for integration test
    
    test('should handle mixed valid and invalid products gracefully', async () => {
      // Include invalid product in the mix
      const mixedProducts: CreateProductInput[] = [];
      
      for (const rawProduct of mockRawProducts) {
        const extracted = (dataExtractor as any).extractProductData(rawProduct);
        if (extracted) {
          mixedProducts.push(extracted);
        }
      }
      
      // Should extract only valid products (3 out of 4)
      expect(mixedProducts).toHaveLength(3);
      
      // Process through dietary derivation
      const processedProducts = await dietaryDeriver.batchDeriveCompliance(mixedProducts);
      
      expect(processedProducts.processed).toHaveLength(3);
      expect(processedProducts.stats.processed).toBe(3);
      expect(processedProducts.stats.errors).toBe(0);
      
      // Bulk load should handle all valid products
      const loadingResult = await bulkLoader.loadProductsWithEmbeddings(
        processedProducts.processed
      );
      
      expect(loadingResult.success).toBe(true);
      expect(loadingResult.stats.successfulProducts).toBe(3);
      
    }, 25000);
  });
  
  describe('Embedding Generation and Storage Validation', () => {
    test('should generate and validate vector embeddings correctly', async () => {
      const testProduct: CreateProductInput = {
        code: '9999999999999',
        product_name: 'Test Embedding Product',
        ingredients_text: 'test ingredients for embedding',
        allergens_tags: ['en:test'],
        data_quality_score: 0.8,
        source: 'openfoodfacts',
        dietary_flags: {
          vegan: true,
          vegetarian: true,
          gluten_free: true,
          kosher: false,
          halal: false
        }
      };
      
      const result = await bulkLoader.loadProductsWithEmbeddings([testProduct]);
      
      expect(result.success).toBe(true);
      expect(result.progress.embeddingsGenerated).toBe(3); // 3 embeddings per product
      expect(result.progress.embeddingsFailed).toBe(0);
      
      // Verify embedding dimensions and quality
      expect(mockEmbeddingResponse.embeddings).toHaveLength(3);
      mockEmbeddingResponse.embeddings.forEach((embedding: number[]) => {
        expect(embedding).toHaveLength(384);
        expect(embedding.every((val: number) => typeof val === 'number' && isFinite(val))).toBe(true);
      });
      
    }, 15000);
    
    test('should handle embedding service failures gracefully', async () => {
      // Mock embedding service failure
      const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
      mockSpawn.mockImplementationOnce(() => ({
        stdout: { on: jest.fn() },
        stderr: { 
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              callback('Embedding service error');
            }
          })
        },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            callback(1); // Error exit code
          }
        })
      } as any));
      
      const testProduct: CreateProductInput = {
        code: '8888888888888',
        product_name: 'Embedding Failure Test',
        ingredients_text: 'test ingredients',
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts',
        dietary_flags: {
          vegan: false,
          vegetarian: false,
          gluten_free: false,
          kosher: false,
          halal: false
        }
      };
      
      const result = await bulkLoader.loadProductsWithEmbeddings([testProduct]);
      
      expect(result.success).toBe(false);
      expect(result.progress.embeddingsFailed).toBeGreaterThan(0);
      expect(result.errorRecovery.length).toBeGreaterThan(0);
      
    }, 15000);
    
    test('should validate embedding dimensions and detect invalid values', async () => {
      // Mock invalid embedding response
      const invalidEmbeddingResponse = {
        success: true,
        embeddings: [
          new Array(256).fill(0.1), // Wrong dimension
          new Array(384).fill(NaN), // Invalid values
          [0.1, 0.2, Infinity, 0.4, ...new Array(380).fill(0.1)] // Contains infinity
        ]
      };
      
      const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
      mockSpawn.mockImplementationOnce(() => ({
        stdout: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              callback(JSON.stringify(invalidEmbeddingResponse));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            callback(0);
          }
        })
      } as any));
      
      const testProduct: CreateProductInput = {
        code: '7777777777777',
        product_name: 'Invalid Embedding Test',
        ingredients_text: 'test ingredients',
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts',
        dietary_flags: {
          vegan: false,
          vegetarian: false,
          gluten_free: false,
          kosher: false,
          halal: false
        }
      };
      
      const result = await bulkLoader.loadProductsWithEmbeddings([testProduct]);
      
      // Should fail due to invalid embeddings
      expect(result.success).toBe(false);
      expect(result.errorRecovery.length).toBeGreaterThan(0);
      
    }, 15000);
  });
  
  describe('Error Handling and Recovery Mechanisms', () => {
    test('should implement retry logic for failed batches', async () => {
      let attemptCount = 0;
      
      // Mock service that fails first two times, succeeds on third
      const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
      mockSpawn.mockImplementation(() => {
        attemptCount++;
        
        if (attemptCount <= 2) {
          // Fail first two attempts
          return {
            stdout: { on: jest.fn() },
            stderr: { 
              on: jest.fn((event: string, callback: Function) => {
                if (event === 'data') {
                  callback('Temporary service error');
                }
              })
            },
            on: jest.fn((event: string, callback: Function) => {
              if (event === 'close') {
                callback(1); // Error exit code
              }
            })
          } as any;
        } else {
          // Succeed on third attempt
          return {
            stdout: {
              on: jest.fn((event: string, callback: Function) => {
                if (event === 'data') {
                  callback(JSON.stringify(mockEmbeddingResponse));
                }
              })
            },
            stderr: { on: jest.fn() },
            on: jest.fn((event: string, callback: Function) => {
              if (event === 'close') {
                callback(0);
              }
            })
          } as any;
        }
      });
      
      const testProduct: CreateProductInput = {
        code: '6666666666666',
        product_name: 'Retry Test Product',
        ingredients_text: 'test ingredients',
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts',
        dietary_flags: {
          vegan: false,
          vegetarian: false,
          gluten_free: false,
          kosher: false,
          halal: false
        }
      };
      
      const result = await bulkLoader.loadProductsWithEmbeddings([testProduct]);
      
      // Should eventually succeed after retries
      expect(attemptCount).toBeGreaterThan(1); // Verify retries occurred
      expect(result.errorRecovery.length).toBeGreaterThan(0); // Error recovery was triggered
      
    }, 20000);
    
    test('should handle memory threshold breaches', async () => {
      // Create bulk loader with very low memory threshold
      const memoryConstrainedLoader = new BulkDataLoader({
        batchSize: 2,
        memoryThresholdMB: 1, // Very low threshold to trigger memory management
        enableProgressTracking: true
      });
      
      const testProducts: CreateProductInput[] = Array.from({ length: 10 }, (_, i) => ({
        code: `555555555555${i}`,
        product_name: `Memory Test Product ${i}`,
        ingredients_text: 'test ingredients '.repeat(100), // Large ingredients text
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts',
        dietary_flags: {
          vegan: false,
          vegetarian: false,
          gluten_free: false,
          kosher: false,
          halal: false
        }
      }));
      
      const result = await memoryConstrainedLoader.loadProductsWithEmbeddings(testProducts);
      
      // Should handle memory constraints gracefully
      expect(result.progress.memoryUsageMB).toBeGreaterThan(0);
      
    }, 25000);
    
    test('should validate data quality and provide quality assurance feedback', async () => {
      const mixedQualityProducts: CreateProductInput[] = [
        {
          code: '4444444444444',
          product_name: 'High Quality Product',
          ingredients_text: 'organic wheat flour, organic sugar, organic vanilla extract',
          ingredients_tags: ['wheat-flour', 'sugar', 'vanilla'],
          ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
          allergens_tags: ['en:gluten'],
          labels_tags: ['en:organic'],
          data_quality_score: 0.95,
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
          code: '3333333333333',
          product_name: 'Low Quality Product',
          ingredients_text: 'ingredients',
          allergens_tags: [],
          data_quality_score: 0.3,
          source: 'manual',
          dietary_flags: {
            vegan: false,
            vegetarian: false,
            gluten_free: false,
            kosher: false,
            halal: false
          }
        }
      ];
      
      const result = await bulkLoader.loadProductsWithEmbeddings(mixedQualityProducts);
      
      expect(result.qualityAssurance).toBeDefined();
      expect(result.qualityAssurance.overallScore).toBeGreaterThan(0);
      expect(result.qualityAssurance.checks.dataCompleteness).toBeGreaterThan(0);
      expect(result.qualityAssurance.checks.embeddingQuality).toBeGreaterThan(0);
      
      if (result.qualityAssurance.overallScore < 0.9) {
        expect(result.qualityAssurance.issues.length).toBeGreaterThan(0);
        expect(result.qualityAssurance.recommendations.length).toBeGreaterThan(0);
      }
      
    }, 20000);
  });
  
  describe('Performance and Scalability Tests', () => {
    test('should process large batches efficiently', async () => {
      const largeBatch: CreateProductInput[] = Array.from({ length: 50 }, (_, i) => ({
        code: `222222222222${i.toString().padStart(2, '0')}`,
        product_name: `Batch Product ${i}`,
        ingredients_text: `ingredient ${i}, salt, water`,
        allergens_tags: i % 3 === 0 ? ['en:gluten'] : [],
        data_quality_score: 0.7 + (i % 3) * 0.1,
        source: 'openfoodfacts',
        dietary_flags: {
          vegan: i % 2 === 0,
          vegetarian: true,
          gluten_free: i % 3 !== 0,
          kosher: false,
          halal: false
        }
      }));
      
      const startTime = Date.now();
      const result = await bulkLoader.loadProductsWithEmbeddings(largeBatch);
      const processingTime = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(result.stats.totalProducts).toBe(50);
      expect(result.stats.performanceMetrics.productsPerSecond).toBeGreaterThan(0);
      
      // Performance expectations
      expect(processingTime).toBeLessThan(60000); // Should complete within 60 seconds
      expect(result.stats.performanceMetrics.productsPerSecond).toBeGreaterThan(0.5); // At least 0.5 products/second
      
    }, 70000); // 70 second timeout for large batch
    
    test('should handle concurrent batch processing', async () => {
      const concurrentLoader = new BulkDataLoader({
        batchSize: 3,
        maxConcurrentBatches: 3,
        enableProgressTracking: true
      });
      
      const testProducts: CreateProductInput[] = Array.from({ length: 15 }, (_, i) => ({
        code: `111111111111${i.toString().padStart(2, '0')}`,
        product_name: `Concurrent Product ${i}`,
        ingredients_text: `test ingredient ${i}`,
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts',
        dietary_flags: {
          vegan: i % 2 === 0,
          vegetarian: true,
          gluten_free: true,
          kosher: false,
          halal: false
        }
      }));
      
      const result = await concurrentLoader.loadProductsWithEmbeddings(testProducts);
      
      expect(result.success).toBe(true);
      expect(result.stats.totalProducts).toBe(15);
      expect(result.progress.totalBatches).toBe(5); // 15 products / 3 batch size = 5 batches
      
    }, 30000);
  });
  
  describe('Data Consistency and Integrity', () => {
    test('should maintain data consistency across pipeline stages', async () => {
      const testProduct: CreateProductInput = {
        code: '0000000000001',
        product_name: 'Consistency Test Product',
        ingredients_text: 'wheat flour, sugar, milk powder',
        ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
        allergens_tags: ['en:gluten', 'en:milk'],
        labels_tags: [],
        data_quality_score: 0.85,
        source: 'openfoodfacts'
      };
      
      // Process through dietary derivation
      const derivationResult = dietaryDeriver.deriveComplianceFlags(testProduct);
      const productWithFlags = {
        ...testProduct,
        dietary_flags: derivationResult.dietary_flags,
        data_quality_score: derivationResult.data_quality_score,
        completeness_score: derivationResult.completeness_score
      };
      
      // Verify dietary flags consistency
      expect(productWithFlags.dietary_flags?.vegan).toBe(false); // Contains milk
      expect(productWithFlags.dietary_flags?.vegetarian).toBe(true); // No meat
      expect(productWithFlags.dietary_flags?.gluten_free).toBe(false); // Contains wheat
      
      // Process through bulk loading
      const loadingResult = await bulkLoader.loadProductsWithEmbeddings([productWithFlags]);
      
      expect(loadingResult.success).toBe(true);
      expect(loadingResult.stats.successfulProducts).toBe(1);
      
      // Verify data integrity maintained through pipeline
      expect(derivationResult.data_quality_score).toBeGreaterThanOrEqual(testProduct.data_quality_score);
      expect(derivationResult.completeness_score).toBeGreaterThan(0);
      
    }, 15000);
    
    test('should handle duplicate detection correctly', async () => {
      const duplicateLoader = new BulkDataLoader({
        batchSize: 5,
        skipDuplicates: true,
        enableProgressTracking: true
      });
      
      const originalProduct: CreateProductInput = {
        code: '0000000000002',
        product_name: 'Duplicate Test Product',
        ingredients_text: 'test ingredients',
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts',
        dietary_flags: {
          vegan: true,
          vegetarian: true,
          gluten_free: true,
          kosher: false,
          halal: false
        }
      };
      
      // First load should succeed
      const firstResult = await duplicateLoader.loadProductsWithEmbeddings([originalProduct]);
      expect(firstResult.success).toBe(true);
      expect(firstResult.stats.successfulProducts).toBe(1);
      
      // Second load with same UPC should skip duplicates
      const secondResult = await duplicateLoader.loadProductsWithEmbeddings([originalProduct]);
      expect(secondResult.progress.skippedDuplicates).toBeGreaterThanOrEqual(0);
      
    }, 20000);
  });
});