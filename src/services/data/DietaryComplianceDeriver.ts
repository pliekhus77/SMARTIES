/**
 * DietaryComplianceDeriver Service for Deriving Dietary Compliance Flags
 * Implements Task 3.2 from data schema ingestion specification
 * 
 * Features:
 * - Parse ingredients_analysis_tags for vegan/vegetarian status
 * - Extract kosher/halal certifications from labels_tags
 * - Derive gluten-free status from ingredient analysis
 * - Calculate data quality and completeness scores
 * - Support for multiple languages and regional variations
 */

import { CreateProductInput } from '../../types/Product';

/**
 * Dietary compliance flags that can be derived
 */
export interface DietaryFlags {
  vegan: boolean;
  vegetarian: boolean;
  gluten_free: boolean;
  kosher: boolean;
  halal: boolean;
  organic?: boolean;
}

/**
 * Derivation configuration options
 */
export interface DerivationConfig {
  // Confidence thresholds
  minConfidenceThreshold?: number;    // Minimum confidence for positive flags (0.0-1.0)
  strictMode?: boolean;               // Strict mode requires explicit positive indicators
  
  // Language support
  supportedLanguages?: string[];      // Languages to consider for tag parsing
  
  // Custom mappings
  customVeganTags?: string[];         // Additional vegan indicator tags
  customVegetarianTags?: string[];    // Additional vegetarian indicator tags
  customGlutenFreeTags?: string[];    // Additional gluten-free indicator tags
  customKosherTags?: string[];        // Additional kosher indicator tags
  customHalalTags?: string[];         // Additional halal indicator tags
  
  // Quality scoring weights
  completenessWeight?: number;        // Weight for completeness in quality score
  accuracyWeight?: number;            // Weight for accuracy in quality score
  freshnessWeight?: number;           // Weight for data freshness in quality score
}

/**
 * Derivation result with confidence scores
 */
export interface DerivationResult {
  dietary_flags: DietaryFlags;
  confidence_scores: {
    vegan: number;
    vegetarian: number;
    gluten_free: number;
    kosher: number;
    halal: number;
    organic: number;
  };
  data_quality_score: number;
  completeness_score: number;
  derivation_notes: string[];
}

/**
 * Known dietary indicator patterns from OpenFoodFacts
 */
const DIETARY_INDICATORS = {
  vegan: {
    positive: [
      'en:vegan', 'fr:vegan', 'es:vegano', 'de:vegan',
      'en:plant-based', 'en:100-vegetable',
      'vegan', 'plant-based', 'vegetable-based'
    ],
    negative: [
      'en:non-vegan', 'en:contains-milk', 'en:contains-eggs',
      'en:contains-meat', 'en:contains-fish', 'en:contains-honey',
      'non-vegan', 'contains-dairy', 'contains-meat'
    ]
  },
  
  vegetarian: {
    positive: [
      'en:vegetarian', 'fr:végétarien', 'es:vegetariano', 'de:vegetarisch',
      'en:lacto-vegetarian', 'en:ovo-vegetarian', 'en:lacto-ovo-vegetarian',
      'vegetarian', 'veggie', 'suitable-for-vegetarians'
    ],
    negative: [
      'en:non-vegetarian', 'en:contains-meat', 'en:contains-fish',
      'en:contains-poultry', 'en:contains-seafood',
      'non-vegetarian', 'contains-meat', 'meat-based'
    ]
  },
  
  gluten_free: {
    positive: [
      'en:gluten-free', 'fr:sans-gluten', 'es:sin-gluten', 'de:glutenfrei',
      'en:no-gluten', 'en:wheat-free',
      'gluten-free', 'sans-gluten', 'sin-gluten', 'glutenfrei'
    ],
    negative: [
      'en:contains-gluten', 'en:contains-wheat', 'en:contains-barley',
      'en:contains-rye', 'en:contains-oats',
      'contains-gluten', 'wheat-based', 'barley-based'
    ]
  },
  
  kosher: {
    positive: [
      'en:kosher', 'fr:casher', 'es:kosher', 'de:koscher',
      'en:kosher-certified', 'en:kosher-pareve', 'en:kosher-dairy', 'en:kosher-meat',
      'kosher', 'kasher', 'kosher-certified', 'ou-kosher', 'ok-kosher'
    ],
    negative: [
      'en:non-kosher', 'en:treif', 'en:contains-pork', 'en:contains-shellfish',
      'non-kosher', 'treif', 'not-kosher'
    ]
  },
  
  halal: {
    positive: [
      'en:halal', 'fr:halal', 'es:halal', 'de:halal', 'ar:حلال',
      'en:halal-certified', 'en:islamic-certified',
      'halal', 'halal-certified', 'islamic-approved'
    ],
    negative: [
      'en:non-halal', 'en:haram', 'en:contains-pork', 'en:contains-alcohol',
      'non-halal', 'haram', 'not-halal', 'contains-pork'
    ]
  },
  
  organic: {
    positive: [
      'en:organic', 'fr:bio', 'es:ecológico', 'de:bio',
      'en:usda-organic', 'en:eu-organic', 'en:certified-organic',
      'organic', 'bio', 'ecológico', 'usda-organic'
    ],
    negative: [
      'en:non-organic', 'en:conventional',
      'non-organic', 'conventional', 'not-organic'
    ]
  }
};

/**
 * Ingredient-based gluten indicators
 */
const GLUTEN_CONTAINING_INGREDIENTS = [
  'wheat', 'barley', 'rye', 'oats', 'spelt', 'kamut', 'triticale',
  'flour', 'bread', 'pasta', 'cereal', 'malt', 'brewer',
  'blé', 'orge', 'seigle', 'avoine', 'farine',
  'trigo', 'cebada', 'centeno', 'avena', 'harina'
];

/**
 * Animal-derived ingredient indicators
 */
const ANIMAL_INGREDIENTS = {
  non_vegan: [
    'milk', 'cream', 'butter', 'cheese', 'yogurt', 'whey', 'casein', 'lactose',
    'eggs', 'egg', 'albumin', 'lecithin', 'mayonnaise',
    'honey', 'beeswax', 'propolis', 'royal jelly',
    'gelatin', 'collagen', 'isinglass',
    'lait', 'crème', 'beurre', 'fromage', 'yaourt', 'œuf', 'miel',
    'leche', 'crema', 'mantequilla', 'queso', 'yogur', 'huevo', 'miel'
  ],
  
  non_vegetarian: [
    'meat', 'beef', 'pork', 'chicken', 'turkey', 'lamb', 'fish', 'salmon',
    'tuna', 'cod', 'shrimp', 'crab', 'lobster', 'anchovy', 'sardine',
    'lard', 'tallow', 'suet', 'rennet',
    'viande', 'bœuf', 'porc', 'poulet', 'poisson', 'saumon',
    'carne', 'ternera', 'cerdo', 'pollo', 'pescado', 'salmón'
  ]
};

/**
 * DietaryComplianceDeriver class for deriving dietary compliance flags
 */
export class DietaryComplianceDeriver {
  private config: DerivationConfig;
  
  constructor(config: DerivationConfig = {}) {
    this.config = {
      minConfidenceThreshold: 0.7,
      strictMode: false,
      supportedLanguages: ['en', 'fr', 'es', 'de'],
      customVeganTags: [],
      customVegetarianTags: [],
      customGlutenFreeTags: [],
      customKosherTags: [],
      customHalalTags: [],
      completenessWeight: 0.4,
      accuracyWeight: 0.4,
      freshnessWeight: 0.2,
      ...config
    };
  }
  
  /**
   * Derives dietary compliance flags from product data
   */
  deriveComplianceFlags(product: CreateProductInput): DerivationResult {
    const derivation_notes: string[] = [];
    
    // Derive individual dietary flags with confidence scores
    const veganResult = this.deriveVeganStatus(product, derivation_notes);
    const vegetarianResult = this.deriveVegetarianStatus(product, derivation_notes);
    const glutenFreeResult = this.deriveGlutenFreeStatus(product, derivation_notes);
    const kosherResult = this.deriveKosherStatus(product, derivation_notes);
    const halalResult = this.deriveHalalStatus(product, derivation_notes);
    const organicResult = this.deriveOrganicStatus(product, derivation_notes);
    
    // Create dietary flags object
    const dietary_flags: DietaryFlags = {
      vegan: veganResult.flag,
      vegetarian: vegetarianResult.flag,
      gluten_free: glutenFreeResult.flag,
      kosher: kosherResult.flag,
      halal: halalResult.flag,
      organic: organicResult.flag
    };
    
    // Create confidence scores object
    const confidence_scores = {
      vegan: veganResult.confidence,
      vegetarian: vegetarianResult.confidence,
      gluten_free: glutenFreeResult.confidence,
      kosher: kosherResult.confidence,
      halal: halalResult.confidence,
      organic: organicResult.confidence
    };
    
    // Calculate overall data quality and completeness scores
    const data_quality_score = this.calculateDataQualityScore(product, confidence_scores);
    const completeness_score = this.calculateCompletenessScore(product);
    
    return {
      dietary_flags,
      confidence_scores,
      data_quality_score,
      completeness_score,
      derivation_notes
    };
  }
  
  /**
   * Derives vegan status from ingredients analysis and labels
   */
  private deriveVeganStatus(product: CreateProductInput, notes: string[]): { flag: boolean; confidence: number } {
    let confidence = 0.0;
    let isVegan = false;
    
    // Check ingredients_analysis_tags for explicit vegan indicators
    const analysisResult = this.checkTagsForIndicators(
      product.ingredients_analysis_tags || [],
      DIETARY_INDICATORS.vegan,
      'vegan analysis'
    );
    
    // Check labels_tags for vegan certifications
    const labelResult = this.checkTagsForIndicators(
      product.labels_tags || [],
      DIETARY_INDICATORS.vegan,
      'vegan labels'
    );
    
    // Check ingredients text for animal-derived ingredients
    const ingredientResult = this.checkIngredientsForAnimalProducts(
      product.ingredients_text,
      ANIMAL_INGREDIENTS.non_vegan,
      'vegan ingredients'
    );
    
    // Prioritize negative indicators for safety (vegan is strict)
    if (analysisResult.negative || labelResult.negative || ingredientResult.negative) {
      isVegan = false;
      confidence = Math.max(analysisResult.confidence, labelResult.confidence, ingredientResult.confidence);
      notes.push(`Vegan status: negative from ${ingredientResult.negative ? 'ingredients' : 'tags'}`);
    } else if (analysisResult.positive || labelResult.positive) {
      isVegan = true;
      confidence = Math.max(analysisResult.confidence, labelResult.confidence);
      notes.push(`Vegan status: positive from ${analysisResult.positive ? 'analysis' : 'labels'}`);
    } else if (!ingredientResult.negative && product.ingredients_analysis_tags?.length) {
      // If no negative indicators and we have analysis tags, assume vegan with lower confidence
      isVegan = true;
      confidence = 0.3;
      notes.push('Vegan status: assumed positive (no animal ingredients detected)');
    }
    
    return { flag: isVegan, confidence };
  }
  
  /**
   * Derives vegetarian status from ingredients analysis and labels
   */
  private deriveVegetarianStatus(product: CreateProductInput, notes: string[]): { flag: boolean; confidence: number } {
    let confidence = 0.0;
    let isVegetarian = false;
    
    // Check ingredients_analysis_tags for explicit vegetarian indicators
    const analysisResult = this.checkTagsForIndicators(
      product.ingredients_analysis_tags || [],
      DIETARY_INDICATORS.vegetarian,
      'vegetarian analysis'
    );
    
    // Check labels_tags for vegetarian certifications
    const labelResult = this.checkTagsForIndicators(
      product.labels_tags || [],
      DIETARY_INDICATORS.vegetarian,
      'vegetarian labels'
    );
    
    // Check ingredients text for meat/fish products
    const ingredientResult = this.checkIngredientsForAnimalProducts(
      product.ingredients_text,
      ANIMAL_INGREDIENTS.non_vegetarian,
      'vegetarian ingredients'
    );
    
    // Prioritize negative indicators for safety
    if (analysisResult.negative || labelResult.negative || ingredientResult.negative) {
      isVegetarian = false;
      confidence = Math.max(analysisResult.confidence, labelResult.confidence, ingredientResult.confidence);
      notes.push(`Vegetarian status: negative from ${ingredientResult.negative ? 'ingredients' : 'tags'}`);
    } else if (analysisResult.positive || labelResult.positive) {
      isVegetarian = true;
      confidence = Math.max(analysisResult.confidence, labelResult.confidence);
      notes.push(`Vegetarian status: positive from ${analysisResult.positive ? 'analysis' : 'labels'}`);
    } else if (!ingredientResult.negative && product.ingredients_analysis_tags?.length) {
      // If no negative indicators and we have analysis tags, assume vegetarian with lower confidence
      isVegetarian = true;
      confidence = 0.4;
      notes.push('Vegetarian status: assumed positive (no meat/fish ingredients detected)');
    }
    
    return { flag: isVegetarian, confidence };
  }
  
  /**
   * Derives gluten-free status from ingredients analysis and labels
   */
  private deriveGlutenFreeStatus(product: CreateProductInput, notes: string[]): { flag: boolean; confidence: number } {
    let confidence = 0.0;
    let isGlutenFree = false;
    
    // Check ingredients_analysis_tags for explicit gluten-free indicators
    const analysisResult = this.checkTagsForIndicators(
      product.ingredients_analysis_tags || [],
      DIETARY_INDICATORS.gluten_free,
      'gluten-free analysis'
    );
    
    // Check labels_tags for gluten-free certifications
    const labelResult = this.checkTagsForIndicators(
      product.labels_tags || [],
      DIETARY_INDICATORS.gluten_free,
      'gluten-free labels'
    );
    
    // Check ingredients text for gluten-containing ingredients
    const ingredientResult = this.checkIngredientsForGluten(product.ingredients_text);
    
    // Combine results with weighted confidence
    if (analysisResult.positive || labelResult.positive) {
      isGlutenFree = true;
      confidence = Math.max(analysisResult.confidence, labelResult.confidence);
      notes.push(`Gluten-free status: positive from ${analysisResult.positive ? 'analysis' : 'labels'}`);
    } else if (analysisResult.negative || labelResult.negative || ingredientResult.negative) {
      isGlutenFree = false;
      confidence = Math.max(analysisResult.confidence, labelResult.confidence, ingredientResult.confidence);
      notes.push(`Gluten-free status: negative from ${ingredientResult.negative ? 'ingredients' : 'tags'}`);
    } else if (!ingredientResult.negative) {
      // If no gluten-containing ingredients detected, assume gluten-free with moderate confidence
      isGlutenFree = true;
      confidence = 0.5;
      notes.push('Gluten-free status: assumed positive (no gluten ingredients detected)');
    }
    
    return { flag: isGlutenFree, confidence };
  }
  
  /**
   * Derives kosher status from labels and certifications
   */
  private deriveKosherStatus(product: CreateProductInput, notes: string[]): { flag: boolean; confidence: number } {
    let confidence = 0.0;
    let isKosher = false;
    
    // Check labels_tags for kosher certifications (primary source)
    const labelResult = this.checkTagsForIndicators(
      product.labels_tags || [],
      DIETARY_INDICATORS.kosher,
      'kosher labels'
    );
    
    // Check ingredients_analysis_tags for kosher indicators
    const analysisResult = this.checkTagsForIndicators(
      product.ingredients_analysis_tags || [],
      DIETARY_INDICATORS.kosher,
      'kosher analysis'
    );
    
    // Kosher certification is typically explicit, so we rely heavily on labels
    if (labelResult.positive) {
      isKosher = true;
      confidence = labelResult.confidence;
      notes.push('Kosher status: positive from certification labels');
    } else if (analysisResult.positive) {
      isKosher = true;
      confidence = analysisResult.confidence * 0.8; // Lower confidence without explicit certification
      notes.push('Kosher status: positive from analysis tags');
    } else if (labelResult.negative || analysisResult.negative) {
      isKosher = false;
      confidence = Math.max(labelResult.confidence, analysisResult.confidence);
      notes.push('Kosher status: negative from tags');
    }
    // For kosher, we don't assume positive without explicit indicators
    
    return { flag: isKosher, confidence };
  }
  
  /**
   * Derives halal status from labels and certifications
   */
  private deriveHalalStatus(product: CreateProductInput, notes: string[]): { flag: boolean; confidence: number } {
    let confidence = 0.0;
    let isHalal = false;
    
    // Check labels_tags for halal certifications (primary source)
    const labelResult = this.checkTagsForIndicators(
      product.labels_tags || [],
      DIETARY_INDICATORS.halal,
      'halal labels'
    );
    
    // Check ingredients_analysis_tags for halal indicators
    const analysisResult = this.checkTagsForIndicators(
      product.ingredients_analysis_tags || [],
      DIETARY_INDICATORS.halal,
      'halal analysis'
    );
    
    // Halal certification is typically explicit, so we rely heavily on labels
    if (labelResult.positive) {
      isHalal = true;
      confidence = labelResult.confidence;
      notes.push('Halal status: positive from certification labels');
    } else if (analysisResult.positive) {
      isHalal = true;
      confidence = analysisResult.confidence * 0.8; // Lower confidence without explicit certification
      notes.push('Halal status: positive from analysis tags');
    } else if (labelResult.negative || analysisResult.negative) {
      isHalal = false;
      confidence = Math.max(labelResult.confidence, analysisResult.confidence);
      notes.push('Halal status: negative from tags');
    }
    // For halal, we don't assume positive without explicit indicators
    
    return { flag: isHalal, confidence };
  }
  
  /**
   * Derives organic status from labels and certifications
   */
  private deriveOrganicStatus(product: CreateProductInput, notes: string[]): { flag: boolean; confidence: number } {
    let confidence = 0.0;
    let isOrganic = false;
    
    // Check labels_tags for organic certifications
    const labelResult = this.checkTagsForIndicators(
      product.labels_tags || [],
      DIETARY_INDICATORS.organic,
      'organic labels'
    );
    
    // Organic certification is explicit, so we rely on labels
    if (labelResult.positive) {
      isOrganic = true;
      confidence = labelResult.confidence;
      notes.push('Organic status: positive from certification labels');
    } else if (labelResult.negative) {
      isOrganic = false;
      confidence = labelResult.confidence;
      notes.push('Organic status: negative from labels');
    }
    
    return { flag: isOrganic, confidence };
  }
  
  /**
   * Checks tags for dietary indicators
   */
  private checkTagsForIndicators(
    tags: string[],
    indicators: { positive: string[]; negative: string[] },
    context: string
  ): { positive: boolean; negative: boolean; confidence: number } {
    let positive = false;
    let negative = false;
    let confidence = 0.0;
    
    const normalizedTags = tags.map(tag => tag.toLowerCase().trim());
    
    // Check for positive indicators
    for (const indicator of indicators.positive) {
      if (normalizedTags.some(tag => tag.includes(indicator.toLowerCase()))) {
        positive = true;
        confidence = Math.max(confidence, 0.9); // High confidence for explicit positive tags
        break;
      }
    }
    
    // Check for negative indicators
    for (const indicator of indicators.negative) {
      if (normalizedTags.some(tag => tag.includes(indicator.toLowerCase()))) {
        negative = true;
        confidence = Math.max(confidence, 0.8); // High confidence for explicit negative tags
        break;
      }
    }
    
    return { positive, negative, confidence };
  }
  
  /**
   * Checks ingredients text for animal-derived products
   */
  private checkIngredientsForAnimalProducts(
    ingredientsText: string,
    animalIngredients: string[],
    context: string
  ): { negative: boolean; confidence: number } {
    if (!ingredientsText) {
      return { negative: false, confidence: 0.0 };
    }
    
    const normalizedIngredients = ingredientsText.toLowerCase();
    let negative = false;
    let confidence = 0.0;
    
    for (const ingredient of animalIngredients) {
      if (normalizedIngredients.includes(ingredient.toLowerCase())) {
        negative = true;
        confidence = 0.7; // Moderate confidence from ingredient text analysis
        break;
      }
    }
    
    return { negative, confidence };
  }
  
  /**
   * Checks ingredients text for gluten-containing ingredients
   */
  private checkIngredientsForGluten(ingredientsText: string): { negative: boolean; confidence: number } {
    if (!ingredientsText) {
      return { negative: false, confidence: 0.0 };
    }
    
    const normalizedIngredients = ingredientsText.toLowerCase();
    let negative = false;
    let confidence = 0.0;
    
    for (const ingredient of GLUTEN_CONTAINING_INGREDIENTS) {
      if (normalizedIngredients.includes(ingredient.toLowerCase())) {
        negative = true;
        confidence = 0.8; // High confidence for gluten-containing ingredients
        break;
      }
    }
    
    return { negative, confidence };
  }
  
  /**
   * Calculates overall data quality score based on derivation confidence
   */
  private calculateDataQualityScore(
    product: CreateProductInput,
    confidenceScores: { [key: string]: number }
  ): number {
    // Start with existing data quality score
    let qualityScore = product.data_quality_score || 0.5;
    
    // Factor in confidence scores for dietary flags
    const avgConfidence = Object.values(confidenceScores).reduce((sum, conf) => sum + conf, 0) / 
                         Object.values(confidenceScores).length;
    
    // Adjust quality score based on dietary flag confidence
    const dietaryQualityBonus = avgConfidence * 0.2; // Up to 20% bonus for high confidence dietary flags
    qualityScore = Math.min(1.0, qualityScore + dietaryQualityBonus);
    
    // Penalize for missing critical information
    if (!product.ingredients_analysis_tags || product.ingredients_analysis_tags.length === 0) {
      qualityScore *= 0.9; // 10% penalty for missing analysis tags
    }
    
    if (!product.labels_tags || product.labels_tags.length === 0) {
      qualityScore *= 0.95; // 5% penalty for missing label tags
    }
    
    return Math.max(0.0, Math.min(1.0, qualityScore));
  }
  
  /**
   * Calculates completeness score based on available dietary information
   */
  private calculateCompletenessScore(product: CreateProductInput): number {
    let completenessScore = 0.0;
    const totalFields = 10;
    let filledFields = 0;
    
    // Core required fields
    if (product.code) filledFields++;
    if (product.product_name) filledFields++;
    if (product.ingredients_text) filledFields++;
    
    // Dietary-relevant fields
    if (product.ingredients_analysis_tags && product.ingredients_analysis_tags.length > 0) filledFields++;
    if (product.labels_tags && product.labels_tags.length > 0) filledFields++;
    if (product.allergens_tags && product.allergens_tags.length > 0) filledFields++;
    if (product.ingredients_tags && product.ingredients_tags.length > 0) filledFields++;
    if (product.traces_tags && product.traces_tags.length > 0) filledFields++;
    if (product.brands_tags && product.brands_tags.length > 0) filledFields++;
    if (product.categories_tags && product.categories_tags.length > 0) filledFields++;
    
    completenessScore = filledFields / totalFields;
    
    // Bonus for having comprehensive dietary information
    const hasDietaryAnalysis = product.ingredients_analysis_tags && product.ingredients_analysis_tags.length > 0;
    const hasLabels = product.labels_tags && product.labels_tags.length > 0;
    const hasAllergens = product.allergens_tags && product.allergens_tags.length > 0;
    
    if (hasDietaryAnalysis && hasLabels && hasAllergens) {
      completenessScore = Math.min(1.0, completenessScore + 0.05); // 5% bonus for comprehensive data
    }
    
    return completenessScore;
  }
  
  /**
   * Updates product with derived dietary compliance flags
   */
  updateProductWithDerivedFlags(product: CreateProductInput): CreateProductInput {
    const derivationResult = this.deriveComplianceFlags(product);
    
    return {
      ...product,
      dietary_flags: derivationResult.dietary_flags,
      data_quality_score: derivationResult.data_quality_score,
      completeness_score: derivationResult.completeness_score
    };
  }
  
  /**
   * Batch processes multiple products for dietary compliance derivation
   */
  async batchDeriveCompliance(products: CreateProductInput[]): Promise<{
    processed: CreateProductInput[];
    stats: {
      total: number;
      processed: number;
      errors: number;
      averageConfidence: number;
      flagCounts: { [key: string]: number };
    };
  }> {
    const processed: CreateProductInput[] = [];
    const stats = {
      total: products.length,
      processed: 0,
      errors: 0,
      averageConfidence: 0,
      flagCounts: {
        vegan: 0,
        vegetarian: 0,
        gluten_free: 0,
        kosher: 0,
        halal: 0,
        organic: 0
      }
    };
    
    let totalConfidence = 0;
    
    for (const product of products) {
      try {
        const derivationResult = this.deriveComplianceFlags(product);
        
        const updatedProduct: CreateProductInput = {
          ...product,
          dietary_flags: derivationResult.dietary_flags,
          data_quality_score: derivationResult.data_quality_score,
          completeness_score: derivationResult.completeness_score
        };
        
        processed.push(updatedProduct);
        stats.processed++;
        
        // Update statistics
        const avgConfidence = Object.values(derivationResult.confidence_scores)
          .reduce((sum, conf) => sum + conf, 0) / Object.values(derivationResult.confidence_scores).length;
        totalConfidence += avgConfidence;
        
        // Count flags
        Object.entries(derivationResult.dietary_flags).forEach(([flag, value]) => {
          if (value && flag in stats.flagCounts) {
            (stats.flagCounts as any)[flag]++;
          }
        });
        
      } catch (error) {
        console.error(`Error deriving compliance for product ${product.code}:`, error);
        stats.errors++;
        // Add product without derived flags
        processed.push(product);
      }
    }
    
    stats.averageConfidence = stats.processed > 0 ? totalConfidence / stats.processed : 0;
    
    return { processed, stats };
  }
}

/**
 * Utility function to create DietaryComplianceDeriver with common configurations
 */
export function createDietaryComplianceDeriver(config: Partial<DerivationConfig> = {}): DietaryComplianceDeriver {
  return new DietaryComplianceDeriver(config);
}

/**
 * Quick derivation function for single product
 */
export function deriveDietaryFlagsQuick(product: CreateProductInput): CreateProductInput {
  const deriver = new DietaryComplianceDeriver();
  return deriver.updateProductWithDerivedFlags(product);
}