/**
 * DataCleaner Service for Product Data Normalization and Cleaning
 * Implements Requirements 2.2 and 2.5 from data schema specification
 * 
 * Features:
 * - Ingredient text normalization and standardization
 * - Brand and category name cleaning
 * - Allergen tag standardization
 * - Text encoding and character normalization
 * - Data deduplication and consistency checks
 */

import { CreateProductInput } from '../../types/Product';
import { DietaryComplianceDeriver, createDietaryComplianceDeriver } from './DietaryComplianceDeriver';

/**
 * Cleaning configuration options
 */
export interface CleaningConfig {
  normalizeUnicode?: boolean;       // Normalize Unicode characters
  standardizeAllergens?: boolean;   // Standardize allergen names
  cleanIngredients?: boolean;       // Clean and normalize ingredients text
  deduplicateTags?: boolean;        // Remove duplicate tags
  trimWhitespace?: boolean;         // Trim whitespace from all text fields
  lowercaseTags?: boolean;          // Convert tags to lowercase
  removeEmptyFields?: boolean;      // Remove empty arrays and null values
  maxTagLength?: number;            // Maximum length for individual tags
  ingredientSeparators?: string[];  // Custom ingredient separators
  deriveDietaryFlags?: boolean;     // Whether to derive dietary compliance flags
}

/**
 * Cleaning statistics
 */
export interface CleaningStats {
  fieldsModified: string[];
  duplicatesRemoved: number;
  charactersNormalized: number;
  emptyFieldsRemoved: number;
}

/**
 * Common allergen mappings for standardization
 */
const ALLERGEN_MAPPINGS: Record<string, string> = {
  // English variations
  'milk': 'en:milk',
  'dairy': 'en:milk',
  'lactose': 'en:milk',
  'eggs': 'en:eggs',
  'egg': 'en:eggs',
  'fish': 'en:fish',
  'shellfish': 'en:crustaceans',
  'crustaceans': 'en:crustaceans',
  'tree nuts': 'en:nuts',
  'nuts': 'en:nuts',
  'peanuts': 'en:peanuts',
  'peanut': 'en:peanuts',
  'wheat': 'en:gluten',
  'gluten': 'en:gluten',
  'soybeans': 'en:soybeans',
  'soy': 'en:soybeans',
  'sesame': 'en:sesame',
  'sesame seeds': 'en:sesame',
  
  // French variations
  'lait': 'en:milk',
  'oeufs': 'en:eggs',
  'poisson': 'en:fish',
  'crustacés': 'en:crustaceans',
  'fruits à coque': 'en:nuts',
  'arachides': 'en:peanuts',
  'blé': 'en:gluten',
  'soja': 'en:soybeans',
  'sésame': 'en:sesame',
  
  // Spanish variations
  'leche': 'en:milk',
  'huevos': 'en:eggs',
  'pescado': 'en:fish',
  'mariscos': 'en:crustaceans',
  'frutos secos': 'en:nuts',
  'cacahuetes': 'en:peanuts',
  'trigo': 'en:gluten',
  'soja-es': 'en:soybeans', // Spanish soja
  'sésamo': 'en:sesame'
};

/**
 * Common ingredient cleaning patterns
 */
const INGREDIENT_CLEANING_PATTERNS = [
  // Remove percentage indicators
  { pattern: /\s*\([0-9.,]+%?\)/g, replacement: '' },
  // Normalize parentheses spacing
  { pattern: /\s*\(\s*/g, replacement: ' (' },
  { pattern: /\s*\)\s*/g, replacement: ') ' },
  // Normalize comma spacing
  { pattern: /\s*,\s*/g, replacement: ', ' },
  // Remove multiple spaces
  { pattern: /\s+/g, replacement: ' ' },
  // Remove leading/trailing punctuation
  { pattern: /^[,.\s]+|[,.\s]+$/g, replacement: '' }
];

/**
 * DataCleaner class for comprehensive product data cleaning
 */
export class DataCleaner {
  private config: CleaningConfig;
  private dietaryDeriver?: DietaryComplianceDeriver;
  
  constructor(config: CleaningConfig = {}) {
    this.config = {
      normalizeUnicode: true,
      standardizeAllergens: true,
      cleanIngredients: true,
      deduplicateTags: true,
      trimWhitespace: true,
      lowercaseTags: true,
      removeEmptyFields: true,
      maxTagLength: 100,
      ingredientSeparators: [',', ';', '|'],
      deriveDietaryFlags: true,
      ...config
    };
    
    // Initialize dietary compliance deriver if needed
    if (this.config.deriveDietaryFlags) {
      this.dietaryDeriver = createDietaryComplianceDeriver();
    }
  }
  
  /**
   * Cleans and normalizes a complete CreateProductInput object
   */
  cleanProduct(input: CreateProductInput): { cleaned: CreateProductInput; stats: CleaningStats } {
    const stats: CleaningStats = {
      fieldsModified: [],
      duplicatesRemoved: 0,
      charactersNormalized: 0,
      emptyFieldsRemoved: 0
    };
    
    const cleaned: CreateProductInput = { ...input };
    
    // Clean UPC code
    const originalCode = cleaned.code;
    cleaned.code = this.cleanUPCCode(cleaned.code);
    if (cleaned.code !== originalCode) {
      stats.fieldsModified.push('code');
    }
    
    // Clean product name
    const originalName = cleaned.product_name;
    cleaned.product_name = this.cleanProductName(cleaned.product_name);
    if (cleaned.product_name !== originalName) {
      stats.fieldsModified.push('product_name');
      stats.charactersNormalized += Math.abs(cleaned.product_name.length - originalName.length);
    }
    
    // Clean ingredients text
    if (this.config.cleanIngredients) {
      const originalIngredients = cleaned.ingredients_text;
      cleaned.ingredients_text = this.cleanIngredientsText(cleaned.ingredients_text);
      if (cleaned.ingredients_text !== originalIngredients) {
        stats.fieldsModified.push('ingredients_text');
        stats.charactersNormalized += Math.abs(cleaned.ingredients_text.length - originalIngredients.length);
      }
    }
    
    // Clean tag arrays
    if (cleaned.brands_tags) {
      const originalLength = cleaned.brands_tags.length;
      cleaned.brands_tags = this.cleanStringArray(cleaned.brands_tags);
      if (cleaned.brands_tags.length !== originalLength) {
        stats.fieldsModified.push('brands_tags');
        stats.duplicatesRemoved += originalLength - cleaned.brands_tags.length;
      }
    }
    
    if (cleaned.categories_tags) {
      const originalLength = cleaned.categories_tags.length;
      cleaned.categories_tags = this.cleanStringArray(cleaned.categories_tags);
      if (cleaned.categories_tags.length !== originalLength) {
        stats.fieldsModified.push('categories_tags');
        stats.duplicatesRemoved += originalLength - cleaned.categories_tags.length;
      }
    }
    
    if (cleaned.ingredients_tags) {
      const originalLength = cleaned.ingredients_tags.length;
      cleaned.ingredients_tags = this.cleanStringArray(cleaned.ingredients_tags);
      if (cleaned.ingredients_tags.length !== originalLength) {
        stats.fieldsModified.push('ingredients_tags');
        stats.duplicatesRemoved += originalLength - cleaned.ingredients_tags.length;
      }
    }
    
    if (cleaned.ingredients_analysis_tags) {
      const originalLength = cleaned.ingredients_analysis_tags.length;
      cleaned.ingredients_analysis_tags = this.cleanStringArray(cleaned.ingredients_analysis_tags);
      if (cleaned.ingredients_analysis_tags.length !== originalLength) {
        stats.fieldsModified.push('ingredients_analysis_tags');
        stats.duplicatesRemoved += originalLength - cleaned.ingredients_analysis_tags.length;
      }
    }
    
    // Clean and standardize allergens
    const originalAllergensLength = cleaned.allergens_tags.length;
    cleaned.allergens_tags = this.cleanAllergensTags(cleaned.allergens_tags);
    if (cleaned.allergens_tags.length !== originalAllergensLength) {
      stats.fieldsModified.push('allergens_tags');
      stats.duplicatesRemoved += originalAllergensLength - cleaned.allergens_tags.length;
    }
    
    if (cleaned.allergens_hierarchy) {
      const originalLength = cleaned.allergens_hierarchy.length;
      cleaned.allergens_hierarchy = this.cleanStringArray(cleaned.allergens_hierarchy);
      if (cleaned.allergens_hierarchy.length !== originalLength) {
        stats.fieldsModified.push('allergens_hierarchy');
        stats.duplicatesRemoved += originalLength - cleaned.allergens_hierarchy.length;
      }
    }
    
    if (cleaned.traces_tags) {
      const originalLength = cleaned.traces_tags.length;
      cleaned.traces_tags = this.cleanAllergensTags(cleaned.traces_tags);
      if (cleaned.traces_tags.length !== originalLength) {
        stats.fieldsModified.push('traces_tags');
        stats.duplicatesRemoved += originalLength - cleaned.traces_tags.length;
      }
    }
    
    if (cleaned.labels_tags) {
      const originalLength = cleaned.labels_tags.length;
      cleaned.labels_tags = this.cleanStringArray(cleaned.labels_tags);
      if (cleaned.labels_tags.length !== originalLength) {
        stats.fieldsModified.push('labels_tags');
        stats.duplicatesRemoved += originalLength - cleaned.labels_tags.length;
      }
    }
    
    // Clean image URL
    if (cleaned.imageUrl) {
      const originalUrl = cleaned.imageUrl;
      cleaned.imageUrl = this.cleanImageUrl(cleaned.imageUrl);
      if (cleaned.imageUrl !== originalUrl) {
        stats.fieldsModified.push('imageUrl');
      }
    }
    
    // Derive dietary compliance flags if configured
    if (this.config.deriveDietaryFlags && this.dietaryDeriver) {
      const originalFlags = cleaned.dietary_flags;
      const derivationResult = this.dietaryDeriver.deriveComplianceFlags(cleaned);
      
      cleaned.dietary_flags = derivationResult.dietary_flags;
      cleaned.data_quality_score = derivationResult.data_quality_score;
      cleaned.completeness_score = derivationResult.completeness_score;
      
      if (JSON.stringify(originalFlags) !== JSON.stringify(cleaned.dietary_flags)) {
        stats.fieldsModified.push('dietary_flags');
      }
      
      if (cleaned.data_quality_score !== input.data_quality_score) {
        stats.fieldsModified.push('data_quality_score');
      }
    }
    
    // Remove empty fields if configured
    if (this.config.removeEmptyFields) {
      const emptyFieldsRemoved = this.removeEmptyFields(cleaned);
      stats.emptyFieldsRemoved = emptyFieldsRemoved;
      if (emptyFieldsRemoved > 0) {
        stats.fieldsModified.push('empty_fields_removed');
      }
    }
    
    return { cleaned, stats };
  }
  
  /**
   * Cleans and normalizes UPC code
   */
  cleanUPCCode(code: string): string {
    if (!code || typeof code !== 'string') {
      return code;
    }
    
    // Remove all non-numeric characters
    let cleaned = code.replace(/[^\d]/g, '');
    
    // Pad with leading zeros if needed for standard formats
    if (cleaned.length === 11) {
      cleaned = '0' + cleaned; // Convert to UPC-A
    } else if (cleaned.length === 7) {
      cleaned = '0' + cleaned; // Convert to EAN-8
    }
    
    return cleaned;
  }
  
  /**
   * Cleans and normalizes product name
   */
  cleanProductName(name: string): string {
    if (!name || typeof name !== 'string') {
      return name;
    }
    
    let cleaned = name;
    
    // Normalize Unicode characters
    if (this.config.normalizeUnicode) {
      cleaned = cleaned.normalize('NFKC');
    }
    
    // Trim whitespace
    if (this.config.trimWhitespace) {
      cleaned = cleaned.trim();
    }
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Fix common encoding issues
    cleaned = cleaned
      .replace(/â€™/g, "'")  // Fix apostrophe encoding
      .replace(/â€œ/g, '"')  // Fix quote encoding
      .replace(/â€/g, '"')   // Fix quote encoding
      .replace(/Ã©/g, 'é')   // Fix é encoding
      .replace(/Ã¨/g, 'è')   // Fix è encoding
      .replace(/Ã /g, 'à')   // Fix à encoding
      .replace(/Ã¼/g, 'ü')   // Fix ü encoding
      .replace(/Ã¶/g, 'ö')   // Fix ö encoding
      .replace(/Ã¤/g, 'ä');  // Fix ä encoding
    
    return cleaned;
  }
  
  /**
   * Cleans and normalizes ingredients text
   */
  cleanIngredientsText(ingredients: string): string {
    if (!ingredients || typeof ingredients !== 'string') {
      return ingredients;
    }
    
    let cleaned = ingredients;
    
    // Normalize Unicode characters
    if (this.config.normalizeUnicode) {
      cleaned = cleaned.normalize('NFKC');
    }
    
    // Apply cleaning patterns
    INGREDIENT_CLEANING_PATTERNS.forEach(({ pattern, replacement }) => {
      cleaned = cleaned.replace(pattern, replacement);
    });
    
    // Fix common encoding issues (same as product name)
    cleaned = cleaned
      .replace(/â€™/g, "'")
      .replace(/â€œ/g, '"')
      .replace(/â€/g, '"')
      .replace(/Ã©/g, 'é')
      .replace(/Ã¨/g, 'è')
      .replace(/Ã /g, 'à')
      .replace(/Ã¼/g, 'ü')
      .replace(/Ã¶/g, 'ö')
      .replace(/Ã¤/g, 'ä');
    
    // Normalize ingredient separators
    this.config.ingredientSeparators!.forEach(separator => {
      if (separator !== ',') {
        cleaned = cleaned.replace(new RegExp(`\\s*\\${separator}\\s*`, 'g'), ', ');
      }
    });
    
    // Final cleanup
    cleaned = cleaned
      .replace(/,\s*,/g, ',')  // Remove double commas
      .replace(/^,\s*|,\s*$/g, '')  // Remove leading/trailing commas
      .trim();
    
    return cleaned;
  }
  
  /**
   * Cleans and deduplicates string arrays
   */
  cleanStringArray(array: string[]): string[] {
    if (!Array.isArray(array)) {
      return array;
    }
    
    let cleaned = array
      .filter(item => item && typeof item === 'string')  // Remove null/undefined/non-string
      .map(item => {
        let cleanItem = item;
        
        // Normalize Unicode
        if (this.config.normalizeUnicode) {
          cleanItem = cleanItem.normalize('NFKC');
        }
        
        // Trim whitespace
        if (this.config.trimWhitespace) {
          cleanItem = cleanItem.trim();
        }
        
        // Convert to lowercase for tags
        if (this.config.lowercaseTags) {
          cleanItem = cleanItem.toLowerCase();
        }
        
        // Truncate if too long
        if (this.config.maxTagLength && cleanItem.length > this.config.maxTagLength) {
          cleanItem = cleanItem.substring(0, this.config.maxTagLength);
        }
        
        return cleanItem;
      })
      .filter(item => item.length > 0);  // Remove empty strings
    
    // Remove duplicates
    if (this.config.deduplicateTags) {
      cleaned = [...new Set(cleaned)];
    }
    
    return cleaned;
  }
  
  /**
   * Cleans and standardizes allergen tags
   */
  cleanAllergensTags(allergens: string[]): string[] {
    if (!Array.isArray(allergens)) {
      return allergens;
    }
    
    let cleaned = this.cleanStringArray(allergens);
    
    // Standardize allergen names
    if (this.config.standardizeAllergens) {
      cleaned = cleaned.map(allergen => {
        const normalized = allergen.toLowerCase().trim();
        return ALLERGEN_MAPPINGS[normalized] || allergen;
      });
    }
    
    // Remove duplicates after standardization
    if (this.config.deduplicateTags) {
      cleaned = [...new Set(cleaned)];
    }
    
    return cleaned;
  }
  
  /**
   * Cleans image URL
   */
  cleanImageUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return url;
    }
    
    let cleaned = url.trim();
    
    // Fix common URL encoding issues
    cleaned = cleaned
      .replace(/\s+/g, '%20')  // Replace spaces with URL encoding
      .replace(/([^:]\/)\/+/g, '$1');  // Remove double slashes (except after protocol)
    
    // Ensure HTTPS for security
    if (cleaned.startsWith('http://')) {
      cleaned = cleaned.replace('http://', 'https://');
    }
    
    return cleaned;
  }
  
  /**
   * Removes empty fields from the product object
   */
  removeEmptyFields(product: CreateProductInput): number {
    let removedCount = 0;
    
    // Check and remove empty arrays
    const arrayFields = [
      'brands_tags', 'categories_tags', 'ingredients_tags', 
      'ingredients_analysis_tags', 'allergens_tags', 
      'allergens_hierarchy', 'traces_tags', 'labels_tags'
    ];
    
    arrayFields.forEach(field => {
      const value = (product as any)[field];
      if (Array.isArray(value) && value.length === 0) {
        delete (product as any)[field];
        removedCount++;
      }
    });
    
    // Check and remove null/undefined optional fields
    const optionalFields = ['imageUrl', 'nutritionalInfo'];
    
    optionalFields.forEach(field => {
      const value = (product as any)[field];
      if (value === null || value === undefined || value === '') {
        delete (product as any)[field];
        removedCount++;
      }
    });
    
    return removedCount;
  }
  
  /**
   * Validates that cleaned data maintains required structure
   */
  validateCleanedData(original: CreateProductInput, cleaned: CreateProductInput): string[] {
    const issues: string[] = [];
    
    // Check that required fields are still present
    if (!cleaned.code) {
      issues.push('UPC code was removed during cleaning');
    }
    
    if (!cleaned.product_name) {
      issues.push('Product name was removed during cleaning');
    }
    
    if (!cleaned.ingredients_text) {
      issues.push('Ingredients text was removed during cleaning');
    }
    
    // Check that data quality wasn't severely degraded
    if (cleaned.product_name.length < original.product_name.length * 0.5) {
      issues.push('Product name was severely truncated during cleaning');
    }
    
    if (cleaned.ingredients_text.length < original.ingredients_text.length * 0.5) {
      issues.push('Ingredients text was severely truncated during cleaning');
    }
    
    return issues;
  }
}

/**
 * Utility function to create DataCleaner with common configurations
 */
export function createDataCleaner(config: Partial<CleaningConfig> = {}): DataCleaner {
  return new DataCleaner(config);
}

/**
 * Quick cleaning function for ingredients text
 */
export function cleanIngredientsQuick(ingredients: string): string {
  const cleaner = new DataCleaner({ cleanIngredients: true });
  return cleaner.cleanIngredientsText(ingredients);
}

/**
 * Quick cleaning function for product names
 */
export function cleanProductNameQuick(name: string): string {
  const cleaner = new DataCleaner();
  return cleaner.cleanProductName(name);
}

/**
 * Quick cleaning function for UPC codes
 */
export function cleanUPCQuick(code: string): string {
  const cleaner = new DataCleaner();
  return cleaner.cleanUPCCode(code);
}