/**
 * Unit tests for Product model and schema
 * Tests Requirements 1.1, 1.2, and 1.5 implementation
 */

import { ProductModel, StorageOptimizer } from '../Product';
import { CreateProductInput, Product } from '../../types/Product';

describe('ProductModel', () => {
  describe('transformCreateInput', () => {
    it('should transform CreateProductInput to Product document format', () => {
      const input: CreateProductInput = {
        code: '1234567890123',
        product_name: 'Test Product',
        ingredients_text: 'flour, sugar, salt',
        allergens_tags: ['en:gluten', 'en:milk'],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };

      const result = ProductModel.transformCreateInput(input);

      expect(result.code).toBe(input.code);
      expect(result.product_name).toBe(input.product_name);
      expect(result.ingredients_text).toBe(input.ingredients_text);
      expect(result.allergens_tags).toEqual(input.allergens_tags);
      expect(result.data_quality_score).toBe(input.data_quality_score);
      expect(result.source).toBe(input.source);
      expect(result.last_updated).toBeInstanceOf(Date);
      expect(result.dietary_flags).toBeDefined();
      expect(result.completeness_score).toBeGreaterThan(0);
    });

    it('should handle legacy field mapping', () => {
      const input: CreateProductInput = {
        upc: '1234567890123', // Legacy field
        name: 'Test Product', // Legacy field
        ingredients: ['flour', 'sugar', 'salt'], // Legacy field
        allergens: ['gluten', 'milk'], // Legacy field
        confidence: 0.8, // Legacy field
        source: 'manual',
        code: '', // Will be overridden by upc
        product_name: '', // Will be overridden by name
        ingredients_text: '', // Will be overridden by ingredients
        allergens_tags: [], // Will be overridden by allergens
        data_quality_score: 0 // Will be overridden by confidence
      };

      const result = ProductModel.transformCreateInput(input);

      expect(result.code).toBe(input.upc);
      expect(result.product_name).toBe(input.name);
      expect(result.ingredients_text).toBe('flour, sugar, salt');
      expect(result.allergens_tags).toEqual(['gluten', 'milk']);
      expect(result.data_quality_score).toBe(input.confidence);
    });

    it('should throw error for missing required fields', () => {
      const input: CreateProductInput = {
        code: '',
        product_name: 'Test Product',
        ingredients_text: 'flour, sugar',
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'manual'
      };

      expect(() => ProductModel.transformCreateInput(input)).toThrow('Product code (UPC) is required');
    });
  });

  describe('deriveDietaryFlags', () => {
    it('should derive vegan flag from analysis tags', () => {
      const analysisTags = ['en:vegan', 'en:palm-oil-free'];
      const labelsTags: string[] = [];

      const flags = ProductModel.deriveDietaryFlags(analysisTags, labelsTags);

      expect(flags.vegan).toBe(true);
      expect(flags.vegetarian).toBe(true); // Vegan implies vegetarian
    });

    it('should derive gluten-free flag from labels', () => {
      const analysisTags: string[] = [];
      const labelsTags = ['en:gluten-free', 'en:organic'];

      const flags = ProductModel.deriveDietaryFlags(analysisTags, labelsTags);

      expect(flags.gluten_free).toBe(true);
    });

    it('should derive kosher and halal flags from labels', () => {
      const analysisTags: string[] = [];
      const labelsTags = ['en:kosher', 'en:halal-certified'];

      const flags = ProductModel.deriveDietaryFlags(analysisTags, labelsTags);

      expect(flags.kosher).toBe(true);
      expect(flags.halal).toBe(true);
    });

    it('should handle case insensitive matching', () => {
      const analysisTags = ['EN:VEGAN'];
      const labelsTags = ['EN:KOSHER'];

      const flags = ProductModel.deriveDietaryFlags(analysisTags, labelsTags);

      expect(flags.vegan).toBe(true);
      expect(flags.kosher).toBe(true);
    });
  });

  describe('calculateCompleteness', () => {
    it('should calculate completeness score based on available fields', () => {
      const input: CreateProductInput = {
        code: '1234567890123',
        product_name: 'Complete Product',
        brands_tags: ['Brand A'],
        categories_tags: ['Category 1'],
        ingredients_text: 'flour, sugar, salt',
        ingredients_tags: ['flour', 'sugar', 'salt'],
        allergens_tags: ['en:gluten'],
        labels_tags: ['en:organic'],
        nutritionalInfo: { calories: 100 },
        imageUrl: 'https://example.com/image.jpg',
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };

      const completeness = ProductModel.calculateCompleteness(input);

      expect(completeness).toBe(1.0); // All optional fields present
    });

    it('should return lower score for incomplete data', () => {
      const input: CreateProductInput = {
        code: '1234567890123',
        product_name: 'Basic Product',
        ingredients_text: 'flour, sugar',
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'manual'
      };

      const completeness = ProductModel.calculateCompleteness(input);

      expect(completeness).toBe(0.3); // Only required fields present
    });
  });

  describe('validateVectorEmbeddings', () => {
    it('should validate correct vector dimensions', () => {
      const product: Partial<Product> = {
        ingredients_embedding: new Array(384).fill(0.1),
        product_name_embedding: new Array(384).fill(0.2),
        allergens_embedding: new Array(384).fill(0.3)
      };

      const errors = ProductModel.validateVectorEmbeddings(product);

      expect(errors).toHaveLength(0);
    });

    it('should detect incorrect vector dimensions', () => {
      const product: Partial<Product> = {
        ingredients_embedding: new Array(100).fill(0.1), // Wrong size
        product_name_embedding: new Array(384).fill(0.2),
        allergens_embedding: new Array(500).fill(0.3) // Wrong size
      };

      const errors = ProductModel.validateVectorEmbeddings(product);

      expect(errors).toHaveLength(2);
      expect(errors[0]).toContain('ingredients_embedding must have exactly 384 dimensions');
      expect(errors[1]).toContain('allergens_embedding must have exactly 384 dimensions');
    });
  });

  describe('createDocument', () => {
    it('should create document without vector embeddings', () => {
      const input: CreateProductInput = {
        code: '1234567890123',
        product_name: 'Test Product',
        ingredients_text: 'flour, sugar, salt',
        allergens_tags: ['en:gluten'],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };

      const document = ProductModel.createDocument(input);

      expect(document.code).toBe(input.code);
      expect(document.product_name).toBe(input.product_name);
      expect(document).not.toHaveProperty('ingredients_embedding');
      expect(document).not.toHaveProperty('product_name_embedding');
      expect(document).not.toHaveProperty('allergens_embedding');
    });
  });
});

describe('StorageOptimizer', () => {
  describe('estimateDocumentSize', () => {
    it('should estimate document size including vector embeddings', () => {
      const product: Product = {
        code: '1234567890123',
        product_name: 'Test Product',
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
        source: 'openfoodfacts'
      };

      const size = StorageOptimizer.estimateDocumentSize(product);

      expect(size).toBeGreaterThan(9000); // Should be around 9KB+ due to vectors
      expect(size).toBeLessThan(20000); // But not excessive
    });
  });

  describe('calculateMaxProducts', () => {
    it('should calculate maximum products for M0 tier', () => {
      const averageSize = 12000; // 12KB per product
      const maxProducts = StorageOptimizer.calculateMaxProducts(averageSize);

      expect(maxProducts).toBeGreaterThan(30000); // Should fit 30K+ products
      expect(maxProducts).toBeLessThan(50000); // But not unlimited
    });

    it('should handle different document sizes', () => {
      const smallSize = 5000; // 5KB per product
      const largeSize = 20000; // 20KB per product

      const maxSmall = StorageOptimizer.calculateMaxProducts(smallSize);
      const maxLarge = StorageOptimizer.calculateMaxProducts(largeSize);

      expect(maxSmall).toBeGreaterThan(maxLarge);
    });
  });

  describe('getOptimizationSuggestions', () => {
    it('should provide optimization suggestions', () => {
      const suggestions = StorageOptimizer.getOptimizationSuggestions();

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('popularity_score'))).toBe(true);
      expect(suggestions.some(s => s.includes('10,000-15,000'))).toBe(true);
    });
  });
});