/**
 * Unit tests for DataExtractor service
 * Tests OpenFoodFacts data extraction and transformation logic
 */

import { DataExtractor, createDataExtractor, type OpenFoodFactsRawProduct } from '../DataExtractor';
import { CreateProductInput } from '../../../types/Product';

describe('DataExtractor', () => {
  let extractor: DataExtractor;
  
  beforeEach(() => {
    extractor = createDataExtractor({
      sourceConnectionString: 'mongodb://localhost:27017',
      sourceDatabaseName: 'test_off',
      sourceCollectionName: 'test_products',
      maxProducts: 100,
      requireUPC: true,
      requireIngredients: true
    });
  });
  
  describe('extractProductData', () => {
    it('should extract valid product data from OpenFoodFacts format', () => {
      const rawProduct: OpenFoodFactsRawProduct = {
        _id: 'test123',
        code: '1234567890123',
        product_name: 'Test Product',
        product_name_en: 'Test Product English',
        brands_tags: ['test-brand'],
        categories_tags: ['en:snacks', 'en:cookies'],
        ingredients_text: 'flour, sugar, chocolate chips',
        ingredients_text_en: 'flour, sugar, chocolate chips',
        ingredients_tags: ['en:flour', 'en:sugar', 'en:chocolate-chips'],
        ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
        allergens_tags: ['en:gluten', 'en:milk'],
        allergens_hierarchy: ['en:gluten', 'en:milk'],
        traces_tags: ['en:nuts'],
        labels_tags: ['en:organic'],
        data_quality_errors_tags: [],
        data_quality_warnings_tags: [],
        completeness: 0.8,
        popularity_tags: ['popular'],
        last_modified_t: Date.now() / 1000,
        image_front_url: 'https://example.com/image.jpg',
        nutriments: {
          'energy-kcal_100g': 450,
          sodium_100g: 200,
          sugars_100g: 25
        }
      };
      
      // Use reflection to access private method for testing
      const result = (extractor as any).extractProductData(rawProduct);
      
      expect(result).toBeDefined();
      expect(result.code).toBe('1234567890123');
      expect(result.product_name).toBe('Test Product English'); // Should prefer English
      expect(result.ingredients_text).toBe('flour, sugar, chocolate chips');
      expect(result.brands_tags).toEqual(['test-brand']);
      expect(result.categories_tags).toEqual(['en:snacks', 'en:cookies']);
      expect(result.allergens_tags).toEqual(['en:gluten', 'en:milk']);
      expect(result.source).toBe('openfoodfacts');
      expect(result.nutritionalInfo).toEqual({
        calories: 450,
        sodium: 200,
        sugar: 25
      });
      expect(result.imageUrl).toBe('https://example.com/image.jpg');
    });
    
    it('should return null for products without required UPC code', () => {
      const rawProduct: OpenFoodFactsRawProduct = {
        product_name: 'Test Product',
        ingredients_text: 'flour, sugar'
        // Missing code
      };
      
      const result = (extractor as any).extractProductData(rawProduct);
      expect(result).toBeNull();
    });
    
    it('should return null for products without required ingredients', () => {
      const rawProduct: OpenFoodFactsRawProduct = {
        code: '1234567890123',
        product_name: 'Test Product'
        // Missing ingredients_text
      };
      
      const result = (extractor as any).extractProductData(rawProduct);
      expect(result).toBeNull();
    });
    
    it('should handle missing optional fields gracefully', () => {
      const rawProduct: OpenFoodFactsRawProduct = {
        code: '1234567890123',
        product_name: 'Minimal Product',
        ingredients_text: 'flour, sugar'
        // Missing most optional fields
      };
      
      const result = (extractor as any).extractProductData(rawProduct);
      
      expect(result).toBeDefined();
      expect(result.brands_tags).toEqual([]);
      expect(result.categories_tags).toEqual([]);
      expect(result.allergens_tags).toEqual([]);
      expect(result.nutritionalInfo).toBeUndefined();
      expect(result.imageUrl).toBeUndefined();
    });
  });
  
  describe('extractUPCCode', () => {
    it('should extract and clean valid UPC codes', () => {
      expect((extractor as any).extractUPCCode({ code: '1234567890123' })).toBe('1234567890123'); // EAN-13
      expect((extractor as any).extractUPCCode({ code: '12345678' })).toBe('12345678'); // EAN-8
      expect((extractor as any).extractUPCCode({ code: '123456789012' })).toBe('123456789012'); // UPC-A
    });
    
    it('should clean UPC codes with spaces and dashes', () => {
      expect((extractor as any).extractUPCCode({ code: '123-456-789-012' })).toBe('123456789012');
      expect((extractor as any).extractUPCCode({ code: '123 456 789 012' })).toBe('123456789012');
      expect((extractor as any).extractUPCCode({ code: ' 123456789012 ' })).toBe('123456789012');
    });
    
    it('should return null for invalid UPC codes', () => {
      expect((extractor as any).extractUPCCode({ code: 'invalid' })).toBeNull();
      expect((extractor as any).extractUPCCode({ code: '123' })).toBeNull(); // Too short
      expect((extractor as any).extractUPCCode({ code: '12345678901234567890' })).toBeNull(); // Too long
      expect((extractor as any).extractUPCCode({ code: '' })).toBeNull();
      expect((extractor as any).extractUPCCode({})).toBeNull();
    });
  });
  
  describe('extractProductName', () => {
    it('should prefer language-specific product names', () => {
      const extractor = createDataExtractor({ preferredLanguage: 'en' });
      
      const rawProduct = {
        product_name: 'Generic Name',
        product_name_en: 'English Name'
      };
      
      expect((extractor as any).extractProductName(rawProduct)).toBe('English Name');
    });
    
    it('should fall back to generic product name', () => {
      const rawProduct = {
        product_name: 'Generic Name'
        // No language-specific name
      };
      
      expect((extractor as any).extractProductName(rawProduct)).toBe('Generic Name');
    });
    
    it('should return null for missing product names', () => {
      expect((extractor as any).extractProductName({})).toBeNull();
      expect((extractor as any).extractProductName({ product_name: '' })).toBeNull();
      expect((extractor as any).extractProductName({ product_name: '   ' })).toBeNull();
    });
  });
  
  describe('extractIngredientsText', () => {
    it('should prefer language-specific ingredients', () => {
      const extractor = createDataExtractor({ preferredLanguage: 'en' });
      
      const rawProduct = {
        ingredients_text: 'Generic ingredients',
        ingredients_text_en: 'English ingredients'
      };
      
      expect((extractor as any).extractIngredientsText(rawProduct)).toBe('English ingredients');
    });
    
    it('should fall back to generic ingredients text', () => {
      const rawProduct = {
        ingredients_text: 'Generic ingredients'
      };
      
      expect((extractor as any).extractIngredientsText(rawProduct)).toBe('Generic ingredients');
    });
    
    it('should return null for missing ingredients', () => {
      expect((extractor as any).extractIngredientsText({})).toBeNull();
      expect((extractor as any).extractIngredientsText({ ingredients_text: '' })).toBeNull();
    });
  });
  
  describe('calculateDataQualityScore', () => {
    it('should calculate quality score based on errors and warnings', () => {
      const rawProduct1 = {
        data_quality_errors_tags: [],
        data_quality_warnings_tags: []
      };
      expect((extractor as any).calculateDataQualityScore(rawProduct1)).toBe(1.0);
      
      const rawProduct2 = {
        data_quality_errors_tags: ['error1', 'error2'],
        data_quality_warnings_tags: ['warning1']
      };
      expect((extractor as any).calculateDataQualityScore(rawProduct2)).toBe(0.75); // 1.0 - 0.2 - 0.05
      
      const rawProduct3 = {
        data_quality_errors_tags: Array(15).fill('error'), // Many errors
        data_quality_warnings_tags: []
      };
      expect((extractor as any).calculateDataQualityScore(rawProduct3)).toBe(0.0); // Capped at 0.0
    });
    
    it('should use existing completeness score when available', () => {
      const rawProduct = {
        data_quality_errors_tags: [],
        data_quality_warnings_tags: [],
        completeness: 0.6
      };
      expect((extractor as any).calculateDataQualityScore(rawProduct)).toBe(0.6);
    });
  });
  
  describe('calculatePopularityScore', () => {
    it('should calculate popularity based on various indicators', () => {
      const rawProduct = {
        popularity_tags: ['popular', 'trending'],
        image_url: 'https://example.com/image.jpg',
        nutriments: { calories: 100 },
        last_modified_t: Date.now() / 1000 // Recent update
      };
      
      const score = (extractor as any).calculatePopularityScore(rawProduct);
      expect(score).toBeGreaterThan(0.5); // Should have decent popularity
      expect(score).toBeLessThanOrEqual(1.0);
    });
    
    it('should return low score for products with minimal indicators', () => {
      const rawProduct = {};
      const score = (extractor as any).calculatePopularityScore(rawProduct);
      expect(score).toBe(0.0);
    });
  });
  
  describe('extractNutritionalInfo', () => {
    it('should extract and convert nutritional information', () => {
      const rawProduct = {
        nutriments: {
          'energy-kcal_100g': 450,
          sodium_100g: 200,
          sugars_100g: 25,
          salt_100g: 500 // Should be converted to sodium
        }
      };
      
      const result = (extractor as any).extractNutritionalInfo(rawProduct);
      expect(result).toEqual({
        calories: 450,
        sodium: 200, // Should prefer sodium over converted salt
        sugar: 25
      });
    });
    
    it('should convert salt to sodium when sodium not available', () => {
      const rawProduct = {
        nutriments: {
          salt_100g: 500 // 500mg salt = 200mg sodium
        }
      };
      
      const result = (extractor as any).extractNutritionalInfo(rawProduct);
      expect(result).toEqual({
        sodium: 200 // salt / 2.5
      });
    });
    
    it('should convert energy from kJ to kcal when kcal not available', () => {
      const rawProduct = {
        nutriments: {
          energy_100g: 1884 // 1884 kJ = ~450 kcal
        }
      };
      
      const result = (extractor as any).extractNutritionalInfo(rawProduct);
      expect(result.calories).toBeCloseTo(450, 0);
    });
    
    it('should return undefined for missing nutriments', () => {
      const rawProduct = {};
      const result = (extractor as any).extractNutritionalInfo(rawProduct);
      expect(result).toBeUndefined();
    });
  });
  
  describe('getStats', () => {
    it('should return extraction statistics', () => {
      const stats = extractor.getStats();
      
      expect(stats).toHaveProperty('totalProcessed');
      expect(stats).toHaveProperty('validProducts');
      expect(stats).toHaveProperty('invalidProducts');
      expect(stats).toHaveProperty('duplicates');
      expect(stats).toHaveProperty('errors');
      expect(stats).toHaveProperty('startTime');
      expect(stats.startTime).toBeInstanceOf(Date);
    });
  });
  
  describe('resetStats', () => {
    it('should reset extraction statistics', () => {
      // Modify stats
      (extractor as any).stats.totalProcessed = 100;
      (extractor as any).stats.validProducts = 80;
      
      extractor.resetStats();
      
      const stats = extractor.getStats();
      expect(stats.totalProcessed).toBe(0);
      expect(stats.validProducts).toBe(0);
      expect(stats.startTime).toBeInstanceOf(Date);
    });
  });
});