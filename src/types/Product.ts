/**
 * Product model interface and validation for SMARTIES application
 * Implements Requirements 1.1 and 1.5 from core architecture specification
 */

/**
 * Data source types for product information
 */
export type ProductSource = 'manual' | 'openfoodfacts' | 'usda';

/**
 * Dietary flags for religious and lifestyle compliance
 */
export interface DietaryFlags {
  halal?: boolean;
  kosher?: boolean;
  vegan?: boolean;
  vegetarian?: boolean;
  glutenFree?: boolean;
}

/**
 * Basic nutritional information
 */
export interface NutritionalInfo {
  calories?: number;
  sodium?: number;
  sugar?: number;
}

/**
 * Core Product interface for SMARTIES application with Vector Search capabilities
 * Supports efficient storage and retrieval of product information with AI-powered semantic search
 * Implements Requirements 1.1, 1.2, and 1.5 from data schema specification
 */
export interface Product {
  _id?: string;                   // MongoDB ObjectId as string
  
  // Core product identification (Requirements 1.1)
  code: string;                   // UPC/barcode identifier (renamed from upc for OpenFoodFacts compatibility)
  product_name: string;           // Product display name (OpenFoodFacts format)
  brands_tags?: string[];         // Brand information as tags
  categories_tags?: string[];     // Product categories
  
  // Ingredient and allergen information (Requirements 1.1)
  ingredients_text: string;       // Raw ingredients text for embedding generation
  ingredients_tags?: string[];    // Structured ingredient tags
  ingredients_analysis_tags?: string[]; // Analysis results (vegan, vegetarian, etc.)
  allergens_tags: string[];       // Allergen tags in OpenFoodFacts format
  allergens_hierarchy?: string[]; // Allergen hierarchy information
  traces_tags?: string[];         // Cross-contamination traces
  
  // Dietary and certification labels (Requirements 1.1)
  labels_tags?: string[];         // Certification labels (organic, kosher, halal, etc.)
  
  // Vector embeddings for AI-powered search (Requirements 1.2)
  ingredients_embedding: number[]; // 384-dimension vector for ingredient similarity
  product_name_embedding: number[]; // 384-dimension vector for product name matching
  allergens_embedding: number[];   // 384-dimension vector for allergen profile analysis
  
  // Derived dietary compliance flags (Requirements 1.1)
  dietary_flags: {
    vegan: boolean;
    vegetarian: boolean;
    gluten_free: boolean;
    kosher: boolean;
    halal: boolean;
    organic?: boolean;
  };
  
  // Data quality and metadata (Requirements 1.5)
  data_quality_score: number;     // Data completeness and accuracy (0.0-1.0)
  popularity_score?: number;      // Product popularity for ranking
  completeness_score?: number;    // Data completeness metric
  last_updated: Date;             // Last update timestamp
  source: ProductSource;          // Data source tracking
  
  // Legacy fields for backward compatibility
  /** @deprecated Use code instead */
  upc?: string;
  /** @deprecated Use product_name instead */
  name?: string;
  /** @deprecated Use ingredients_text instead */
  ingredients?: string[];
  /** @deprecated Use allergens_tags instead */
  allergens?: string[];
  /** @deprecated Use dietary_flags instead */
  dietaryFlags?: DietaryFlags;
  /** @deprecated Use data_quality_score instead */
  confidence?: number;
  /** @deprecated Use last_updated instead */
  lastUpdated?: Date;
  
  // Optional fields
  nutritionalInfo?: NutritionalInfo;
  imageUrl?: string;
}

/**
 * Product creation input for new vector-enabled schema
 * Excludes auto-generated fields like _id, embeddings, and timestamps
 */
export interface CreateProductInput {
  // Core identification
  code: string;                   // UPC/barcode
  product_name: string;           // Product name
  brands_tags?: string[];         // Brand tags
  categories_tags?: string[];     // Category tags
  
  // Ingredient and allergen data
  ingredients_text: string;       // Raw ingredients text
  ingredients_tags?: string[];    // Structured ingredients
  ingredients_analysis_tags?: string[]; // Analysis tags
  allergens_tags: string[];       // Allergen tags
  allergens_hierarchy?: string[]; // Allergen hierarchy
  traces_tags?: string[];         // Trace allergens
  
  // Labels and certifications
  labels_tags?: string[];         // Certification labels
  
  // Derived flags (will be computed if not provided)
  dietary_flags?: {
    vegan: boolean;
    vegetarian: boolean;
    gluten_free: boolean;
    kosher: boolean;
    halal: boolean;
    organic?: boolean;
  };
  
  // Quality metrics
  data_quality_score: number;     // Data quality (0.0-1.0)
  popularity_score?: number;      // Popularity ranking
  completeness_score?: number;    // Completeness metric
  source: ProductSource;          // Data source
  
  // Optional fields
  nutritionalInfo?: NutritionalInfo;
  imageUrl?: string;
  
  // Legacy support (will be mapped to new fields)
  upc?: string;                   // Maps to code
  name?: string;                  // Maps to product_name
  ingredients?: string[];         // Maps to ingredients_text
  allergens?: string[];           // Maps to allergens_tags
  dietaryFlags?: DietaryFlags;    // Maps to dietary_flags
  confidence?: number;            // Maps to data_quality_score
}

/**
 * Product update input for vector-enabled schema
 * All fields optional except code which shouldn't change
 */
export interface UpdateProductInput {
  // Core fields (code should not be updated)
  product_name?: string;
  brands_tags?: string[];
  categories_tags?: string[];
  
  // Ingredient and allergen updates
  ingredients_text?: string;
  ingredients_tags?: string[];
  ingredients_analysis_tags?: string[];
  allergens_tags?: string[];
  allergens_hierarchy?: string[];
  traces_tags?: string[];
  
  // Labels and certifications
  labels_tags?: string[];
  
  // Derived flags
  dietary_flags?: {
    vegan?: boolean;
    vegetarian?: boolean;
    gluten_free?: boolean;
    kosher?: boolean;
    halal?: boolean;
    organic?: boolean;
  };
  
  // Quality metrics
  data_quality_score?: number;
  popularity_score?: number;
  completeness_score?: number;
  source?: ProductSource;
  
  // Optional fields
  nutritionalInfo?: NutritionalInfo;
  imageUrl?: string;
  
  // Legacy support
  name?: string;
  ingredients?: string[];
  allergens?: string[];
  dietaryFlags?: DietaryFlags;
  confidence?: number;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Common allergens for validation
 */
export const COMMON_ALLERGENS = [
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'tree nuts',
  'peanuts',
  'wheat',
  'soybeans',
  'sesame'
] as const;

/**
 * Valid product sources
 */
export const PRODUCT_SOURCES: ProductSource[] = ['manual', 'openfoodfacts', 'usda'];
/**

 * Validates UPC code format and requirements
 * @param upc - UPC code to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateUPC(upc: string): ValidationResult {
  const errors: string[] = [];

  if (!upc || typeof upc !== 'string') {
    errors.push('UPC is required and must be a string');
  } else {
    // Remove any spaces or dashes
    const cleanUPC = upc.replace(/[\s-]/g, '');
    
    // Check if UPC is numeric and has valid length (UPC-A: 12 digits, UPC-E: 8 digits, EAN: 13 digits)
    if (!/^\d+$/.test(cleanUPC)) {
      errors.push('UPC must contain only numeric characters');
    } else if (![8, 12, 13].includes(cleanUPC.length)) {
      errors.push('UPC must be 8, 12, or 13 digits long');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates product name requirements
 * @param name - Product name to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateProductName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || typeof name !== 'string') {
    errors.push('Product name is required and must be a string');
  } else {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      errors.push('Product name cannot be empty');
    } else if (trimmedName.length > 200) {
      errors.push('Product name cannot exceed 200 characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates ingredients array
 * @param ingredients - Array of ingredients to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateIngredients(ingredients: string[]): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(ingredients)) {
    errors.push('Ingredients must be an array');
  } else {
    if (ingredients.length === 0) {
      errors.push('At least one ingredient is required');
    }

    ingredients.forEach((ingredient, index) => {
      if (!ingredient || typeof ingredient !== 'string') {
        errors.push(`Ingredient at index ${index} must be a non-empty string`);
      } else if (ingredient.trim().length === 0) {
        errors.push(`Ingredient at index ${index} cannot be empty`);
      } else if (ingredient.length > 100) {
        errors.push(`Ingredient at index ${index} cannot exceed 100 characters`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates allergens array
 * @param allergens - Array of allergens to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateAllergens(allergens: string[]): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(allergens)) {
    errors.push('Allergens must be an array');
  } else {
    allergens.forEach((allergen, index) => {
      if (!allergen || typeof allergen !== 'string') {
        errors.push(`Allergen at index ${index} must be a non-empty string`);
      } else if (allergen.trim().length === 0) {
        errors.push(`Allergen at index ${index} cannot be empty`);
      } else if (allergen.length > 50) {
        errors.push(`Allergen at index ${index} cannot exceed 50 characters`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates confidence score
 * @param confidence - Confidence score to validate (0-1)
 * @returns ValidationResult with validation status and errors
 */
export function validateConfidence(confidence: number): ValidationResult {
  const errors: string[] = [];

  if (typeof confidence !== 'number') {
    errors.push('Confidence must be a number');
  } else if (isNaN(confidence)) {
    errors.push('Confidence cannot be NaN');
  } else if (confidence < 0 || confidence > 1) {
    errors.push('Confidence must be between 0 and 1');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates product source
 * @param source - Product source to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateProductSource(source: ProductSource): ValidationResult {
  const errors: string[] = [];

  if (!source || typeof source !== 'string') {
    errors.push('Product source is required and must be a string');
  } else if (!PRODUCT_SOURCES.includes(source)) {
    errors.push(`Product source must be one of: ${PRODUCT_SOURCES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates dietary flags object
 * @param dietaryFlags - Dietary flags to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateDietaryFlags(dietaryFlags: DietaryFlags): ValidationResult {
  const errors: string[] = [];

  if (!dietaryFlags || typeof dietaryFlags !== 'object') {
    errors.push('Dietary flags must be an object');
  } else {
    const validFlags = ['halal', 'kosher', 'vegan', 'vegetarian', 'glutenFree'];
    
    Object.keys(dietaryFlags).forEach(key => {
      if (!validFlags.includes(key)) {
        errors.push(`Invalid dietary flag: ${key}`);
      } else {
        const value = (dietaryFlags as any)[key];
        if (value !== undefined && typeof value !== 'boolean') {
          errors.push(`Dietary flag ${key} must be a boolean or undefined`);
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates nutritional info object
 * @param nutritionalInfo - Nutritional info to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateNutritionalInfo(nutritionalInfo?: NutritionalInfo): ValidationResult {
  const errors: string[] = [];

  if (nutritionalInfo !== undefined) {
    if (typeof nutritionalInfo !== 'object' || nutritionalInfo === null) {
      errors.push('Nutritional info must be an object');
    } else {
      const validFields = ['calories', 'sodium', 'sugar'];
      
      Object.keys(nutritionalInfo).forEach(key => {
        if (!validFields.includes(key)) {
          errors.push(`Invalid nutritional info field: ${key}`);
        } else {
          const value = (nutritionalInfo as any)[key];
          if (value !== undefined) {
            if (typeof value !== 'number' || isNaN(value) || value < 0) {
              errors.push(`Nutritional info ${key} must be a non-negative number`);
            }
          }
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a complete Product object
 * @param product - Product to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateProduct(product: Partial<Product>): ValidationResult {
  const allErrors: string[] = [];

  // Validate required fields
  if (!product.upc) {
    allErrors.push('UPC is required');
  } else {
    const upcValidation = validateUPC(product.upc);
    allErrors.push(...upcValidation.errors);
  }

  if (!product.name) {
    allErrors.push('Product name is required');
  } else {
    const nameValidation = validateProductName(product.name);
    allErrors.push(...nameValidation.errors);
  }

  if (!product.ingredients) {
    allErrors.push('Ingredients are required');
  } else {
    const ingredientsValidation = validateIngredients(product.ingredients);
    allErrors.push(...ingredientsValidation.errors);
  }

  if (!product.allergens) {
    allErrors.push('Allergens are required (can be empty array)');
  } else {
    const allergensValidation = validateAllergens(product.allergens);
    allErrors.push(...allergensValidation.errors);
  }

  if (!product.dietaryFlags) {
    allErrors.push('Dietary flags are required');
  } else {
    const dietaryFlagsValidation = validateDietaryFlags(product.dietaryFlags);
    allErrors.push(...dietaryFlagsValidation.errors);
  }

  if (product.confidence === undefined || product.confidence === null) {
    allErrors.push('Confidence score is required');
  } else {
    const confidenceValidation = validateConfidence(product.confidence);
    allErrors.push(...confidenceValidation.errors);
  }

  if (!product.source) {
    allErrors.push('Product source is required');
  } else {
    const sourceValidation = validateProductSource(product.source);
    allErrors.push(...sourceValidation.errors);
  }

  if (!product.lastUpdated) {
    allErrors.push('Last updated timestamp is required');
  } else if (!(product.lastUpdated instanceof Date)) {
    allErrors.push('Last updated must be a Date object');
  }

  // Validate optional fields if present
  if (product.brand !== undefined) {
    if (typeof product.brand !== 'string' || product.brand.length > 100) {
      allErrors.push('Brand must be a string with maximum 100 characters');
    }
  }

  if (product.imageUrl !== undefined) {
    if (typeof product.imageUrl !== 'string' || product.imageUrl.length > 500) {
      allErrors.push('Image URL must be a string with maximum 500 characters');
    }
  }

  if (product.nutritionalInfo !== undefined) {
    const nutritionalValidation = validateNutritionalInfo(product.nutritionalInfo);
    allErrors.push(...nutritionalValidation.errors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Validates CreateProductInput object
 * @param input - CreateProductInput to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateCreateProductInput(input: Partial<CreateProductInput>): ValidationResult {
  // Convert to Product-like object for validation
  const productForValidation: Partial<Product> = {
    ...input,
    lastUpdated: new Date() // Add required field for validation
  };

  return validateProduct(productForValidation);
}

/**
 * Validates UpdateProductInput object
 * @param input - UpdateProductInput to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateUpdateProductInput(input: UpdateProductInput): ValidationResult {
  const errors: string[] = [];

  // Validate each field if present
  if (input.name !== undefined) {
    const nameValidation = validateProductName(input.name);
    errors.push(...nameValidation.errors);
  }

  if (input.ingredients !== undefined) {
    const ingredientsValidation = validateIngredients(input.ingredients);
    errors.push(...ingredientsValidation.errors);
  }

  if (input.allergens !== undefined) {
    const allergensValidation = validateAllergens(input.allergens);
    errors.push(...allergensValidation.errors);
  }

  if (input.dietaryFlags !== undefined) {
    const dietaryFlagsValidation = validateDietaryFlags(input.dietaryFlags);
    errors.push(...dietaryFlagsValidation.errors);
  }

  if (input.confidence !== undefined) {
    const confidenceValidation = validateConfidence(input.confidence);
    errors.push(...confidenceValidation.errors);
  }

  if (input.source !== undefined) {
    const sourceValidation = validateProductSource(input.source);
    errors.push(...sourceValidation.errors);
  }

  if (input.brand !== undefined) {
    if (typeof input.brand !== 'string' || input.brand.length > 100) {
      errors.push('Brand must be a string with maximum 100 characters');
    }
  }

  if (input.imageUrl !== undefined) {
    if (typeof input.imageUrl !== 'string' || input.imageUrl.length > 500) {
      errors.push('Image URL must be a string with maximum 500 characters');
    }
  }

  if (input.nutritionalInfo !== undefined) {
    const nutritionalValidation = validateNutritionalInfo(input.nutritionalInfo);
    errors.push(...nutritionalValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}