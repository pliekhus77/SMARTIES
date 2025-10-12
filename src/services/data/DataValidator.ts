/**
 * DataValidator Service for Product Data Validation
 * Implements Requirements 2.2 and 2.5 from data schema specification
 * 
 * Features:
 * - UPC code validation with multiple format support
 * - Required field validation for product data
 * - Data quality scoring and completeness checking
 * - OpenFoodFacts specific validation rules
 */

import { CreateProductInput, ValidationResult } from '../../types/Product';

/**
 * Validation configuration options
 */
export interface ValidationConfig {
  strictUPCValidation?: boolean;    // Enforce strict UPC format validation
  requireIngredients?: boolean;     // Require ingredients text
  requireAllergens?: boolean;       // Require allergens information
  minProductNameLength?: number;    // Minimum product name length
  maxProductNameLength?: number;    // Maximum product name length
  minIngredientsLength?: number;    // Minimum ingredients text length
  maxIngredientsLength?: number;    // Maximum ingredients text length
  minDataQualityScore?: number;     // Minimum acceptable data quality score
  allowedSources?: string[];        // Allowed product sources
}

/**
 * Detailed validation result with field-specific errors
 */
export interface DetailedValidationResult extends ValidationResult {
  fieldErrors: Record<string, string[]>;
  warnings: string[];
  dataQualityScore: number;
  completenessScore: number;
}

/**
 * UPC validation result with format information
 */
export interface UPCValidationResult extends ValidationResult {
  format?: 'UPC-A' | 'UPC-E' | 'EAN-13' | 'EAN-8' | 'GTIN-14';
  cleanedCode?: string;
  checkDigitValid?: boolean;
}

/**
 * DataValidator class for comprehensive product data validation
 */
export class DataValidator {
  private config: ValidationConfig;
  
  constructor(config: ValidationConfig = {}) {
    this.config = {
      strictUPCValidation: true,
      requireIngredients: true,
      requireAllergens: false,
      minProductNameLength: 2,
      maxProductNameLength: 200,
      minIngredientsLength: 5,
      maxIngredientsLength: 2000,
      minDataQualityScore: 0.3,
      allowedSources: ['openfoodfacts', 'usda', 'manual'],
      ...config
    };
  }
  
  /**
   * Validates a complete CreateProductInput object
   */
  validateProduct(input: CreateProductInput): DetailedValidationResult {
    const fieldErrors: Record<string, string[]> = {};
    const warnings: string[] = [];
    const allErrors: string[] = [];
    
    // Validate UPC code
    const upcValidation = this.validateUPC(input.code);
    if (!upcValidation.isValid) {
      fieldErrors.code = upcValidation.errors;
      allErrors.push(...upcValidation.errors);
    }
    
    // Validate product name
    const nameValidation = this.validateProductName(input.product_name);
    if (!nameValidation.isValid) {
      fieldErrors.product_name = nameValidation.errors;
      allErrors.push(...nameValidation.errors);
    }
    
    // Validate ingredients
    if (this.config.requireIngredients) {
      const ingredientsValidation = this.validateIngredientsText(input.ingredients_text);
      if (!ingredientsValidation.isValid) {
        fieldErrors.ingredients_text = ingredientsValidation.errors;
        allErrors.push(...ingredientsValidation.errors);
      }
    }
    
    // Validate allergens
    const allergensValidation = this.validateAllergensTags(input.allergens_tags);
    if (!allergensValidation.isValid) {
      fieldErrors.allergens_tags = allergensValidation.errors;
      allErrors.push(...allergensValidation.errors);
    }
    
    // Validate data quality score
    const qualityValidation = this.validateDataQualityScore(input.data_quality_score);
    if (!qualityValidation.isValid) {
      fieldErrors.data_quality_score = qualityValidation.errors;
      allErrors.push(...qualityValidation.errors);
    }
    
    // Validate source
    const sourceValidation = this.validateSource(input.source);
    if (!sourceValidation.isValid) {
      fieldErrors.source = sourceValidation.errors;
      allErrors.push(...sourceValidation.errors);
    }
    
    // Validate optional fields if present
    if (input.brands_tags) {
      const brandsValidation = this.validateStringArray(input.brands_tags, 'brands_tags', 1, 50);
      if (!brandsValidation.isValid) {
        fieldErrors.brands_tags = brandsValidation.errors;
        allErrors.push(...brandsValidation.errors);
      }
    }
    
    if (input.categories_tags) {
      const categoriesValidation = this.validateStringArray(input.categories_tags, 'categories_tags', 1, 100);
      if (!categoriesValidation.isValid) {
        fieldErrors.categories_tags = categoriesValidation.errors;
        allErrors.push(...categoriesValidation.errors);
      }
    }
    
    if (input.ingredients_tags) {
      const ingredientTagsValidation = this.validateStringArray(input.ingredients_tags, 'ingredients_tags', 1, 50);
      if (!ingredientTagsValidation.isValid) {
        fieldErrors.ingredients_tags = ingredientTagsValidation.errors;
        allErrors.push(...ingredientTagsValidation.errors);
      }
    }
    
    if (input.labels_tags) {
      const labelsValidation = this.validateStringArray(input.labels_tags, 'labels_tags', 1, 50);
      if (!labelsValidation.isValid) {
        fieldErrors.labels_tags = labelsValidation.errors;
        allErrors.push(...labelsValidation.errors);
      }
    }
    
    // Validate nutritional info if present
    if (input.nutritionalInfo) {
      const nutritionValidation = this.validateNutritionalInfo(input.nutritionalInfo);
      if (!nutritionValidation.isValid) {
        fieldErrors.nutritionalInfo = nutritionValidation.errors;
        allErrors.push(...nutritionValidation.errors);
      }
    }
    
    // Validate image URL if present
    if (input.imageUrl) {
      const imageValidation = this.validateImageUrl(input.imageUrl);
      if (!imageValidation.isValid) {
        fieldErrors.imageUrl = imageValidation.errors;
        allErrors.push(...imageValidation.errors);
      }
    }
    
    // Generate warnings for data quality issues
    this.generateWarnings(input, warnings);
    
    // Calculate scores
    const dataQualityScore = this.calculateDataQualityScore(input);
    const completenessScore = this.calculateCompletenessScore(input);
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      fieldErrors,
      warnings,
      dataQualityScore,
      completenessScore
    };
  }
  
  /**
   * Validates UPC code with comprehensive format checking
   */
  validateUPC(code: string): UPCValidationResult {
    const errors: string[] = [];
    
    if (!code || typeof code !== 'string') {
      errors.push('UPC code is required and must be a string');
      return { isValid: false, errors };
    }
    
    // Clean the code (remove spaces, dashes, other non-numeric characters)
    const cleanedCode = code.replace(/[^\d]/g, '');
    
    if (cleanedCode.length === 0) {
      errors.push('UPC code must contain at least one digit');
      return { isValid: false, errors };
    }
    
    // Validate format and length
    let format: UPCValidationResult['format'];
    let checkDigitValid = false;
    
    switch (cleanedCode.length) {
      case 8:
        format = 'EAN-8';
        checkDigitValid = this.validateEAN8CheckDigit(cleanedCode);
        break;
      case 12:
        format = 'UPC-A';
        checkDigitValid = this.validateUPCACheckDigit(cleanedCode);
        break;
      case 13:
        format = 'EAN-13';
        checkDigitValid = this.validateEAN13CheckDigit(cleanedCode);
        break;
      case 14:
        format = 'GTIN-14';
        checkDigitValid = this.validateGTIN14CheckDigit(cleanedCode);
        break;
      default:
        errors.push(`Invalid UPC length: ${cleanedCode.length}. Must be 8, 12, 13, or 14 digits`);
        return { isValid: false, errors };
    }
    
    // Check digit validation (optional for non-strict mode)
    if (this.config.strictUPCValidation && !checkDigitValid) {
      errors.push(`Invalid ${format} check digit`);
    } else if (!checkDigitValid) {
      // Add as warning in non-strict mode
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      format,
      cleanedCode,
      checkDigitValid
    };
  }
  
  /**
   * Validates product name
   */
  validateProductName(name: string): ValidationResult {
    const errors: string[] = [];
    
    if (!name || typeof name !== 'string') {
      errors.push('Product name is required and must be a string');
      return { isValid: false, errors };
    }
    
    const trimmedName = name.trim();
    
    if (trimmedName.length === 0) {
      errors.push('Product name cannot be empty');
    } else if (trimmedName.length < this.config.minProductNameLength!) {
      errors.push(`Product name must be at least ${this.config.minProductNameLength} characters`);
    } else if (trimmedName.length > this.config.maxProductNameLength!) {
      errors.push(`Product name cannot exceed ${this.config.maxProductNameLength} characters`);
    }
    
    // Check for suspicious patterns
    if (/^[A-Z\s]+$/.test(trimmedName) && trimmedName.length > 10) {
      // All caps might indicate poor data quality, but not invalid
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validates ingredients text
   */
  validateIngredientsText(ingredients: string): ValidationResult {
    const errors: string[] = [];
    
    if (!ingredients || typeof ingredients !== 'string') {
      errors.push('Ingredients text is required and must be a string');
      return { isValid: false, errors };
    }
    
    const trimmedIngredients = ingredients.trim();
    
    if (trimmedIngredients.length === 0) {
      errors.push('Ingredients text cannot be empty');
    } else if (trimmedIngredients.length < this.config.minIngredientsLength!) {
      errors.push(`Ingredients text must be at least ${this.config.minIngredientsLength} characters`);
    } else if (trimmedIngredients.length > this.config.maxIngredientsLength!) {
      errors.push(`Ingredients text cannot exceed ${this.config.maxIngredientsLength} characters`);
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validates allergens tags array
   */
  validateAllergensTags(allergens: string[]): ValidationResult {
    const errors: string[] = [];
    
    if (!Array.isArray(allergens)) {
      errors.push('Allergens must be an array');
      return { isValid: false, errors };
    }
    
    allergens.forEach((allergen, index) => {
      if (!allergen || typeof allergen !== 'string') {
        errors.push(`Allergen at index ${index} must be a non-empty string`);
      } else if (allergen.trim().length === 0) {
        errors.push(`Allergen at index ${index} cannot be empty`);
      } else if (allergen.length > 100) {
        errors.push(`Allergen at index ${index} cannot exceed 100 characters`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validates data quality score
   */
  validateDataQualityScore(score: number): ValidationResult {
    const errors: string[] = [];
    
    if (typeof score !== 'number') {
      errors.push('Data quality score must be a number');
    } else if (isNaN(score)) {
      errors.push('Data quality score cannot be NaN');
    } else if (score < 0 || score > 1) {
      errors.push('Data quality score must be between 0 and 1');
    } else if (score < this.config.minDataQualityScore!) {
      errors.push(`Data quality score must be at least ${this.config.minDataQualityScore}`);
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validates product source
   */
  validateSource(source: string): ValidationResult {
    const errors: string[] = [];
    
    if (!source || typeof source !== 'string') {
      errors.push('Product source is required and must be a string');
    } else if (!this.config.allowedSources!.includes(source)) {
      errors.push(`Product source must be one of: ${this.config.allowedSources!.join(', ')}`);
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validates string array fields
   */
  validateStringArray(array: string[], fieldName: string, minLength: number, maxItemLength: number): ValidationResult {
    const errors: string[] = [];
    
    if (!Array.isArray(array)) {
      errors.push(`${fieldName} must be an array`);
      return { isValid: false, errors };
    }
    
    array.forEach((item, index) => {
      if (!item || typeof item !== 'string') {
        errors.push(`${fieldName}[${index}] must be a non-empty string`);
      } else if (item.trim().length < minLength) {
        errors.push(`${fieldName}[${index}] must be at least ${minLength} characters`);
      } else if (item.length > maxItemLength) {
        errors.push(`${fieldName}[${index}] cannot exceed ${maxItemLength} characters`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validates nutritional information
   */
  validateNutritionalInfo(nutrition?: any): ValidationResult {
    const errors: string[] = [];
    
    if (nutrition !== undefined) {
      if (typeof nutrition !== 'object' || nutrition === null) {
        errors.push('Nutritional info must be an object');
        return { isValid: false, errors };
      }
      
      const validFields = ['calories', 'sodium', 'sugar'];
      
      Object.keys(nutrition).forEach(key => {
        if (!validFields.includes(key)) {
          errors.push(`Invalid nutritional info field: ${key}`);
        } else {
          const value = nutrition[key];
          if (value !== undefined && value !== null) {
            if (typeof value !== 'number' || isNaN(value) || value < 0) {
              errors.push(`Nutritional info ${key} must be a non-negative number`);
            }
          }
        }
      });
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Validates image URL
   */
  validateImageUrl(url: string): ValidationResult {
    const errors: string[] = [];
    
    if (typeof url !== 'string') {
      errors.push('Image URL must be a string');
    } else if (url.length > 500) {
      errors.push('Image URL cannot exceed 500 characters');
    } else {
      try {
        new URL(url);
      } catch {
        errors.push('Image URL must be a valid URL');
      }
    }
    
    return { isValid: errors.length === 0, errors };
  }
  
  /**
   * Generates warnings for potential data quality issues
   */
  private generateWarnings(input: CreateProductInput, warnings: string[]): void {
    // Check for missing optional but important fields
    if (!input.brands_tags || input.brands_tags.length === 0) {
      warnings.push('No brand information provided');
    }
    
    if (!input.categories_tags || input.categories_tags.length === 0) {
      warnings.push('No category information provided');
    }
    
    if (!input.ingredients_tags || input.ingredients_tags.length === 0) {
      warnings.push('No structured ingredient tags provided');
    }
    
    if (!input.nutritionalInfo) {
      warnings.push('No nutritional information provided');
    }
    
    if (!input.imageUrl) {
      warnings.push('No product image provided');
    }
    
    // Check for data quality indicators
    if (input.data_quality_score < 0.5) {
      warnings.push('Low data quality score detected');
    }
    
    if (input.completeness_score && input.completeness_score < 0.7) {
      warnings.push('Low data completeness score detected');
    }
    
    // Check for suspicious patterns
    if (input.product_name.length < 5) {
      warnings.push('Very short product name may indicate incomplete data');
    }
    
    if (input.ingredients_text.length < 20) {
      warnings.push('Very short ingredients text may indicate incomplete data');
    }
  }
  
  /**
   * Calculates overall data quality score
   */
  private calculateDataQualityScore(input: CreateProductInput): number {
    let score = input.data_quality_score;
    
    // Adjust score based on validation results
    if (!input.brands_tags || input.brands_tags.length === 0) score -= 0.1;
    if (!input.categories_tags || input.categories_tags.length === 0) score -= 0.1;
    if (!input.nutritionalInfo) score -= 0.1;
    if (!input.imageUrl) score -= 0.05;
    
    return Math.max(0.0, Math.min(1.0, score));
  }
  
  /**
   * Calculates data completeness score
   */
  private calculateCompletenessScore(input: CreateProductInput): number {
    let filledFields = 0;
    const totalFields = 12;
    
    // Required fields
    if (input.code) filledFields++;
    if (input.product_name) filledFields++;
    if (input.ingredients_text) filledFields++;
    if (input.source) filledFields++;
    
    // Optional but important fields
    if (input.brands_tags && input.brands_tags.length > 0) filledFields++;
    if (input.categories_tags && input.categories_tags.length > 0) filledFields++;
    if (input.ingredients_tags && input.ingredients_tags.length > 0) filledFields++;
    if (input.allergens_tags && input.allergens_tags.length > 0) filledFields++;
    if (input.labels_tags && input.labels_tags.length > 0) filledFields++;
    if (input.nutritionalInfo) filledFields++;
    if (input.imageUrl) filledFields++;
    if (input.ingredients_analysis_tags && input.ingredients_analysis_tags.length > 0) filledFields++;
    
    return filledFields / totalFields;
  }
  
  // Check digit validation methods
  
  private validateUPCACheckDigit(code: string): boolean {
    if (code.length !== 12) return false;
    
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      const digit = parseInt(code[i]);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(code[11]);
  }
  
  private validateEAN13CheckDigit(code: string): boolean {
    if (code.length !== 13) return false;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(code[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(code[12]);
  }
  
  private validateEAN8CheckDigit(code: string): boolean {
    if (code.length !== 8) return false;
    
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const digit = parseInt(code[i]);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(code[7]);
  }
  
  private validateGTIN14CheckDigit(code: string): boolean {
    if (code.length !== 14) return false;
    
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const digit = parseInt(code[i]);
      sum += i % 2 === 0 ? digit * 3 : digit;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(code[13]);
  }
}

/**
 * Utility function to create DataValidator with common configurations
 */
export function createDataValidator(config: Partial<ValidationConfig> = {}): DataValidator {
  return new DataValidator(config);
}

/**
 * Quick validation function for UPC codes
 */
export function validateUPCQuick(code: string): boolean {
  const validator = new DataValidator({ strictUPCValidation: false });
  const result = validator.validateUPC(code);
  return result.isValid;
}

/**
 * Quick validation function for product data
 */
export function validateProductQuick(input: CreateProductInput): boolean {
  const validator = new DataValidator();
  const result = validator.validateProduct(input);
  return result.isValid;
}