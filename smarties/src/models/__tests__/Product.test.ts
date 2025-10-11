/**
 * Unit tests for Product model interface and validation functions
 * Tests Requirements 1.1 and 1.5 from core architecture specification
 */

import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  DietaryFlags,
  NutritionalInfo,
  ProductModel,
  validateUPC,
  validateProductName,
  validateIngredients,
  validateAllergens,
  validateConfidence,
  validateProductSource,
  validateDietaryFlags,
  validateNutritionalInfo,
  validateProduct,
  validateCreateProductInput,
  validateUpdateProductInput,
  COMMON_ALLERGENS,
  PRODUCT_SOURCES
} from '../Product';

describe('Product Model Validation', () => {
  describe('validateUPC', () => {
    it('should validate correct UPC codes', () => {
      expect(validateUPC('123456789012')).toEqual({ isValid: true, errors: [] });
      expect(validateUPC('1234567890123')).toEqual({ isValid: true, errors: [] });
      expect(validateUPC('12345678')).toEqual({ isValid: true, errors: [] });
    });

    it('should handle UPC codes with spaces and dashes', () => {
      expect(validateUPC('123-456-789-012')).toEqual({ isValid: true, errors: [] });
      expect(validateUPC('123 456 789 012')).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid UPC codes', () => {
      expect(validateUPC('')).toEqual({ 
        isValid: false, 
        errors: ['UPC is required and must be a string'] 
      });
      expect(validateUPC('abc123')).toEqual({ 
        isValid: false, 
        errors: ['UPC must contain only numeric characters'] 
      });
      expect(validateUPC('12345')).toEqual({ 
        isValid: false, 
        errors: ['UPC must be 8, 12, or 13 digits long'] 
      });
    });

    it('should reject non-string UPC codes', () => {
      expect(validateUPC(null as any)).toEqual({ 
        isValid: false, 
        errors: ['UPC is required and must be a string'] 
      });
      expect(validateUPC(123456789012 as any)).toEqual({ 
        isValid: false, 
        errors: ['UPC is required and must be a string'] 
      });
    });
  });

  describe('validateProductName', () => {
    it('should validate correct product names', () => {
      expect(validateProductName('Organic Whole Milk')).toEqual({ isValid: true, errors: [] });
      expect(validateProductName('A')).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid product names', () => {
      expect(validateProductName('')).toEqual({ 
        isValid: false, 
        errors: ['Product name is required and must be a string'] 
      });
      expect(validateProductName('   ')).toEqual({ 
        isValid: false, 
        errors: ['Product name cannot be empty'] 
      });
      expect(validateProductName('a'.repeat(201))).toEqual({ 
        isValid: false, 
        errors: ['Product name cannot exceed 200 characters'] 
      });
    });

    it('should reject non-string product names', () => {
      expect(validateProductName(null as any)).toEqual({ 
        isValid: false, 
        errors: ['Product name is required and must be a string'] 
      });
      expect(validateProductName(123 as any)).toEqual({ 
        isValid: false, 
        errors: ['Product name is required and must be a string'] 
      });
    });
  });

  describe('validateIngredients', () => {
    it('should validate correct ingredients arrays', () => {
      expect(validateIngredients(['milk', 'sugar'])).toEqual({ isValid: true, errors: [] });
      expect(validateIngredients(['organic milk', 'vitamin d3'])).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid ingredients arrays', () => {
      expect(validateIngredients([])).toEqual({ 
        isValid: false, 
        errors: ['At least one ingredient is required'] 
      });
      expect(validateIngredients(['milk', ''])).toEqual({ 
        isValid: false, 
        errors: ['Ingredient at index 1 must be a non-empty string'] 
      });
      expect(validateIngredients(['milk', 'a'.repeat(101)])).toEqual({ 
        isValid: false, 
        errors: ['Ingredient at index 1 cannot exceed 100 characters'] 
      });
    });

    it('should reject non-array ingredients', () => {
      expect(validateIngredients('milk' as any)).toEqual({ 
        isValid: false, 
        errors: ['Ingredients must be an array'] 
      });
      expect(validateIngredients(null as any)).toEqual({ 
        isValid: false, 
        errors: ['Ingredients must be an array'] 
      });
    });
  });

  describe('validateAllergens', () => {
    it('should validate correct allergens arrays', () => {
      expect(validateAllergens(['milk', 'eggs'])).toEqual({ isValid: true, errors: [] });
      expect(validateAllergens([])).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid allergens arrays', () => {
      expect(validateAllergens(['milk', ''])).toEqual({ 
        isValid: false, 
        errors: ['Allergen at index 1 must be a non-empty string'] 
      });
      expect(validateAllergens(['milk', 'a'.repeat(51)])).toEqual({ 
        isValid: false, 
        errors: ['Allergen at index 1 cannot exceed 50 characters'] 
      });
    });

    it('should reject non-array allergens', () => {
      expect(validateAllergens('milk' as any)).toEqual({ 
        isValid: false, 
        errors: ['Allergens must be an array'] 
      });
    });
  });

  describe('validateConfidence', () => {
    it('should validate correct confidence scores', () => {
      expect(validateConfidence(0)).toEqual({ isValid: true, errors: [] });
      expect(validateConfidence(0.5)).toEqual({ isValid: true, errors: [] });
      expect(validateConfidence(1)).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid confidence scores', () => {
      expect(validateConfidence(-0.1)).toEqual({ 
        isValid: false, 
        errors: ['Confidence must be between 0 and 1'] 
      });
      expect(validateConfidence(1.1)).toEqual({ 
        isValid: false, 
        errors: ['Confidence must be between 0 and 1'] 
      });
      expect(validateConfidence(NaN)).toEqual({ 
        isValid: false, 
        errors: ['Confidence cannot be NaN'] 
      });
    });

    it('should reject non-number confidence scores', () => {
      expect(validateConfidence('0.5' as any)).toEqual({ 
        isValid: false, 
        errors: ['Confidence must be a number'] 
      });
    });
  });

  describe('validateProductSource', () => {
    it('should validate correct product sources', () => {
      PRODUCT_SOURCES.forEach(source => {
        expect(validateProductSource(source)).toEqual({ isValid: true, errors: [] });
      });
    });

    it('should reject invalid product sources', () => {
      expect(validateProductSource('invalid' as any)).toEqual({ 
        isValid: false, 
        errors: ['Product source must be one of: manual, openfoodfacts, usda'] 
      });
      expect(validateProductSource('' as any)).toEqual({ 
        isValid: false, 
        errors: ['Product source is required and must be a string'] 
      });
    });

    it('should reject non-string product sources', () => {
      expect(validateProductSource(null as any)).toEqual({ 
        isValid: false, 
        errors: ['Product source is required and must be a string'] 
      });
    });
  });

  describe('validateDietaryFlags', () => {
    it('should validate correct dietary flags', () => {
      const validFlags: DietaryFlags = {
        halal: true,
        kosher: false,
        vegan: undefined,
        vegetarian: true,
        glutenFree: false
      };
      expect(validateDietaryFlags(validFlags)).toEqual({ isValid: true, errors: [] });
      expect(validateDietaryFlags({})).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid dietary flags', () => {
      expect(validateDietaryFlags({ invalid: true } as any)).toEqual({ 
        isValid: false, 
        errors: ['Invalid dietary flag: invalid'] 
      });
      expect(validateDietaryFlags({ halal: 'yes' } as any)).toEqual({ 
        isValid: false, 
        errors: ['Dietary flag halal must be a boolean or undefined'] 
      });
    });

    it('should reject non-object dietary flags', () => {
      expect(validateDietaryFlags(null as any)).toEqual({ 
        isValid: false, 
        errors: ['Dietary flags must be an object'] 
      });
      expect(validateDietaryFlags('flags' as any)).toEqual({ 
        isValid: false, 
        errors: ['Dietary flags must be an object'] 
      });
    });
  });

  describe('validateNutritionalInfo', () => {
    it('should validate correct nutritional info', () => {
      const validInfo: NutritionalInfo = {
        calories: 150,
        sodium: 100,
        sugar: 12
      };
      expect(validateNutritionalInfo(validInfo)).toEqual({ isValid: true, errors: [] });
      expect(validateNutritionalInfo(undefined)).toEqual({ isValid: true, errors: [] });
      expect(validateNutritionalInfo({})).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid nutritional info', () => {
      expect(validateNutritionalInfo({ invalid: 100 } as any)).toEqual({ 
        isValid: false, 
        errors: ['Invalid nutritional info field: invalid'] 
      });
      expect(validateNutritionalInfo({ calories: -10 } as any)).toEqual({ 
        isValid: false, 
        errors: ['Nutritional info calories must be a non-negative number'] 
      });
      expect(validateNutritionalInfo({ calories: 'high' } as any)).toEqual({ 
        isValid: false, 
        errors: ['Nutritional info calories must be a non-negative number'] 
      });
    });

    it('should reject non-object nutritional info', () => {
      expect(validateNutritionalInfo('info' as any)).toEqual({ 
        isValid: false, 
        errors: ['Nutritional info must be an object'] 
      });
    });
  });

  describe('validateProduct', () => {
    const validProduct: Product = {
      upc: '123456789012',
      name: 'Organic Whole Milk',
      brand: 'Horizon',
      ingredients: ['organic milk', 'vitamin d3'],
      allergens: ['milk'],
      dietaryFlags: {
        halal: true,
        kosher: false,
        vegan: false,
        vegetarian: true,
        glutenFree: true
      },
      nutritionalInfo: {
        calories: 150,
        sodium: 100,
        sugar: 12
      },
      imageUrl: 'https://example.com/image.jpg',
      source: 'openfoodfacts',
      lastUpdated: new Date(),
      confidence: 0.95
    };

    it('should validate a complete valid product', () => {
      expect(validateProduct(validProduct)).toEqual({ isValid: true, errors: [] });
    });

    it('should validate a minimal valid product', () => {
      const minimalProduct: Product = {
        upc: '123456789012',
        name: 'Test Product',
        ingredients: ['ingredient1'],
        allergens: [],
        dietaryFlags: {},
        source: 'manual',
        lastUpdated: new Date(),
        confidence: 0.8
      };
      expect(validateProduct(minimalProduct)).toEqual({ isValid: true, errors: [] });
    });

    it('should reject product with missing required fields', () => {
      const invalidProduct = { ...validProduct };
      delete (invalidProduct as any).upc;
      delete (invalidProduct as any).name;
      
      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('UPC is required');
      expect(result.errors).toContain('Product name is required');
    });

    it('should reject product with invalid field values', () => {
      const invalidProduct = {
        ...validProduct,
        upc: 'invalid-upc',
        confidence: 2.0,
        source: 'invalid-source' as any
      };
      
      const result = validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateCreateProductInput', () => {
    const validInput: CreateProductInput = {
      upc: '123456789012',
      name: 'Test Product',
      ingredients: ['ingredient1'],
      allergens: ['milk'],
      dietaryFlags: { vegan: false },
      source: 'manual',
      confidence: 0.8
    };

    it('should validate correct create product input', () => {
      expect(validateCreateProductInput(validInput)).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid create product input', () => {
      const invalidInput = { ...validInput };
      delete (invalidInput as any).upc;
      
      const result = validateCreateProductInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('UPC is required');
    });
  });

  describe('validateUpdateProductInput', () => {
    it('should validate correct update product input', () => {
      const validInput: UpdateProductInput = {
        name: 'Updated Product Name',
        confidence: 0.9
      };
      expect(validateUpdateProductInput(validInput)).toEqual({ isValid: true, errors: [] });
    });

    it('should validate empty update product input', () => {
      expect(validateUpdateProductInput({})).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid update product input', () => {
      const invalidInput: UpdateProductInput = {
        name: '',
        confidence: 2.0
      };
      
      const result = validateUpdateProductInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('ProductModel', () => {
    const validProductData: Product = {
      upc: '123456789012',
      name: 'Organic Whole Milk',
      brand: 'Horizon',
      ingredients: ['organic milk', 'vitamin d3'],
      allergens: ['milk'],
      dietaryFlags: {
        halal: true,
        kosher: false,
        vegan: false,
        vegetarian: true,
        glutenFree: true
      },
      nutritionalInfo: {
        calories: 150,
        sodium: 100,
        sugar: 12
      },
      imageUrl: 'https://example.com/image.jpg',
      source: 'openfoodfacts',
      lastUpdated: new Date(),
      confidence: 0.95
    };

    it('should create a ProductModel instance', () => {
      const product = new ProductModel(validProductData);
      expect(product.upc).toBe(validProductData.upc);
      expect(product.name).toBe(validProductData.name);
      expect(product.brand).toBe(validProductData.brand);
    });

    it('should check if product contains allergen', () => {
      const product = new ProductModel(validProductData);
      expect(product.containsAllergen('milk')).toBe(true);
      expect(product.containsAllergen('nuts')).toBe(false);
    });

    it('should format ingredients list', () => {
      const product = new ProductModel(validProductData);
      expect(product.getFormattedIngredients()).toBe('organic milk, vitamin d3');
    });

    it('should check dietary requirements', () => {
      const product = new ProductModel(validProductData);
      expect(product.meetsDietaryRequirement('halal')).toBe(true);
      expect(product.meetsDietaryRequirement('vegan')).toBe(false);
    });

    it('should calculate data age', () => {
      const product = new ProductModel(validProductData);
      const age = product.getDataAge();
      expect(age).toBeGreaterThanOrEqual(0);
    });

    it('should check if data is stale', () => {
      const product = new ProductModel(validProductData);
      expect(product.isDataStale()).toBe(false);
      
      // Test with old date
      const oldProduct = new ProductModel({
        ...validProductData,
        lastUpdated: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) // 31 days ago
      });
      expect(oldProduct.isDataStale()).toBe(true);
    });

    it('should validate product instance', () => {
      const product = new ProductModel(validProductData);
      const result = product.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('Constants', () => {
    it('should export common allergens', () => {
      expect(COMMON_ALLERGENS).toContain('milk');
      expect(COMMON_ALLERGENS).toContain('eggs');
      expect(COMMON_ALLERGENS).toContain('peanuts');
      expect(COMMON_ALLERGENS.length).toBe(9);
    });

    it('should export product sources', () => {
      expect(PRODUCT_SOURCES).toContain('manual');
      expect(PRODUCT_SOURCES).toContain('openfoodfacts');
      expect(PRODUCT_SOURCES).toContain('usda');
      expect(PRODUCT_SOURCES.length).toBe(3);
    });
  });
});