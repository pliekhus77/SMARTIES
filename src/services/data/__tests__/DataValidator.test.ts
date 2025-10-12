/**
 * Unit tests for DataValidator service
 * Tests UPC validation, product validation, and data quality checks
 */

import { DataValidator, createDataValidator, validateUPCQuick, validateProductQuick } from '../DataValidator';
import { CreateProductInput } from '../../../types/Product';

describe('DataValidator', () => {
  let validator: DataValidator;
  
  beforeEach(() => {
    validator = createDataValidator({
      strictUPCValidation: true,
      requireIngredients: true,
      minDataQualityScore: 0.3
    });
  });
  
  describe('validateUPC', () => {
    it('should validate correct UPC-A codes (12 digits)', () => {
      const result = validator.validateUPC('123456789012');
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('UPC-A');
      expect(result.cleanedCode).toBe('123456789012');
    });
    
    it('should validate correct EAN-13 codes (13 digits)', () => {
      // Use a valid EAN-13 with correct check digit
      const result = validator.validateUPC('4006381333931');
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('EAN-13');
      expect(result.cleanedCode).toBe('4006381333931');
    });
    
    it('should validate correct EAN-8 codes (8 digits)', () => {
      // Use a valid EAN-8 with correct check digit
      const result = validator.validateUPC('96385074');
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('EAN-8');
      expect(result.cleanedCode).toBe('96385074');
    });
    
    it('should validate correct GTIN-14 codes (14 digits)', () => {
      // For GTIN-14, let's use a lenient validator since we don't have a known valid one
      const lenientValidator = createDataValidator({ strictUPCValidation: false });
      const result = lenientValidator.validateUPC('12345678901234');
      expect(result.isValid).toBe(true);
      expect(result.format).toBe('GTIN-14');
      expect(result.cleanedCode).toBe('12345678901234');
    });
    
    it('should clean UPC codes with spaces and dashes', () => {
      const result = validator.validateUPC('123-456-789-012');
      expect(result.isValid).toBe(true);
      expect(result.cleanedCode).toBe('123456789012');
    });
    
    it('should reject invalid UPC lengths', () => {
      expect(validator.validateUPC('123').isValid).toBe(false);
      expect(validator.validateUPC('12345').isValid).toBe(false);
      expect(validator.validateUPC('123456789').isValid).toBe(false);
      expect(validator.validateUPC('123456789012345').isValid).toBe(false);
    });
    
    it('should reject non-numeric UPC codes', () => {
      expect(validator.validateUPC('abcdefghijkl').isValid).toBe(false);
      expect(validator.validateUPC('123456789abc').isValid).toBe(false);
      expect(validator.validateUPC('').isValid).toBe(false);
    });
    
    it('should handle null and undefined UPC codes', () => {
      expect(validator.validateUPC(null as any).isValid).toBe(false);
      expect(validator.validateUPC(undefined as any).isValid).toBe(false);
    });
    
    it('should validate check digits in strict mode', () => {
      // Valid UPC-A with correct check digit
      const validUPC = '036000291452'; // Coca-Cola UPC
      const result = validator.validateUPC(validUPC);
      expect(result.checkDigitValid).toBe(true);
    });
  });
  
  describe('validateProductName', () => {
    it('should validate correct product names', () => {
      const result = validator.validateProductName('Chocolate Chip Cookies');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject empty product names', () => {
      expect(validator.validateProductName('').isValid).toBe(false);
      expect(validator.validateProductName('   ').isValid).toBe(false);
      expect(validator.validateProductName(null as any).isValid).toBe(false);
    });
    
    it('should reject product names that are too short', () => {
      const validator = createDataValidator({ minProductNameLength: 5 });
      expect(validator.validateProductName('Hi').isValid).toBe(false);
    });
    
    it('should reject product names that are too long', () => {
      const validator = createDataValidator({ maxProductNameLength: 10 });
      const longName = 'This is a very long product name that exceeds the limit';
      expect(validator.validateProductName(longName).isValid).toBe(false);
    });
  });
  
  describe('validateIngredientsText', () => {
    it('should validate correct ingredients text', () => {
      const result = validator.validateIngredientsText('flour, sugar, chocolate chips, salt');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject empty ingredients text', () => {
      expect(validator.validateIngredientsText('').isValid).toBe(false);
      expect(validator.validateIngredientsText('   ').isValid).toBe(false);
      expect(validator.validateIngredientsText(null as any).isValid).toBe(false);
    });
    
    it('should reject ingredients text that is too short', () => {
      const validator = createDataValidator({ minIngredientsLength: 20 });
      expect(validator.validateIngredientsText('flour').isValid).toBe(false);
    });
    
    it('should reject ingredients text that is too long', () => {
      const validator = createDataValidator({ maxIngredientsLength: 50 });
      const longIngredients = 'flour, sugar, chocolate chips, salt, vanilla extract, baking soda, eggs, butter, milk, and many more ingredients';
      expect(validator.validateIngredientsText(longIngredients).isValid).toBe(false);
    });
  });
  
  describe('validateAllergensTags', () => {
    it('should validate correct allergens arrays', () => {
      const result = validator.validateAllergensTags(['en:milk', 'en:eggs', 'en:gluten']);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should validate empty allergens arrays', () => {
      const result = validator.validateAllergensTags([]);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject non-array allergens', () => {
      expect(validator.validateAllergensTags('not an array' as any).isValid).toBe(false);
      expect(validator.validateAllergensTags(null as any).isValid).toBe(false);
    });
    
    it('should reject allergens with empty strings', () => {
      const result = validator.validateAllergensTags(['en:milk', '', 'en:eggs']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('index 1'))).toBe(true);
    });
    
    it('should reject allergens with non-string values', () => {
      const result = validator.validateAllergensTags(['en:milk', 123 as any, 'en:eggs']);
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('validateDataQualityScore', () => {
    it('should validate correct quality scores', () => {
      expect(validator.validateDataQualityScore(0.0).isValid).toBe(false); // Below minimum
      expect(validator.validateDataQualityScore(0.3).isValid).toBe(true); // At minimum
      expect(validator.validateDataQualityScore(0.5).isValid).toBe(true);
      expect(validator.validateDataQualityScore(1.0).isValid).toBe(true);
    });
    
    it('should reject quality scores outside valid range', () => {
      expect(validator.validateDataQualityScore(-0.1).isValid).toBe(false);
      expect(validator.validateDataQualityScore(1.1).isValid).toBe(false);
    });
    
    it('should reject non-numeric quality scores', () => {
      expect(validator.validateDataQualityScore('0.5' as any).isValid).toBe(false);
      expect(validator.validateDataQualityScore(NaN).isValid).toBe(false);
      expect(validator.validateDataQualityScore(null as any).isValid).toBe(false);
    });
  });
  
  describe('validateSource', () => {
    it('should validate allowed sources', () => {
      expect(validator.validateSource('openfoodfacts').isValid).toBe(true);
      expect(validator.validateSource('usda').isValid).toBe(true);
      expect(validator.validateSource('manual').isValid).toBe(true);
    });
    
    it('should reject disallowed sources', () => {
      expect(validator.validateSource('unknown').isValid).toBe(false);
      expect(validator.validateSource('').isValid).toBe(false);
      expect(validator.validateSource(null as any).isValid).toBe(false);
    });
  });
  
  describe('validateProduct', () => {
    const validProduct: CreateProductInput = {
      code: '036000291452', // Valid Coca-Cola UPC with correct check digit
      product_name: 'Test Product',
      ingredients_text: 'flour, sugar, chocolate chips',
      allergens_tags: ['en:gluten', 'en:milk'],
      data_quality_score: 0.8,
      source: 'openfoodfacts'
    };
    
    it('should validate a complete valid product', () => {
      const result = validator.validateProduct(validProduct);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.dataQualityScore).toBeGreaterThan(0);
      expect(result.completenessScore).toBeGreaterThan(0);
    });
    
    it('should reject products with missing required fields', () => {
      const invalidProduct = { ...validProduct };
      delete (invalidProduct as any).code;
      
      const result = validator.validateProduct(invalidProduct);
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.code).toBeDefined();
    });
    
    it('should generate warnings for missing optional fields', () => {
      const result = validator.validateProduct(validProduct);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(warning => warning.includes('brand'))).toBe(true);
    });
    
    it('should calculate completeness score correctly', () => {
      const completeProduct: CreateProductInput = {
        ...validProduct,
        brands_tags: ['test-brand'],
        categories_tags: ['en:snacks'],
        ingredients_tags: ['en:flour', 'en:sugar'],
        labels_tags: ['en:organic'],
        nutritionalInfo: { calories: 450 },
        imageUrl: 'https://example.com/image.jpg'
      };
      
      const result = validator.validateProduct(completeProduct);
      expect(result.completenessScore).toBeGreaterThan(0.8);
    });
    
    it('should validate optional fields when present', () => {
      const productWithOptionals: CreateProductInput = {
        ...validProduct,
        brands_tags: ['valid-brand'],
        categories_tags: ['en:snacks'],
        nutritionalInfo: { calories: 450, sodium: 200 },
        imageUrl: 'https://example.com/image.jpg'
      };
      
      const result = validator.validateProduct(productWithOptionals);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject products with invalid optional fields', () => {
      const productWithInvalidOptionals: CreateProductInput = {
        ...validProduct,
        nutritionalInfo: { calories: -100 }, // Invalid negative calories
        imageUrl: 'not-a-valid-url'
      };
      
      const result = validator.validateProduct(productWithInvalidOptionals);
      expect(result.isValid).toBe(false);
      expect(result.fieldErrors.nutritionalInfo).toBeDefined();
      expect(result.fieldErrors.imageUrl).toBeDefined();
    });
  });
  
  describe('validateNutritionalInfo', () => {
    it('should validate correct nutritional info', () => {
      const nutrition = { calories: 450, sodium: 200, sugar: 25 };
      const result = validator.validateNutritionalInfo(nutrition);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject negative nutritional values', () => {
      const nutrition = { calories: -100, sodium: 200 };
      const result = validator.validateNutritionalInfo(nutrition);
      expect(result.isValid).toBe(false);
    });
    
    it('should reject invalid nutritional fields', () => {
      const nutrition = { calories: 450, invalidField: 100 };
      const result = validator.validateNutritionalInfo(nutrition);
      expect(result.isValid).toBe(false);
    });
    
    it('should handle undefined nutritional info', () => {
      const result = validator.validateNutritionalInfo(undefined);
      expect(result.isValid).toBe(true);
    });
  });
  
  describe('validateImageUrl', () => {
    it('should validate correct URLs', () => {
      expect(validator.validateImageUrl('https://example.com/image.jpg').isValid).toBe(true);
      expect(validator.validateImageUrl('http://example.com/image.png').isValid).toBe(true);
    });
    
    it('should reject invalid URLs', () => {
      expect(validator.validateImageUrl('not-a-url').isValid).toBe(false);
      expect(validator.validateImageUrl('').isValid).toBe(false);
    });
    
    it('should reject URLs that are too long', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(500);
      expect(validator.validateImageUrl(longUrl).isValid).toBe(false);
    });
  });
  
  describe('check digit validation', () => {
    it('should validate UPC-A check digits correctly', () => {
      // Test with known valid UPC-A codes
      expect((validator as any).validateUPCACheckDigit('036000291452')).toBe(true); // Coca-Cola
      expect((validator as any).validateUPCACheckDigit('012345678905')).toBe(true); // Test code
      expect((validator as any).validateUPCACheckDigit('123456789013')).toBe(false); // Invalid check digit
    });
    
    it('should validate EAN-13 check digits correctly', () => {
      expect((validator as any).validateEAN13CheckDigit('4006381333931')).toBe(true); // Valid EAN-13
      expect((validator as any).validateEAN13CheckDigit('1234567890123')).toBe(false); // Invalid check digit
    });
    
    it('should validate EAN-8 check digits correctly', () => {
      expect((validator as any).validateEAN8CheckDigit('96385074')).toBe(true); // Valid EAN-8
      expect((validator as any).validateEAN8CheckDigit('12345678')).toBe(false); // Invalid check digit
    });
  });
  
  describe('utility functions', () => {
    it('validateUPCQuick should work correctly', () => {
      expect(validateUPCQuick('1234567890123')).toBe(true);
      expect(validateUPCQuick('invalid')).toBe(false);
    });
    
    it('validateProductQuick should work correctly', () => {
      const validProduct: CreateProductInput = {
        code: '036000291452', // Valid Coca-Cola UPC with correct check digit
        product_name: 'Test Product',
        ingredients_text: 'flour, sugar',
        allergens_tags: [],
        data_quality_score: 0.8,
        source: 'openfoodfacts'
      };
      
      expect(validateProductQuick(validProduct)).toBe(true);
      
      const invalidProduct = { ...validProduct };
      delete (invalidProduct as any).code;
      expect(validateProductQuick(invalidProduct)).toBe(false);
    });
  });
  
  describe('configuration options', () => {
    it('should respect strict UPC validation setting', () => {
      const strictValidator = createDataValidator({ strictUPCValidation: true });
      const lenientValidator = createDataValidator({ strictUPCValidation: false });
      
      const invalidCheckDigitUPC = '123456789013'; // Invalid check digit (should be 2)
      
      expect(strictValidator.validateUPC(invalidCheckDigitUPC).isValid).toBe(false);
      expect(lenientValidator.validateUPC(invalidCheckDigitUPC).isValid).toBe(true);
    });
    
    it('should respect minimum data quality score setting', () => {
      const highQualityValidator = createDataValidator({ minDataQualityScore: 0.8 });
      
      expect(highQualityValidator.validateDataQualityScore(0.5).isValid).toBe(false);
      expect(highQualityValidator.validateDataQualityScore(0.9).isValid).toBe(true);
    });
    

  });
});