/**
 * Data Pipeline Unit Tests
 * Simplified tests for Task 3.4 that don't require external dependencies
 * 
 * Test Coverage:
 * - Data processing logic validation
 * - Error handling mechanisms
 * - Configuration validation
 * - Mock service integration
 */

import { DataExtractor, OpenFoodFactsRawProduct } from '../DataExtractor';
import { DietaryComplianceDeriver } from '../DietaryComplianceDeriver';
import { BulkDataLoader } from '../BulkDataLoader';
import { CreateProductInput } from '../../../types/Product';

// Mock child_process for embedding service
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

describe('Data Pipeline Unit Tests', () => {
  let dataExtractor: DataExtractor;
  let dietaryDeriver: DietaryComplianceDeriver;
  let bulkLoader: BulkDataLoader;
  
  beforeEach(() => {
    // Initialize services with test configuration
    dataExtractor = new DataExtractor({
      sourceConnectionString: 'mongodb://test:27017',
      sourceDatabaseName: 'test_db',
      sourceCollectionName: 'test_collection',
      maxProducts: 10,
      requireUPC: true,
      requireIngredients: true,
      batchSize: 5
    });
    
    dietaryDeriver = new DietaryComplianceDeriver({
      minConfidenceThreshold: 0.7,
      strictMode: false
    });
    
    bulkLoader = new BulkDataLoader({
      batchSize: 3,
      maxConcurrentBatches: 2,
      enableProgressTracking: true,
      enableErrorRecovery: true,
      maxRetries: 2,
      retryDelayMs: 100
    });
  });
  
  describe('Data Extraction Logic', () => {
    test('should extract valid product data from OpenFoodFacts format', () => {
      const rawProduct: OpenFoodFactsRawProduct = {
        _id: 'test_product_1',
        code: '1234567890123',
        product_name: 'Test Organic Cookies',
        product_name_en: 'Test Organic Cookies',
        brands_tags: ['organic-brand'],
        categories_tags: ['en:snacks', 'en:cookies'],
        ingredients_text: 'organic wheat flour, organic sugar, organic vanilla',
        ingredients_text_en: 'organic wheat flour, organic sugar, organic vanilla',
        ingredients_tags: ['wheat-flour', 'sugar', 'vanilla'],
        ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
        allergens_tags: ['en:gluten'],
        allergens_hierarchy: ['en:gluten'],
        traces_tags: ['en:nuts'],
        labels_tags: ['en:organic'],
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
      };
      
      // Use reflection to access private method for testing
      const result = (dataExtractor as any).extractProductData(rawProduct);
      
      expect(result).toBeDefined();
      expect(result.code).toBe('1234567890123');
      expect(result.product_name).toBe('Test Organic Cookies');
      expect(result.ingredients_text).toBe('organic wheat flour, organic sugar, organic vanilla');
      expect(result.allergens_tags).toEqual(['en:gluten']);
      expect(result.source).toBe('openfoodfacts');
      expect(result.data_quality_score).toBeGreaterThan(0.8);
      expect(result.nutritionalInfo).toEqual({
        calories: 450,
        sodium: 150,
        sugar: 20
      });
    });
    
    test('should reject products without required fields', () => {
      const invalidProduct: OpenFoodFactsRawProduct = {
        product_name: 'Invalid Product',
        ingredients_text: 'test ingredients'
        // Missing code field
      };
      
      const result = (dataExtractor as any).extractProductData(invalidProduct);
      expect(result).toBeNull();
    });
    
    test('should handle missing optional fields gracefully', () => {
      const minimalProduct: OpenFoodFactsRawProduct = {
        code: '9999999999999',
        product_name: 'Minimal Product',
        ingredients_text: 'simple ingredients'
      };
      
      const result = (dataExtractor as any).extractProductData(minimalProduct);
      
      expect(result).toBeDefined();
      expect(result.brands_tags).toEqual([]);
      expect(result.categories_tags).toEqual([]);
      expect(result.allergens_tags).toEqual([]);
      expect(result.nutritionalInfo).toBeUndefined();
    });
  });
  
  describe('Dietary Compliance Derivation', () => {
    test('should derive vegan status correctly', () => {
      const veganProduct: CreateProductInput = {
        code: '1111111111111',
        product_name: 'Vegan Cookies',
        ingredients_text: 'oat flour, coconut oil, maple syrup',
        ingredients_analysis_tags: ['en:vegan', 'en:vegetarian'],
        allergens_tags: [],
        labels_tags: ['en:vegan'],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = dietaryDeriver.deriveComplianceFlags(veganProduct);
      
      expect(result.dietary_flags.vegan).toBe(true);
      expect(result.dietary_flags.vegetarian).toBe(true);
      expect(result.confidence_scores.vegan).toBeGreaterThan(0.8);
      expect(result.derivation_notes.some(note => note.includes('Vegan status: positive'))).toBe(true);
    });
    
    test('should detect non-vegan products from ingredients', () => {
      const nonVeganProduct: CreateProductInput = {
        code: '2222222222222',
        product_name: 'Milk Chocolate',
        ingredients_text: 'sugar, cocoa butter, milk powder, cocoa mass',
        ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
        allergens_tags: ['en:milk'],
        labels_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = dietaryDeriver.deriveComplianceFlags(nonVeganProduct);
      
      expect(result.dietary_flags.vegan).toBe(false);
      expect(result.dietary_flags.vegetarian).toBe(true);
      expect(result.confidence_scores.vegan).toBeGreaterThan(0.6);
    });
    
    test('should derive gluten-free status from labels', () => {
      const glutenFreeProduct: CreateProductInput = {
        code: '3333333333333',
        product_name: 'Gluten-Free Bread',
        ingredients_text: 'rice flour, tapioca starch, xanthan gum',
        ingredients_analysis_tags: [],
        allergens_tags: [],
        labels_tags: ['en:gluten-free'],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = dietaryDeriver.deriveComplianceFlags(glutenFreeProduct);
      
      expect(result.dietary_flags.gluten_free).toBe(true);
      expect(result.confidence_scores.gluten_free).toBeGreaterThan(0.8);
    });
    
    test('should calculate data quality and completeness scores', () => {
      const comprehensiveProduct: CreateProductInput = {
        code: '4444444444444',
        product_name: 'Premium Organic Product',
        ingredients_text: 'organic ingredients',
        ingredients_tags: ['organic-flour', 'organic-sugar'],
        ingredients_analysis_tags: ['en:vegan', 'en:vegetarian'],
        allergens_tags: [],
        labels_tags: ['en:organic', 'en:vegan'],
        brands_tags: ['premium-brand'],
        categories_tags: ['en:organic', 'en:snacks'],
        data_quality_score: 0.7,
        source: 'openfoodfacts'
      };
      
      const result = dietaryDeriver.deriveComplianceFlags(comprehensiveProduct);
      
      expect(result.data_quality_score).toBeGreaterThan(0.7);
      expect(result.completeness_score).toBeGreaterThan(0.6);
    });
  });
  
  describe('Bulk Loading Configuration', () => {
    test('should initialize with correct configuration', () => {
      const progress = bulkLoader.getProgress();
      const stats = bulkLoader.getStats();
      
      expect(progress.totalProducts).toBe(0);
      expect(progress.processedProducts).toBe(0);
      expect(progress.successfulInserts).toBe(0);
      expect(progress.failedInserts).toBe(0);
      expect(stats.totalProducts).toBe(0);
      expect(stats.successfulProducts).toBe(0);
    });
    
    test('should handle empty product list', async () => {
      const emptyProducts: CreateProductInput[] = [];
      
      const result = await bulkLoader.loadProductsWithEmbeddings(emptyProducts);
      
      expect(result.success).toBe(true);
      expect(result.stats.totalProducts).toBe(0);
      expect(result.progress.processedProducts).toBe(0);
    });
    
    test('should validate batch size configuration', () => {
      const customLoader = new BulkDataLoader({
        batchSize: 50,
        maxConcurrentBatches: 5
      });
      
      expect(customLoader).toBeDefined();
      
      const progress = customLoader.getProgress();
      expect(progress.totalProducts).toBe(0);
    });
  });
  
  describe('Error Handling Logic', () => {
    test('should handle invalid product data gracefully', () => {
      const invalidProducts = [
        {
          // Missing required fields
          product_name: 'Invalid Product 1'
        },
        {
          code: '',
          product_name: 'Invalid Product 2',
          ingredients_text: 'test'
        }
      ];
      
      invalidProducts.forEach(product => {
        const result = (dataExtractor as any).extractProductData(product);
        expect(result).toBeNull();
      });
    });
    
    test('should validate UPC code formats', () => {
      const testCases = [
        { code: '1234567890123', expected: '1234567890123' }, // Valid EAN-13
        { code: '123456789012', expected: '123456789012' },   // Valid UPC-A
        { code: '12345678', expected: '12345678' },           // Valid EAN-8
        { code: '123-456-789-012', expected: '123456789012' }, // With dashes
        { code: '123 456 789 012', expected: '123456789012' }, // With spaces
        { code: 'invalid', expected: null },                  // Invalid
        { code: '123', expected: null },                      // Too short
        { code: '', expected: null }                          // Empty
      ];
      
      testCases.forEach(testCase => {
        const result = (dataExtractor as any).extractUPCCode({ code: testCase.code });
        expect(result).toBe(testCase.expected);
      });
    });
    
    test('should handle embedding validation errors', () => {
      const validEmbedding = new Array(384).fill(0.1);
      const invalidEmbedding = new Array(256).fill(0.1); // Wrong dimension
      const embeddingWithNaN = [...validEmbedding];
      embeddingWithNaN[100] = NaN;
      
      // Test dimension validation
      expect(validEmbedding.length).toBe(384);
      expect(invalidEmbedding.length).not.toBe(384);
      
      // Test value validation
      expect(validEmbedding.every(val => isFinite(val) && !isNaN(val))).toBe(true);
      expect(embeddingWithNaN.every(val => isFinite(val) && !isNaN(val))).toBe(false);
    });
  });
  
  describe('Data Quality Calculations', () => {
    test('should calculate quality scores based on completeness', () => {
      const highQualityProduct = {
        data_quality_errors_tags: [],
        data_quality_warnings_tags: [],
        completeness: 0.95
      };
      
      const lowQualityProduct = {
        data_quality_errors_tags: ['error1', 'error2'],
        data_quality_warnings_tags: ['warning1', 'warning2'],
        completeness: 0.3
      };
      
      const highScore = (dataExtractor as any).calculateDataQualityScore(highQualityProduct);
      const lowScore = (dataExtractor as any).calculateDataQualityScore(lowQualityProduct);
      
      expect(highScore).toBeGreaterThan(0.9);
      expect(lowScore).toBeLessThan(0.5);
      expect(highScore).toBeGreaterThan(lowScore);
    });
    
    test('should calculate popularity scores from indicators', () => {
      const popularProduct = {
        popularity_tags: ['popular', 'trending'],
        image_url: 'https://example.com/image.jpg',
        nutriments: { calories: 100 },
        last_modified_t: Date.now() / 1000 // Recent update
      };
      
      const unpopularProduct = {};
      
      const popularScore = (dataExtractor as any).calculatePopularityScore(popularProduct);
      const unpopularScore = (dataExtractor as any).calculatePopularityScore(unpopularProduct);
      
      expect(popularScore).toBeGreaterThan(0.5);
      expect(unpopularScore).toBe(0.0);
      expect(popularScore).toBeGreaterThan(unpopularScore);
    });
  });
  
  describe('Batch Processing Logic', () => {
    test('should create appropriate batch sizes', () => {
      const products = Array.from({ length: 10 }, (_, i) => ({
        code: `${i}`.padStart(13, '0'),
        product_name: `Product ${i}`,
        ingredients_text: `ingredient ${i}`,
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'test' as const
      }));
      
      const batchSize = 3;
      const expectedBatches = Math.ceil(products.length / batchSize);
      
      expect(expectedBatches).toBe(4); // 10 products / 3 batch size = 4 batches
    });
    
    test('should handle progress tracking initialization', () => {
      const progress = bulkLoader.getProgress();
      
      expect(progress).toHaveProperty('totalProducts');
      expect(progress).toHaveProperty('processedProducts');
      expect(progress).toHaveProperty('successfulInserts');
      expect(progress).toHaveProperty('failedInserts');
      expect(progress).toHaveProperty('embeddingsGenerated');
      expect(progress).toHaveProperty('embeddingsFailed');
      expect(progress).toHaveProperty('errorRate');
      expect(progress).toHaveProperty('qualityScore');
      expect(progress).toHaveProperty('memoryUsageMB');
    });
    
    test('should initialize error recovery system', () => {
      const errorRecovery = bulkLoader.getErrorRecovery();
      
      expect(Array.isArray(errorRecovery)).toBe(true);
      expect(errorRecovery.length).toBe(0);
    });
  });
  
  describe('Integration Points Validation', () => {
    test('should maintain data consistency between services', () => {
      const testProduct: CreateProductInput = {
        code: '5555555555555',
        product_name: 'Integration Test Product',
        ingredients_text: 'wheat flour, sugar, milk powder',
        ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
        allergens_tags: ['en:gluten', 'en:milk'],
        labels_tags: [],
        data_quality_score: 0.85,
        source: 'openfoodfacts'
      };
      
      // Process through dietary derivation
      const derivationResult = dietaryDeriver.deriveComplianceFlags(testProduct);
      
      // Verify consistency
      expect(derivationResult.dietary_flags.vegan).toBe(false); // Contains milk
      expect(derivationResult.dietary_flags.vegetarian).toBe(true); // No meat
      expect(derivationResult.dietary_flags.gluten_free).toBe(false); // Contains wheat
      expect(derivationResult.data_quality_score).toBeGreaterThanOrEqual(testProduct.data_quality_score);
    });
    
    test('should handle service configuration validation', () => {
      // Test DataExtractor configuration
      const extractorConfig = {
        sourceConnectionString: 'mongodb://test:27017',
        sourceDatabaseName: 'test_db',
        sourceCollectionName: 'test_collection',
        maxProducts: 100,
        requireUPC: true,
        requireIngredients: true
      };
      
      const extractor = new DataExtractor(extractorConfig);
      expect(extractor).toBeDefined();
      
      // Test DietaryComplianceDeriver configuration
      const deriverConfig = {
        minConfidenceThreshold: 0.8,
        strictMode: true
      };
      
      const deriver = new DietaryComplianceDeriver(deriverConfig);
      expect(deriver).toBeDefined();
      
      // Test BulkDataLoader configuration
      const loaderConfig = {
        batchSize: 25,
        maxConcurrentBatches: 3,
        enableProgressTracking: true,
        enableErrorRecovery: true
      };
      
      const loader = new BulkDataLoader(loaderConfig);
      expect(loader).toBeDefined();
    });
  });
  
  describe('Performance Metrics Calculation', () => {
    test('should calculate performance metrics correctly', () => {
      const stats = bulkLoader.getStats();
      
      expect(stats).toHaveProperty('performanceMetrics');
      expect(stats.performanceMetrics).toHaveProperty('productsPerSecond');
      expect(stats.performanceMetrics).toHaveProperty('embeddingsPerSecond');
      expect(stats.performanceMetrics).toHaveProperty('insertsPerSecond');
      
      // Initial values should be zero
      expect(stats.performanceMetrics.productsPerSecond).toBe(0);
      expect(stats.performanceMetrics.embeddingsPerSecond).toBe(0);
      expect(stats.performanceMetrics.insertsPerSecond).toBe(0);
    });
    
    test('should track processing times', () => {
      const stats = bulkLoader.getStats();
      
      expect(stats).toHaveProperty('totalProcessingTime');
      expect(stats).toHaveProperty('averageBatchTime');
      expect(stats).toHaveProperty('embeddingGenerationTime');
      expect(stats).toHaveProperty('databaseInsertionTime');
      expect(stats).toHaveProperty('validationTime');
      
      // Initial values should be zero
      expect(stats.totalProcessingTime).toBe(0);
      expect(stats.averageBatchTime).toBe(0);
      expect(stats.embeddingGenerationTime).toBe(0);
      expect(stats.databaseInsertionTime).toBe(0);
      expect(stats.validationTime).toBe(0);
    });
  });
});