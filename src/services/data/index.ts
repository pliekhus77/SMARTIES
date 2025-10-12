/**
 * Data Processing Services Index
 * Exports all data extraction, validation, cleaning, filtering, and dietary compliance components
 * Implements Requirements 2.2 and 2.5 from data schema specification
 */

import { CreateProductInput } from '../../types';

import { FilterStats } from './ProductFilter';

import { ExtractionStats } from './DataExtractor';

import { createDietaryComplianceDeriver } from './DietaryComplianceDeriver';

import { createProductFilter } from './ProductFilter';

import { createDataCleaner } from './DataCleaner';

import { createDataValidator } from './DataValidator';

import { createDataExtractor } from './DataExtractor';

import { createBulkDataLoader } from './BulkDataLoader';

import { DerivationConfig } from './DietaryComplianceDeriver';

import { FilterConfig } from './ProductFilter';

import { CleaningConfig } from './DataCleaner';

import { ValidationConfig } from './DataValidator';

import { ExtractionConfig } from './DataExtractor';

import { BulkLoadingConfig } from './BulkDataLoader';

import { DietaryComplianceDeriver } from './DietaryComplianceDeriver';

import { ProductFilter } from './ProductFilter';

import { DataCleaner } from './DataCleaner';

import { DataValidator } from './DataValidator';

import { DataExtractor } from './DataExtractor';

import { BulkDataLoader } from './BulkDataLoader';

// Data Extraction
export {
  DataExtractor,
  createDataExtractor
} from './DataExtractor';

export type {
  OpenFoodFactsRawProduct,
  ExtractionConfig,
  ExtractionStats
} from './DataExtractor';

// Data Validation
export {
  DataValidator,
  createDataValidator,
  validateUPCQuick,
  validateProductQuick
} from './DataValidator';

export type {
  ValidationConfig,
  DetailedValidationResult,
  UPCValidationResult
} from './DataValidator';

// Data Cleaning
export {
  DataCleaner,
  createDataCleaner,
  cleanIngredientsQuick,
  cleanProductNameQuick,
  cleanUPCQuick
} from './DataCleaner';

export type {
  CleaningConfig,
  CleaningStats
} from './DataCleaner';

// Product Filtering
export {
  ProductFilter,
  createProductFilter,
  FilterPresets
} from './ProductFilter';

export type {
  FilterConfig,
  FilterStats,
  RankedProduct
} from './ProductFilter';

// Dietary Compliance Derivation
export {
  DietaryComplianceDeriver,
  createDietaryComplianceDeriver,
  deriveDietaryFlagsQuick
} from './DietaryComplianceDeriver';

export type {
  DietaryFlags,
  DerivationConfig,
  DerivationResult
} from './DietaryComplianceDeriver';

// Bulk Data Loading with Vector Embeddings
export {
  BulkDataLoader,
  createBulkDataLoader,
  bulkLoadProductsQuick
} from './BulkDataLoader';

export type {
  BulkLoadingConfig,
  BulkLoadingProgress,
  BulkLoadingStats,
  BatchResult,
  ErrorRecoveryInfo,
  QualityAssuranceResult
} from './BulkDataLoader';

// Re-export types for convenience
export type { CreateProductInput } from '../../types/Product';

/**
 * Complete data processing pipeline
 * Combines extraction, validation, cleaning, filtering, dietary compliance derivation, and bulk loading with vector embeddings
 */
export class DataProcessingPipeline {
  private extractor: DataExtractor;
  private validator: DataValidator;
  private cleaner: DataCleaner;
  private filter: ProductFilter;
  private dietaryDeriver: DietaryComplianceDeriver;
  private bulkLoader: BulkDataLoader;
  
  constructor(
    extractorConfig: Partial<ExtractionConfig> = {},
    validatorConfig: Partial<ValidationConfig> = {},
    cleanerConfig: Partial<CleaningConfig> = {},
    filterConfig: Partial<FilterConfig> = {},
    dietaryConfig: Partial<DerivationConfig> = {},
    bulkLoadingConfig: Partial<BulkLoadingConfig> = {}
  ) {
    this.extractor = createDataExtractor(extractorConfig);
    this.validator = createDataValidator(validatorConfig);
    this.cleaner = createDataCleaner(cleanerConfig);
    this.filter = createProductFilter(filterConfig);
    this.dietaryDeriver = createDietaryComplianceDeriver(dietaryConfig);
    this.bulkLoader = createBulkDataLoader(bulkLoadingConfig);
  }
  
  /**
   * Processes OpenFoodFacts data through complete pipeline including dietary compliance derivation
   */
  async processData(): Promise<{
    products: CreateProductInput[];
    extractionStats: ExtractionStats;
    filterStats: FilterStats;
    dietaryStats: {
      total: number;
      processed: number;
      errors: number;
      averageConfidence: number;
      flagCounts: { [key: string]: number };
    };
    processingErrors: string[];
  }> {
    const processingErrors: string[] = [];
    const validProducts: CreateProductInput[] = [];
    
    console.log('Starting enhanced data processing pipeline with dietary compliance derivation...');
    
    try {
      // Step 1: Extract products from OpenFoodFacts dump
      console.log('Step 1: Extracting products...');
      for await (const rawProduct of this.extractor.extractProducts()) {
        try {
          // Step 2: Clean the product data (includes dietary flag derivation)
          const { cleaned, stats: cleaningStats } = this.cleaner.cleanProduct(rawProduct);
          
          // Step 3: Validate the cleaned product
          const validationResult = this.validator.validateProduct(cleaned);
          
          if (validationResult.isValid) {
            validProducts.push(cleaned);
          } else {
            processingErrors.push(`Validation failed for product ${cleaned.code}: ${validationResult.errors.join(', ')}`);
          }
          
          // Log progress
          if (validProducts.length % 1000 === 0) {
            console.log(`Processed ${validProducts.length} valid products`);
          }
          
        } catch (error) {
          processingErrors.push(`Error processing product: ${error}`);
        }
      }
      
      console.log(`Step 2-3: Validated ${validProducts.length} products with dietary compliance flags`);
      
      // Step 4: Additional dietary compliance processing if needed
      console.log('Step 4: Finalizing dietary compliance derivation...');
      const { processed: dietaryProcessed, stats: dietaryStats } = await this.dietaryDeriver.batchDeriveCompliance(validProducts);
      
      // Step 5: Filter and rank products
      console.log('Step 5: Filtering and ranking products...');
      const { selected, stats: filterStats } = await this.filter.filterProducts(dietaryProcessed);
      
      const extractionStats = this.extractor.getStats();
      
      console.log('Enhanced data processing pipeline completed successfully');
      console.log(`Final result: ${selected.length} products selected with dietary compliance flags`);
      console.log(`Dietary compliance stats: ${dietaryStats.processed} processed, avg confidence: ${dietaryStats.averageConfidence.toFixed(2)}`);
      
      return {
        products: selected,
        extractionStats,
        filterStats,
        dietaryStats,
        processingErrors
      };
      
    } catch (error) {
      console.error('Enhanced data processing pipeline failed:', error);
      throw error;
    }
  }
  
  /**
   * Processes data with bulk loading and vector embeddings (Task 3.3)
   * Complete pipeline including embedding generation and MongoDB bulk insertion
   */
  async processDataWithBulkLoading(
    progressCallback?: (progress: BulkLoadingProgress) => void
  ): Promise<{
    success: boolean;
    products: CreateProductInput[];
    extractionStats: ExtractionStats;
    filterStats: FilterStats;
    dietaryStats: {
      total: number;
      processed: number;
      errors: number;
      averageConfidence: number;
      flagCounts: { [key: string]: number };
    };
    bulkLoadingStats: BulkLoadingStats;
    bulkLoadingProgress: BulkLoadingProgress;
    errorRecovery: ErrorRecoveryInfo[];
    qualityAssurance: QualityAssuranceResult;
    processingErrors: string[];
  }> {
    const processingErrors: string[] = [];
    
    console.log('🚀 Starting complete data processing pipeline with bulk loading and vector embeddings...');
    
    try {
      // Step 1-5: Standard processing pipeline (extraction, cleaning, validation, filtering, dietary compliance)
      const standardResult = await this.processData();
      
      if (standardResult.processingErrors.length > 0) {
        processingErrors.push(...standardResult.processingErrors);
      }
      
      console.log(`✅ Standard processing completed: ${standardResult.products.length} products ready for bulk loading`);
      
      // Step 6: Bulk loading with vector embeddings
      console.log('Step 6: Bulk loading with vector embeddings...');
      const bulkLoadingResult = await this.bulkLoader.loadProductsWithEmbeddings(
        standardResult.products,
        progressCallback
      );
      
      console.log('Complete data processing pipeline with bulk loading completed');
      console.log(`📊 Final results: ${bulkLoadingResult.stats.successfulProducts} products loaded successfully`);
      console.log(`⚡ Performance: ${bulkLoadingResult.stats.performanceMetrics.productsPerSecond.toFixed(1)} products/sec`);
      console.log(`🎯 Quality score: ${bulkLoadingResult.qualityAssurance.overallScore.toFixed(2)}`);
      
      return {
        success: bulkLoadingResult.success && standardResult.processingErrors.length === 0,
        products: standardResult.products,
        extractionStats: standardResult.extractionStats,
        filterStats: standardResult.filterStats,
        dietaryStats: standardResult.dietaryStats,
        bulkLoadingStats: bulkLoadingResult.stats,
        bulkLoadingProgress: bulkLoadingResult.progress,
        errorRecovery: bulkLoadingResult.errorRecovery,
        qualityAssurance: bulkLoadingResult.qualityAssurance,
        processingErrors
      };
      
    } catch (error) {
      console.error('Complete data processing pipeline with bulk loading failed:', error);
      throw error;
    }
  }
  
  /**
   * Gets bulk loader instance for direct access
   */
  getBulkLoader(): BulkDataLoader {
    return this.bulkLoader;
  }
}