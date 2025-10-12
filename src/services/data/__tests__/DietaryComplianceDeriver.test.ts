/**
 * Unit tests for DietaryComplianceDeriver
 * Tests dietary compliance flag derivation functionality
 */

import { DietaryComplianceDeriver, createDietaryComplianceDeriver, deriveDietaryFlagsQuick } from '../DietaryComplianceDeriver';
import { CreateProductInput } from '../../../types/Product';

describe('DietaryComplianceDeriver', () => {
  let deriver: DietaryComplianceDeriver;
  
  beforeEach(() => {
    deriver = createDietaryComplianceDeriver();
  });
  
  describe('Vegan Status Derivation', () => {
    it('should detect vegan products from analysis tags', () => {
      const product: CreateProductInput = {
        code: '1234567890123',
        product_name: 'Plant-Based Burger',
        ingredients_text: 'pea protein, coconut oil, potato starch',
        ingredients_analysis_tags: ['en:vegan', 'en:vegetarian'],
        allergens_tags: [],
        labels_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.vegan).toBe(true);
      expect(result.confidence_scores.vegan).toBeGreaterThan(0.8);
      expect(result.derivation_notes.some(note => note.includes('Vegan status: positive from analysis'))).toBe(true);
    });
    
    it('should detect non-vegan products from ingredients', () => {
      const product: CreateProductInput = {
        code: '1234567890124',
        product_name: 'Milk Chocolate',
        ingredients_text: 'sugar, cocoa butter, milk powder, cocoa mass',
        ingredients_analysis_tags: [],
        allergens_tags: ['en:milk'],
        labels_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.vegan).toBe(false);
      expect(result.confidence_scores.vegan).toBeGreaterThan(0.6);
      expect(result.derivation_notes.some(note => note.includes('Vegan status: negative from ingredients'))).toBe(true);
    });
    
    it('should detect vegan products from labels', () => {
      const product: CreateProductInput = {
        code: '1234567890125',
        product_name: 'Vegan Cheese',
        ingredients_text: 'cashew nuts, coconut oil, nutritional yeast',
        ingredients_analysis_tags: [],
        allergens_tags: [],
        labels_tags: ['en:vegan', 'en:plant-based'],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.vegan).toBe(true);
      expect(result.confidence_scores.vegan).toBeGreaterThan(0.8);
      expect(result.derivation_notes.some(note => note.includes('Vegan status: positive from labels'))).toBe(true);
    });
  });
  
  describe('Vegetarian Status Derivation', () => {
    it('should detect vegetarian products from analysis tags', () => {
      const product: CreateProductInput = {
        code: '1234567890126',
        product_name: 'Cheese Pizza',
        ingredients_text: 'flour, tomato sauce, mozzarella cheese, olive oil',
        ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
        allergens_tags: ['en:milk', 'en:gluten'],
        labels_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.vegetarian).toBe(true);
      expect(result.dietary_flags.vegan).toBe(false); // Contains mozzarella cheese (milk), so not vegan
      expect(result.confidence_scores.vegetarian).toBeGreaterThan(0.8);
    });
    
    it('should detect non-vegetarian products from meat ingredients', () => {
      const product: CreateProductInput = {
        code: '1234567890127',
        product_name: 'Beef Burger',
        ingredients_text: 'ground beef, wheat flour, onions, salt',
        ingredients_analysis_tags: [],
        allergens_tags: ['en:gluten'],
        labels_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.vegetarian).toBe(false);
      expect(result.dietary_flags.vegan).toBe(false);
      expect(result.confidence_scores.vegetarian).toBeGreaterThan(0.6);
    });
  });
  
  describe('Gluten-Free Status Derivation', () => {
    it('should detect gluten-free products from labels', () => {
      const product: CreateProductInput = {
        code: '1234567890128',
        product_name: 'Gluten-Free Bread',
        ingredients_text: 'rice flour, tapioca starch, xanthan gum',
        ingredients_analysis_tags: [],
        allergens_tags: [],
        labels_tags: ['en:gluten-free', 'en:certified-gluten-free'],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.gluten_free).toBe(true);
      expect(result.confidence_scores.gluten_free).toBeGreaterThan(0.8);
    });
    
    it('should detect gluten-containing products from ingredients', () => {
      const product: CreateProductInput = {
        code: '1234567890129',
        product_name: 'Wheat Bread',
        ingredients_text: 'wheat flour, water, yeast, salt',
        ingredients_analysis_tags: [],
        allergens_tags: ['en:gluten'],
        labels_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.gluten_free).toBe(false);
      expect(result.confidence_scores.gluten_free).toBeGreaterThan(0.7);
    });
    
    it('should assume gluten-free when no gluten ingredients detected', () => {
      const product: CreateProductInput = {
        code: '1234567890130',
        product_name: 'Rice Crackers',
        ingredients_text: 'rice, salt, vegetable oil',
        ingredients_analysis_tags: [],
        allergens_tags: [],
        labels_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.gluten_free).toBe(true);
      expect(result.confidence_scores.gluten_free).toBe(0.5); // Moderate confidence for assumption
    });
  });
  
  describe('Kosher Status Derivation', () => {
    it('should detect kosher products from certification labels', () => {
      const product: CreateProductInput = {
        code: '1234567890131',
        product_name: 'Kosher Soup',
        ingredients_text: 'vegetables, water, salt, spices',
        ingredients_analysis_tags: [],
        allergens_tags: [],
        labels_tags: ['en:kosher', 'en:kosher-certified', 'ou-kosher'],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.kosher).toBe(true);
      expect(result.confidence_scores.kosher).toBeGreaterThan(0.8);
    });
    
    it('should not assume kosher without explicit certification', () => {
      const product: CreateProductInput = {
        code: '1234567890132',
        product_name: 'Vegetable Soup',
        ingredients_text: 'vegetables, water, salt, spices',
        ingredients_analysis_tags: [],
        allergens_tags: [],
        labels_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.kosher).toBe(false);
      expect(result.confidence_scores.kosher).toBe(0.0);
    });
  });
  
  describe('Halal Status Derivation', () => {
    it('should detect halal products from certification labels', () => {
      const product: CreateProductInput = {
        code: '1234567890133',
        product_name: 'Halal Chicken',
        ingredients_text: 'chicken, salt, spices',
        ingredients_analysis_tags: [],
        allergens_tags: [],
        labels_tags: ['en:halal', 'en:halal-certified'],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.halal).toBe(true);
      expect(result.confidence_scores.halal).toBeGreaterThan(0.8);
    });
    
    it('should not assume halal without explicit certification', () => {
      const product: CreateProductInput = {
        code: '1234567890134',
        product_name: 'Chicken Soup',
        ingredients_text: 'chicken, vegetables, water, salt',
        ingredients_analysis_tags: [],
        allergens_tags: [],
        labels_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.halal).toBe(false);
      expect(result.confidence_scores.halal).toBe(0.0);
    });
  });
  
  describe('Organic Status Derivation', () => {
    it('should detect organic products from certification labels', () => {
      const product: CreateProductInput = {
        code: '1234567890135',
        product_name: 'Organic Apples',
        ingredients_text: 'organic apples',
        ingredients_analysis_tags: [],
        allergens_tags: [],
        labels_tags: ['en:organic', 'en:usda-organic', 'en:certified-organic'],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags.organic).toBe(true);
      expect(result.confidence_scores.organic).toBeGreaterThan(0.8);
    });
  });
  
  describe('Data Quality and Completeness Scoring', () => {
    it('should calculate higher quality scores for products with comprehensive dietary information', () => {
      const comprehensiveProduct: CreateProductInput = {
        code: '1234567890136',
        product_name: 'Premium Organic Vegan Burger',
        ingredients_text: 'organic pea protein, organic coconut oil, organic potato starch',
        ingredients_analysis_tags: ['en:vegan', 'en:vegetarian', 'en:gluten-free'],
        allergens_tags: [],
        labels_tags: ['en:organic', 'en:vegan', 'en:gluten-free'],
        ingredients_tags: ['pea-protein', 'coconut-oil', 'potato-starch'],
        traces_tags: [],
        data_quality_score: 0.7,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(comprehensiveProduct);
      
      expect(result.data_quality_score).toBeGreaterThan(0.7);
      expect(result.completeness_score).toBeGreaterThanOrEqual(0.6);
    });
    
    it('should calculate lower scores for products with minimal dietary information', () => {
      const minimalProduct: CreateProductInput = {
        code: '1234567890137',
        product_name: 'Basic Product',
        ingredients_text: 'ingredients not specified',
        allergens_tags: [],
        data_quality_score: 0.5,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(minimalProduct);
      
      expect(result.data_quality_score).toBeLessThanOrEqual(0.5);
      expect(result.completeness_score).toBeLessThan(0.5);
    });
  });
  
  describe('Batch Processing', () => {
    it('should process multiple products and return statistics', async () => {
      const products: CreateProductInput[] = [
        {
          code: '1234567890138',
          product_name: 'Vegan Product',
          ingredients_text: 'plant ingredients',
          ingredients_analysis_tags: ['en:vegan'],
          allergens_tags: [],
          labels_tags: [],
          data_quality_score: 0.8,
          source: 'openfoodfacts'
        },
        {
          code: '1234567890139',
          product_name: 'Dairy Product',
          ingredients_text: 'milk, cream',
          ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
          allergens_tags: ['en:milk'],
          labels_tags: [],
          data_quality_score: 0.8,
          source: 'openfoodfacts'
        }
      ];
      
      const result = await deriver.batchDeriveCompliance(products);
      
      expect(result.processed).toHaveLength(2);
      expect(result.stats.total).toBe(2);
      expect(result.stats.processed).toBe(2);
      expect(result.stats.errors).toBe(0);
      expect(result.stats.flagCounts.vegan).toBe(1); // Only first product is vegan
      expect(result.stats.flagCounts.vegetarian).toBe(2);
      expect(result.stats.averageConfidence).toBeGreaterThan(0);
    });
  });
  
  describe('Utility Functions', () => {
    it('should provide quick derivation function', () => {
      const product: CreateProductInput = {
        code: '1234567890140',
        product_name: 'Test Product',
        ingredients_text: 'test ingredients',
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      const result = deriveDietaryFlagsQuick(product);
      
      expect(result).toHaveProperty('dietary_flags');
      expect(result).toHaveProperty('data_quality_score');
      expect(result).toHaveProperty('completeness_score');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle products with empty or missing tags gracefully', () => {
      const product: CreateProductInput = {
        code: '1234567890141',
        product_name: 'Minimal Product',
        ingredients_text: 'unknown ingredients',
        allergens_tags: [],
        data_quality_score: 0.3,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      expect(result.dietary_flags).toBeDefined();
      expect(result.confidence_scores).toBeDefined();
      expect(result.data_quality_score).toBeGreaterThanOrEqual(0);
      expect(result.completeness_score).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle conflicting dietary indicators', () => {
      const product: CreateProductInput = {
        code: '1234567890142',
        product_name: 'Conflicting Product',
        ingredients_text: 'milk, plant protein',
        ingredients_analysis_tags: ['en:vegan'], // Conflicting with milk ingredient
        allergens_tags: ['en:milk'],
        labels_tags: [],
        data_quality_score: 0.6,
        source: 'openfoodfacts'
      };
      
      const result = deriver.deriveComplianceFlags(product);
      
      // Should prioritize negative indicators for safety
      expect(result.dietary_flags.vegan).toBe(false);
      expect(result.confidence_scores.vegan).toBeGreaterThan(0);
    });
  });
});