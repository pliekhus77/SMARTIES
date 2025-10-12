/**
 * DataExtractor Service for OpenFoodFacts MongoDB Dump Processing
 * Implements Requirements 2.2 and 2.5 from data schema specification
 * 
 * Features:
 * - Reads OpenFoodFacts MongoDB dump files
 * - Extracts relevant product data for SMARTIES application
 * - Handles large dataset processing with memory optimization
 * - Supports filtering and pagination for MongoDB Atlas M0 storage limits
 */

import { MongoClient, Db, Collection } from 'mongodb';
import { Product, CreateProductInput, ProductSource } from '../../types/Product';
import { ProductModel } from '../../models/Product';

/**
 * Raw OpenFoodFacts product structure from MongoDB dump
 */
export interface OpenFoodFactsRawProduct {
  _id?: string;
  code?: string;
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  brands_tags?: string[];
  categories?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  ingredients_text_en?: string;
  ingredients_tags?: string[];
  ingredients_analysis_tags?: string[];
  allergens?: string;
  allergens_tags?: string[];
  allergens_hierarchy?: string[];
  traces?: string;
  traces_tags?: string[];
  labels?: string;
  labels_tags?: string[];
  nutrition_grades?: string;
  nutrition_grades_tags?: string[];
  data_quality_errors_tags?: string[];
  data_quality_warnings_tags?: string[];
  completeness?: number;
  popularity_tags?: string[];
  last_modified_t?: number;
  created_t?: number;
  image_url?: string;
  image_front_url?: string;
  
  // Nutritional information
  nutriments?: {
    energy_100g?: number;
    'energy-kcal_100g'?: number;
    sodium_100g?: number;
    sugars_100g?: number;
    salt_100g?: number;
  };
  
  // Additional fields that might be present
  [key: string]: any;
}

/**
 * Extraction configuration options
 */
export interface ExtractionConfig {
  // Source database connection
  sourceConnectionString: string;
  sourceDatabaseName: string;
  sourceCollectionName: string;
  
  // Filtering options
  minDataQuality?: number;        // Minimum data quality score (0.0-1.0)
  maxProducts?: number;           // Maximum products to extract (for M0 limits)
  requireUPC?: boolean;           // Require valid UPC codes
  requireIngredients?: boolean;   // Require ingredients text
  
  // Language preferences
  preferredLanguage?: string;     // Preferred language for text fields (default: 'en')
  
  // Processing options
  batchSize?: number;             // Batch size for processing (default: 1000)
  skipExisting?: boolean;         // Skip products that already exist
}

/**
 * Extraction statistics
 */
export interface ExtractionStats {
  totalProcessed: number;
  validProducts: number;
  invalidProducts: number;
  duplicates: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  processingTimeMs?: number;
}

/**
 * DataExtractor class for processing OpenFoodFacts MongoDB dumps
 */
export class DataExtractor {
  private config: ExtractionConfig;
  private stats: ExtractionStats;
  
  constructor(config: ExtractionConfig) {
    this.config = {
      minDataQuality: 0.3,
      maxProducts: 15000, // Optimized for MongoDB Atlas M0
      requireUPC: true,
      requireIngredients: true,
      preferredLanguage: 'en',
      batchSize: 1000,
      skipExisting: false,
      ...config
    };
    
    this.stats = {
      totalProcessed: 0,
      validProducts: 0,
      invalidProducts: 0,
      duplicates: 0,
      errors: 0,
      startTime: new Date()
    };
  }
  
  /**
   * Extracts products from OpenFoodFacts MongoDB dump
   * Returns async iterator for memory-efficient processing
   */
  async* extractProducts(): AsyncIterableIterator<CreateProductInput> {
    const client = new MongoClient(this.config.sourceConnectionString);
    
    try {
      await client.connect();
      console.log('Connected to OpenFoodFacts MongoDB dump');
      
      const db = client.db(this.config.sourceDatabaseName);
      const collection = db.collection(this.config.sourceCollectionName);
      
      // Build aggregation pipeline for filtering and optimization
      const pipeline = this.buildAggregationPipeline();
      
      const cursor = collection.aggregate(pipeline, {
        allowDiskUse: true,
        batchSize: this.config.batchSize
      });
      
      let processedCount = 0;
      
      for await (const rawProduct of cursor) {
        this.stats.totalProcessed++;
        processedCount++;
        
        try {
          const extractedProduct = this.extractProductData(rawProduct);
          
          if (extractedProduct) {
            this.stats.validProducts++;
            yield extractedProduct;
            
            // Respect maxProducts limit for MongoDB Atlas M0
            if (this.config.maxProducts && this.stats.validProducts >= this.config.maxProducts) {
              console.log(`Reached maximum products limit: ${this.config.maxProducts}`);
              break;
            }
          } else {
            this.stats.invalidProducts++;
          }
          
          // Progress logging
          if (processedCount % 1000 === 0) {
            console.log(`Processed ${processedCount} products, valid: ${this.stats.validProducts}`);
          }
          
        } catch (error) {
          this.stats.errors++;
          console.error(`Error processing product ${rawProduct._id}:`, error);
        }
      }
      
    } finally {
      await client.close();
      this.stats.endTime = new Date();
      this.stats.processingTimeMs = this.stats.endTime.getTime() - this.stats.startTime.getTime();
    }
  }
  
  /**
   * Builds MongoDB aggregation pipeline for efficient data extraction
   */
  private buildAggregationPipeline(): any[] {
    const pipeline: any[] = [];
    
    // Match stage - filter out products without essential data
    const matchConditions: any = {};
    
    if (this.config.requireUPC) {
      matchConditions.code = { $exists: true, $ne: null, $not: { $eq: '' } };
    }
    
    if (this.config.requireIngredients) {
      matchConditions.$or = [
        { ingredients_text: { $exists: true, $ne: null, $not: { $eq: '' } } },
        { ingredients_text_en: { $exists: true, $ne: null, $not: { $eq: '' } } }
      ];
    }
    
    // Filter out products with too many data quality errors
    matchConditions.data_quality_errors_tags = { 
      $not: { $size: { $gt: 5 } } // Max 5 data quality errors
    };
    
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }
    
    // Add computed fields for ranking
    pipeline.push({
      $addFields: {
        // Calculate popularity score from tags
        popularity_score: {
          $cond: {
            if: { $isArray: '$popularity_tags' },
            then: { $size: '$popularity_tags' },
            else: 0
          }
        },
        
        // Calculate data quality score
        data_quality_score: {
          $subtract: [
            1.0,
            {
              $multiply: [
                {
                  $cond: {
                    if: { $isArray: '$data_quality_errors_tags' },
                    then: { $size: '$data_quality_errors_tags' },
                    else: 0
                  }
                },
                0.1 // Each error reduces quality by 0.1
              ]
            }
          ]
        }
      }
    });
    
    // Filter by minimum data quality
    if (this.config.minDataQuality && this.config.minDataQuality > 0) {
      pipeline.push({
        $match: {
          data_quality_score: { $gte: this.config.minDataQuality }
        }
      });
    }
    
    // Sort by quality and popularity for best products first
    pipeline.push({
      $sort: {
        data_quality_score: -1,
        popularity_score: -1,
        last_modified_t: -1
      }
    });
    
    // Limit for MongoDB Atlas M0 storage constraints
    if (this.config.maxProducts) {
      pipeline.push({ $limit: this.config.maxProducts * 2 }); // Get extra for filtering
    }
    
    return pipeline;
  }
  
  /**
   * Extracts and transforms raw OpenFoodFacts product to CreateProductInput
   */
  private extractProductData(raw: OpenFoodFactsRawProduct): CreateProductInput | null {
    try {
      // Extract UPC code
      const code = this.extractUPCCode(raw);
      if (!code && this.config.requireUPC) {
        return null;
      }
      
      // Extract product name with language preference
      const product_name = this.extractProductName(raw);
      if (!product_name) {
        return null;
      }
      
      // Extract ingredients text with language preference
      const ingredients_text = this.extractIngredientsText(raw);
      if (!ingredients_text && this.config.requireIngredients) {
        return null;
      }
      
      // Extract and clean other fields
      const brands_tags = this.extractBrandsTags(raw);
      const categories_tags = this.extractCategoriesTags(raw);
      const ingredients_tags = raw.ingredients_tags || [];
      const ingredients_analysis_tags = raw.ingredients_analysis_tags || [];
      const allergens_tags = this.extractAllergensTags(raw);
      const allergens_hierarchy = raw.allergens_hierarchy || [];
      const traces_tags = raw.traces_tags || [];
      const labels_tags = raw.labels_tags || [];
      
      // Calculate quality metrics
      const data_quality_score = this.calculateDataQualityScore(raw);
      const popularity_score = this.calculatePopularityScore(raw);
      const completeness_score = this.calculateCompletenessScore(raw);
      
      // Extract nutritional information
      const nutritionalInfo = this.extractNutritionalInfo(raw);
      
      // Extract image URL
      const imageUrl = raw.image_front_url || raw.image_url;
      
      const createInput: CreateProductInput = {
        code: code!,
        product_name,
        brands_tags,
        categories_tags,
        ingredients_text: ingredients_text!,
        ingredients_tags,
        ingredients_analysis_tags,
        allergens_tags,
        allergens_hierarchy,
        traces_tags,
        labels_tags,
        data_quality_score,
        popularity_score,
        completeness_score,
        source: 'openfoodfacts' as ProductSource,
        nutritionalInfo,
        imageUrl
      };
      
      return createInput;
      
    } catch (error) {
      console.error('Error extracting product data:', error);
      return null;
    }
  }
  
  /**
   * Extracts and validates UPC code from raw product data
   */
  private extractUPCCode(raw: OpenFoodFactsRawProduct): string | null {
    const code = raw.code;
    if (!code || typeof code !== 'string') {
      return null;
    }
    
    // Clean the code (remove spaces, dashes)
    const cleanCode = code.replace(/[\s-]/g, '');
    
    // Validate UPC format (8, 12, or 13 digits)
    if (!/^\d+$/.test(cleanCode) || ![8, 12, 13].includes(cleanCode.length)) {
      return null;
    }
    
    return cleanCode;
  }
  
  /**
   * Extracts product name with language preference
   */
  private extractProductName(raw: OpenFoodFactsRawProduct): string | null {
    // Try language-specific name first
    const langSpecificName = raw[`product_name_${this.config.preferredLanguage}`];
    if (langSpecificName && typeof langSpecificName === 'string' && langSpecificName.trim()) {
      return langSpecificName.trim();
    }
    
    // Fall back to generic product name
    if (raw.product_name && typeof raw.product_name === 'string' && raw.product_name.trim()) {
      return raw.product_name.trim();
    }
    
    return null;
  }
  
  /**
   * Extracts ingredients text with language preference
   */
  private extractIngredientsText(raw: OpenFoodFactsRawProduct): string | null {
    // Try language-specific ingredients first
    const langSpecificIngredients = raw[`ingredients_text_${this.config.preferredLanguage}`];
    if (langSpecificIngredients && typeof langSpecificIngredients === 'string' && langSpecificIngredients.trim()) {
      return langSpecificIngredients.trim();
    }
    
    // Fall back to generic ingredients text
    if (raw.ingredients_text && typeof raw.ingredients_text === 'string' && raw.ingredients_text.trim()) {
      return raw.ingredients_text.trim();
    }
    
    return null;
  }
  
  /**
   * Extracts and cleans brands tags
   */
  private extractBrandsTags(raw: OpenFoodFactsRawProduct): string[] {
    if (Array.isArray(raw.brands_tags)) {
      return raw.brands_tags.filter(tag => tag && typeof tag === 'string');
    }
    
    if (raw.brands && typeof raw.brands === 'string') {
      return raw.brands.split(',').map(brand => brand.trim()).filter(brand => brand);
    }
    
    return [];
  }
  
  /**
   * Extracts and cleans categories tags
   */
  private extractCategoriesTags(raw: OpenFoodFactsRawProduct): string[] {
    if (Array.isArray(raw.categories_tags)) {
      return raw.categories_tags.filter(tag => tag && typeof tag === 'string');
    }
    
    if (raw.categories && typeof raw.categories === 'string') {
      return raw.categories.split(',').map(cat => cat.trim()).filter(cat => cat);
    }
    
    return [];
  }
  
  /**
   * Extracts and cleans allergens tags
   */
  private extractAllergensTags(raw: OpenFoodFactsRawProduct): string[] {
    if (Array.isArray(raw.allergens_tags)) {
      return raw.allergens_tags.filter(tag => tag && typeof tag === 'string');
    }
    
    if (raw.allergens && typeof raw.allergens === 'string') {
      return raw.allergens.split(',').map(allergen => allergen.trim()).filter(allergen => allergen);
    }
    
    return [];
  }
  
  /**
   * Calculates data quality score based on OpenFoodFacts quality indicators
   */
  private calculateDataQualityScore(raw: OpenFoodFactsRawProduct): number {
    let score = 1.0;
    
    // Reduce score for data quality errors
    if (Array.isArray(raw.data_quality_errors_tags)) {
      score -= raw.data_quality_errors_tags.length * 0.1;
    }
    
    // Reduce score for data quality warnings
    if (Array.isArray(raw.data_quality_warnings_tags)) {
      score -= raw.data_quality_warnings_tags.length * 0.05;
    }
    
    // Use existing completeness if available
    if (typeof raw.completeness === 'number' && raw.completeness > 0) {
      score = Math.min(score, raw.completeness);
    }
    
    return Math.max(0.0, Math.min(1.0, score));
  }
  
  /**
   * Calculates popularity score based on OpenFoodFacts popularity indicators
   */
  private calculatePopularityScore(raw: OpenFoodFactsRawProduct): number {
    let score = 0.0;
    
    // Add score for popularity tags
    if (Array.isArray(raw.popularity_tags)) {
      score += raw.popularity_tags.length * 0.1;
    }
    
    // Add score for having images (indicates more complete product)
    if (raw.image_url || raw.image_front_url) {
      score += 0.2;
    }
    
    // Add score for having nutritional information
    if (raw.nutriments && Object.keys(raw.nutriments).length > 0) {
      score += 0.3;
    }
    
    // Add score for recent updates (more actively maintained)
    if (raw.last_modified_t) {
      const lastModified = new Date(raw.last_modified_t * 1000);
      const monthsAgo = (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsAgo < 12) { // Updated within last year
        score += 0.4;
      }
    }
    
    return Math.min(1.0, score);
  }
  
  /**
   * Calculates completeness score based on available data fields
   */
  private calculateCompletenessScore(raw: OpenFoodFactsRawProduct): number {
    let filledFields = 0;
    const totalFields = 10;
    
    if (raw.code) filledFields++;
    if (raw.product_name || raw.product_name_en) filledFields++;
    if (raw.ingredients_text || raw.ingredients_text_en) filledFields++;
    if (raw.brands_tags && raw.brands_tags.length > 0) filledFields++;
    if (raw.categories_tags && raw.categories_tags.length > 0) filledFields++;
    if (raw.allergens_tags && raw.allergens_tags.length > 0) filledFields++;
    if (raw.labels_tags && raw.labels_tags.length > 0) filledFields++;
    if (raw.nutriments && Object.keys(raw.nutriments).length > 0) filledFields++;
    if (raw.image_url || raw.image_front_url) filledFields++;
    if (raw.ingredients_analysis_tags && raw.ingredients_analysis_tags.length > 0) filledFields++;
    
    return filledFields / totalFields;
  }
  
  /**
   * Extracts nutritional information from raw product data
   */
  private extractNutritionalInfo(raw: OpenFoodFactsRawProduct): any {
    if (!raw.nutriments) {
      return undefined;
    }
    
    const nutritionalInfo: any = {};
    
    // Extract calories (prefer kcal over kJ)
    if (raw.nutriments['energy-kcal_100g']) {
      nutritionalInfo.calories = raw.nutriments['energy-kcal_100g'];
    } else if (raw.nutriments.energy_100g) {
      // Convert kJ to kcal (1 kcal = 4.184 kJ)
      nutritionalInfo.calories = Math.round(raw.nutriments.energy_100g / 4.184);
    }
    
    // Extract sodium (prefer sodium over salt)
    if (raw.nutriments.sodium_100g) {
      nutritionalInfo.sodium = raw.nutriments.sodium_100g;
    } else if (raw.nutriments.salt_100g) {
      // Convert salt to sodium (sodium = salt / 2.5)
      nutritionalInfo.sodium = raw.nutriments.salt_100g / 2.5;
    }
    
    // Extract sugar
    if (raw.nutriments.sugars_100g) {
      nutritionalInfo.sugar = raw.nutriments.sugars_100g;
    }
    
    return Object.keys(nutritionalInfo).length > 0 ? nutritionalInfo : undefined;
  }
  
  /**
   * Gets extraction statistics
   */
  getStats(): ExtractionStats {
    return { ...this.stats };
  }
  
  /**
   * Resets extraction statistics
   */
  resetStats(): void {
    this.stats = {
      totalProcessed: 0,
      validProducts: 0,
      invalidProducts: 0,
      duplicates: 0,
      errors: 0,
      startTime: new Date()
    };
  }
}

/**
 * Utility function to create DataExtractor with common configurations
 */
export function createDataExtractor(config: Partial<ExtractionConfig>): DataExtractor {
  const defaultConfig: ExtractionConfig = {
    sourceConnectionString: process.env.OPENFOODFACTS_MONGO_URI || 'mongodb://localhost:27017',
    sourceDatabaseName: 'off',
    sourceCollectionName: 'products',
    minDataQuality: 0.3,
    maxProducts: 15000,
    requireUPC: true,
    requireIngredients: true,
    preferredLanguage: 'en',
    batchSize: 1000,
    skipExisting: false
  };
  
  return new DataExtractor({ ...defaultConfig, ...config });
}