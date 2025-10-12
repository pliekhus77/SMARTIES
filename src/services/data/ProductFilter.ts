/**
 * ProductFilter Service for Quality and Completeness Filtering
 * Implements Requirements 2.2 and 2.5 from data schema specification
 * 
 * Features:
 * - Quality-based product filtering for MongoDB Atlas M0 optimization
 * - Completeness scoring and filtering
 * - Popularity-based ranking and selection
 * - Category and brand-based filtering
 * - Storage optimization for 512MB limit
 */

import { CreateProductInput } from '../../types/Product';

/**
 * Filtering configuration options
 */
export interface FilterConfig {
  // Quality thresholds
  minDataQuality?: number;          // Minimum data quality score (0.0-1.0)
  minCompleteness?: number;         // Minimum completeness score (0.0-1.0)
  minPopularity?: number;           // Minimum popularity score (0.0-1.0)
  
  // Storage constraints
  maxProducts?: number;             // Maximum products to keep (MongoDB Atlas M0 limit)
  estimatedDocumentSize?: number;   // Estimated size per document in bytes
  maxStorageBytes?: number;         // Maximum storage limit in bytes
  
  // Content requirements
  requireBrands?: boolean;          // Require brand information
  requireCategories?: boolean;      // Require category information
  requireNutrition?: boolean;       // Require nutritional information
  requireImages?: boolean;          // Require product images
  requireIngredientTags?: boolean;  // Require structured ingredient tags
  
  // Language and region preferences
  preferredLanguages?: string[];    // Preferred languages for content
  preferredRegions?: string[];      // Preferred regions/countries
  excludedCategories?: string[];    // Categories to exclude
  includedCategories?: string[];    // Categories to include (if specified, only these)
  
  // Allergen and dietary preferences
  prioritizeAllergenInfo?: boolean; // Prioritize products with allergen information
  prioritizeDietaryInfo?: boolean;  // Prioritize products with dietary flags
  
  // Ranking weights
  qualityWeight?: number;           // Weight for data quality in ranking (0.0-1.0)
  popularityWeight?: number;        // Weight for popularity in ranking (0.0-1.0)
  completenessWeight?: number;      // Weight for completeness in ranking (0.0-1.0)
  recencyWeight?: number;           // Weight for recent updates in ranking (0.0-1.0)
}

/**
 * Filtering statistics
 */
export interface FilterStats {
  totalInput: number;
  passedQualityFilter: number;
  passedCompletenessFilter: number;
  passedContentFilter: number;
  passedCategoryFilter: number;
  finalSelected: number;
  estimatedStorageBytes: number;
  averageQualityScore: number;
  averageCompletenessScore: number;
  topCategories: Array<{ category: string; count: number }>;
  topBrands: Array<{ brand: string; count: number }>;
}

/**
 * Product ranking result
 */
export interface RankedProduct {
  product: CreateProductInput;
  rankingScore: number;
  qualityScore: number;
  completenessScore: number;
  popularityScore: number;
  recencyScore: number;
}

/**
 * ProductFilter class for intelligent product selection and filtering
 */
export class ProductFilter {
  private config: FilterConfig;
  
  constructor(config: FilterConfig = {}) {
    this.config = {
      minDataQuality: 0.3,
      minCompleteness: 0.4,
      minPopularity: 0.0,
      maxProducts: 15000,
      estimatedDocumentSize: 12000, // ~12KB per product with embeddings
      maxStorageBytes: 512 * 1024 * 1024 * 0.9, // 90% of 512MB for safety
      requireBrands: false,
      requireCategories: false,
      requireNutrition: false,
      requireImages: false,
      requireIngredientTags: false,
      preferredLanguages: ['en'],
      preferredRegions: ['us', 'ca', 'gb', 'au'],
      excludedCategories: [],
      includedCategories: [],
      prioritizeAllergenInfo: true,
      prioritizeDietaryInfo: true,
      qualityWeight: 0.4,
      popularityWeight: 0.3,
      completenessWeight: 0.2,
      recencyWeight: 0.1,
      ...config
    };
  }
  
  /**
   * Filters and ranks products for optimal selection
   */
  async filterProducts(products: CreateProductInput[]): Promise<{
    selected: CreateProductInput[];
    stats: FilterStats;
    ranked: RankedProduct[];
  }> {
    const stats: FilterStats = {
      totalInput: products.length,
      passedQualityFilter: 0,
      passedCompletenessFilter: 0,
      passedContentFilter: 0,
      passedCategoryFilter: 0,
      finalSelected: 0,
      estimatedStorageBytes: 0,
      averageQualityScore: 0,
      averageCompletenessScore: 0,
      topCategories: [],
      topBrands: []
    };
    
    console.log(`Starting product filtering with ${products.length} products`);
    
    // Step 1: Apply quality filters
    const qualityFiltered = products.filter(product => {
      return this.passesQualityFilter(product);
    });
    stats.passedQualityFilter = qualityFiltered.length;
    console.log(`After quality filter: ${qualityFiltered.length} products`);
    
    // Step 2: Apply completeness filters
    const completenessFiltered = qualityFiltered.filter(product => {
      return this.passesCompletenessFilter(product);
    });
    stats.passedCompletenessFilter = completenessFiltered.length;
    console.log(`After completeness filter: ${completenessFiltered.length} products`);
    
    // Step 3: Apply content requirement filters
    const contentFiltered = completenessFiltered.filter(product => {
      return this.passesContentFilter(product);
    });
    stats.passedContentFilter = contentFiltered.length;
    console.log(`After content filter: ${contentFiltered.length} products`);
    
    // Step 4: Apply category filters
    const categoryFiltered = contentFiltered.filter(product => {
      return this.passesCategoryFilter(product);
    });
    stats.passedCategoryFilter = categoryFiltered.length;
    console.log(`After category filter: ${categoryFiltered.length} products`);
    
    // Step 5: Rank products by composite score
    const ranked = this.rankProducts(categoryFiltered);
    console.log(`Ranked ${ranked.length} products`);
    
    // Step 6: Select top products within storage constraints
    const selected = this.selectTopProducts(ranked, stats);
    stats.finalSelected = selected.length;
    
    // Calculate final statistics
    this.calculateFinalStats(selected, stats);
    
    console.log(`Final selection: ${selected.length} products`);
    console.log(`Estimated storage: ${(stats.estimatedStorageBytes / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      selected,
      stats,
      ranked
    };
  }
  
  /**
   * Checks if product passes quality filter
   */
  private passesQualityFilter(product: CreateProductInput): boolean {
    // Check minimum data quality score
    if (product.data_quality_score < this.config.minDataQuality!) {
      return false;
    }
    
    // Check for required fields
    if (!product.code || !product.product_name || !product.ingredients_text) {
      return false;
    }
    
    // Check for minimum content length
    if (product.product_name.length < 3) {
      return false;
    }
    
    if (product.ingredients_text.length < 10) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Checks if product passes completeness filter
   */
  private passesCompletenessFilter(product: CreateProductInput): boolean {
    const completenessScore = this.calculateCompletenessScore(product);
    
    if (completenessScore < this.config.minCompleteness!) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Checks if product passes content requirement filters
   */
  private passesContentFilter(product: CreateProductInput): boolean {
    // Check brand requirement
    if (this.config.requireBrands && (!product.brands_tags || product.brands_tags.length === 0)) {
      return false;
    }
    
    // Check category requirement
    if (this.config.requireCategories && (!product.categories_tags || product.categories_tags.length === 0)) {
      return false;
    }
    
    // Check nutrition requirement
    if (this.config.requireNutrition && !product.nutritionalInfo) {
      return false;
    }
    
    // Check image requirement
    if (this.config.requireImages && !product.imageUrl) {
      return false;
    }
    
    // Check ingredient tags requirement
    if (this.config.requireIngredientTags && (!product.ingredients_tags || product.ingredients_tags.length === 0)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Checks if product passes category filters
   */
  private passesCategoryFilter(product: CreateProductInput): boolean {
    const categories = product.categories_tags || [];
    
    // Check excluded categories
    if (this.config.excludedCategories!.length > 0) {
      const hasExcludedCategory = categories.some(category => 
        this.config.excludedCategories!.some(excluded => 
          category.toLowerCase().includes(excluded.toLowerCase())
        )
      );
      if (hasExcludedCategory) {
        return false;
      }
    }
    
    // Check included categories (if specified, product must have at least one)
    if (this.config.includedCategories!.length > 0) {
      const hasIncludedCategory = categories.some(category => 
        this.config.includedCategories!.some(included => 
          category.toLowerCase().includes(included.toLowerCase())
        )
      );
      if (!hasIncludedCategory) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Ranks products by composite score
   */
  private rankProducts(products: CreateProductInput[]): RankedProduct[] {
    return products.map(product => {
      const qualityScore = product.data_quality_score;
      const completenessScore = this.calculateCompletenessScore(product);
      const popularityScore = product.popularity_score || 0;
      const recencyScore = this.calculateRecencyScore(product);
      
      // Calculate weighted composite score
      const rankingScore = 
        (qualityScore * this.config.qualityWeight!) +
        (popularityScore * this.config.popularityWeight!) +
        (completenessScore * this.config.completenessWeight!) +
        (recencyScore * this.config.recencyWeight!);
      
      return {
        product,
        rankingScore,
        qualityScore,
        completenessScore,
        popularityScore,
        recencyScore
      };
    }).sort((a, b) => b.rankingScore - a.rankingScore); // Sort by ranking score descending
  }
  
  /**
   * Selects top products within storage constraints
   */
  private selectTopProducts(ranked: RankedProduct[], stats: FilterStats): CreateProductInput[] {
    const selected: CreateProductInput[] = [];
    let totalStorageBytes = 0;
    
    for (const rankedProduct of ranked) {
      const estimatedSize = this.estimateProductSize(rankedProduct.product);
      
      // Check if adding this product would exceed storage limit
      if (totalStorageBytes + estimatedSize > this.config.maxStorageBytes!) {
        console.log(`Storage limit reached at ${selected.length} products`);
        break;
      }
      
      // Check if we've reached the maximum product count
      if (selected.length >= this.config.maxProducts!) {
        console.log(`Product count limit reached at ${selected.length} products`);
        break;
      }
      
      selected.push(rankedProduct.product);
      totalStorageBytes += estimatedSize;
    }
    
    stats.estimatedStorageBytes = totalStorageBytes;
    return selected;
  }
  
  /**
   * Calculates completeness score for a product
   */
  private calculateCompletenessScore(product: CreateProductInput): number {
    let filledFields = 0;
    const totalFields = 12;
    
    // Required fields
    if (product.code) filledFields++;
    if (product.product_name) filledFields++;
    if (product.ingredients_text) filledFields++;
    if (product.source) filledFields++;
    
    // Optional but valuable fields
    if (product.brands_tags && product.brands_tags.length > 0) filledFields++;
    if (product.categories_tags && product.categories_tags.length > 0) filledFields++;
    if (product.ingredients_tags && product.ingredients_tags.length > 0) filledFields++;
    if (product.allergens_tags && product.allergens_tags.length > 0) filledFields++;
    if (product.labels_tags && product.labels_tags.length > 0) filledFields++;
    if (product.nutritionalInfo) filledFields++;
    if (product.imageUrl) filledFields++;
    if (product.ingredients_analysis_tags && product.ingredients_analysis_tags.length > 0) filledFields++;
    
    return filledFields / totalFields;
  }
  
  /**
   * Calculates recency score based on how recently the product was updated
   */
  private calculateRecencyScore(product: CreateProductInput): number {
    // Since we don't have last_updated in CreateProductInput, we'll use a default
    // In a real implementation, this would be based on the actual update timestamp
    return 0.5; // Neutral score
  }
  
  /**
   * Estimates storage size for a product document
   */
  private estimateProductSize(product: CreateProductInput): number {
    // Base size estimation
    let size = this.config.estimatedDocumentSize!;
    
    // Adjust based on actual content
    const textContent = [
      product.product_name,
      product.ingredients_text,
      ...(product.brands_tags || []),
      ...(product.categories_tags || []),
      ...(product.ingredients_tags || []),
      ...(product.allergens_tags || []),
      ...(product.labels_tags || [])
    ].join('');
    
    // Estimate based on text content length
    const textSize = textContent.length * 2; // UTF-8 encoding
    const vectorSize = 384 * 3 * 8; // 3 vectors * 384 dimensions * 8 bytes per double
    const metadataSize = 500; // Estimated metadata overhead
    
    return textSize + vectorSize + metadataSize;
  }
  
  /**
   * Calculates final statistics
   */
  private calculateFinalStats(selected: CreateProductInput[], stats: FilterStats): void {
    if (selected.length === 0) {
      return;
    }
    
    // Calculate average scores
    const totalQuality = selected.reduce((sum, product) => sum + product.data_quality_score, 0);
    stats.averageQualityScore = totalQuality / selected.length;
    
    const totalCompleteness = selected.reduce((sum, product) => sum + this.calculateCompletenessScore(product), 0);
    stats.averageCompletenessScore = totalCompleteness / selected.length;
    
    // Calculate top categories
    const categoryCount = new Map<string, number>();
    selected.forEach(product => {
      (product.categories_tags || []).forEach(category => {
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });
    });
    
    stats.topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Calculate top brands
    const brandCount = new Map<string, number>();
    selected.forEach(product => {
      (product.brands_tags || []).forEach(brand => {
        brandCount.set(brand, (brandCount.get(brand) || 0) + 1);
      });
    });
    
    stats.topBrands = Array.from(brandCount.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  /**
   * Gets products that prioritize allergen and dietary information
   */
  filterForAllergenPriority(products: CreateProductInput[]): CreateProductInput[] {
    return products.filter(product => {
      // Prioritize products with allergen information
      const hasAllergenInfo = product.allergens_tags && product.allergens_tags.length > 0;
      
      // Prioritize products with dietary analysis
      const hasDietaryInfo = product.ingredients_analysis_tags && 
        product.ingredients_analysis_tags.some(tag => 
          tag.includes('vegan') || tag.includes('vegetarian') || 
          tag.includes('gluten') || tag.includes('kosher') || tag.includes('halal')
        );
      
      // Prioritize products with label information
      const hasLabelInfo = product.labels_tags && product.labels_tags.length > 0;
      
      return hasAllergenInfo || hasDietaryInfo || hasLabelInfo;
    });
  }
  
  /**
   * Gets products optimized for US market
   */
  filterForUSMarket(products: CreateProductInput[]): CreateProductInput[] {
    const usCategories = [
      'breakfast', 'snacks', 'beverages', 'dairy', 'meat', 'seafood',
      'frozen', 'canned', 'condiments', 'bread', 'cereals', 'cookies'
    ];
    
    return products.filter(product => {
      const categories = (product.categories_tags || []).map(cat => cat.toLowerCase());
      return categories.some(category => 
        usCategories.some(usCategory => category.includes(usCategory))
      );
    });
  }
}

/**
 * Utility function to create ProductFilter with common configurations
 */
export function createProductFilter(config: Partial<FilterConfig> = {}): ProductFilter {
  return new ProductFilter(config);
}

/**
 * Predefined filter configurations
 */
export const FilterPresets = {
  /**
   * High quality filter for premium product selection
   */
  highQuality: (): FilterConfig => ({
    minDataQuality: 0.7,
    minCompleteness: 0.8,
    minPopularity: 0.3,
    requireBrands: true,
    requireCategories: true,
    requireNutrition: true,
    prioritizeAllergenInfo: true,
    prioritizeDietaryInfo: true
  }),
  
  /**
   * Balanced filter for general use
   */
  balanced: (): FilterConfig => ({
    minDataQuality: 0.4,
    minCompleteness: 0.5,
    minPopularity: 0.1,
    requireBrands: false,
    requireCategories: true,
    prioritizeAllergenInfo: true
  }),
  
  /**
   * Permissive filter for maximum coverage
   */
  permissive: (): FilterConfig => ({
    minDataQuality: 0.2,
    minCompleteness: 0.3,
    minPopularity: 0.0,
    requireBrands: false,
    requireCategories: false,
    prioritizeAllergenInfo: false
  }),
  
  /**
   * Allergen-focused filter for dietary compliance
   */
  allergenFocused: (): FilterConfig => ({
    minDataQuality: 0.5,
    minCompleteness: 0.6,
    prioritizeAllergenInfo: true,
    prioritizeDietaryInfo: true,
    requireIngredientTags: true,
    qualityWeight: 0.3,
    completenessWeight: 0.4,
    popularityWeight: 0.3
  })
};