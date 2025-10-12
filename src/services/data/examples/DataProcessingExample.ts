/**
 * Data Processing Example
 * Demonstrates how to use the complete data extraction, validation, cleaning, and filtering pipeline
 * Implements Requirements 2.2 and 2.5 from data schema specification
 */

import {
  DataExtractor,
  DataValidator,
  DataCleaner,
  ProductFilter,
  DataProcessingPipeline,
  FilterPresets,
  createDataExtractor,
  createDataValidator,
  createDataCleaner,
  createProductFilter
} from '../index';
import { CreateProductInput } from '../../../types/Product';

/**
 * Example: Basic data extraction from OpenFoodFacts dump
 */
export async function basicExtractionExample(): Promise<void> {
  console.log('=== Basic Data Extraction Example ===');
  
  // Create extractor with configuration for MongoDB Atlas M0 limits
  const extractor = createDataExtractor({
    sourceConnectionString: process.env.OPENFOODFACTS_MONGO_URI || 'mongodb://localhost:27017',
    sourceDatabaseName: 'off',
    sourceCollectionName: 'products',
    maxProducts: 1000, // Limit for example
    minDataQuality: 0.4,
    requireUPC: true,
    requireIngredients: true,
    preferredLanguage: 'en'
  });
  
  console.log('Starting extraction...');
  
  let count = 0;
  try {
    for await (const product of extractor.extractProducts()) {
      count++;
      console.log(`Extracted product ${count}: ${product.product_name} (${product.code})`);
      
      // Stop after a few examples
      if (count >= 5) {
        break;
      }
    }
  } catch (error) {
    console.error('Extraction failed:', error);
  }
  
  const stats = extractor.getStats();
  console.log('Extraction stats:', stats);
}

/**
 * Example: Data validation with detailed results
 */
export function validationExample(): void {
  console.log('\n=== Data Validation Example ===');
  
  const validator = createDataValidator({
    strictUPCValidation: true,
    minDataQualityScore: 0.3,
    requireIngredients: true
  });
  
  // Example products with various quality levels
  const testProducts: CreateProductInput[] = [
    {
      code: '1234567890123',
      product_name: 'High Quality Chocolate Cookies',
      ingredients_text: 'enriched flour, sugar, chocolate chips, butter, eggs, vanilla extract, baking soda, salt',
      allergens_tags: ['en:gluten', 'en:milk', 'en:eggs'],
      brands_tags: ['famous-brand'],
      categories_tags: ['en:snacks', 'en:cookies'],
      ingredients_tags: ['en:flour', 'en:sugar', 'en:chocolate-chips'],
      labels_tags: ['en:organic'],
      data_quality_score: 0.9,
      source: 'openfoodfacts',
      nutritionalInfo: { calories: 450, sodium: 200, sugar: 25 },
      imageUrl: 'https://example.com/cookies.jpg'
    },
    {
      code: '9876543210987',
      product_name: 'Basic Snack',
      ingredients_text: 'flour, sugar',
      allergens_tags: [],
      data_quality_score: 0.4,
      source: 'openfoodfacts'
    },
    {
      code: 'invalid-upc',
      product_name: 'Invalid Product',
      ingredients_text: 'unknown ingredients',
      allergens_tags: ['invalid-allergen'],
      data_quality_score: 0.1, // Below minimum
      source: 'unknown' as any
    }
  ];
  
  testProducts.forEach((product, index) => {
    console.log(`\nValidating product ${index + 1}: ${product.product_name}`);
    
    const result = validator.validateProduct(product);
    
    console.log(`Valid: ${result.isValid}`);
    console.log(`Data Quality Score: ${result.dataQualityScore.toFixed(2)}`);
    console.log(`Completeness Score: ${result.completenessScore.toFixed(2)}`);
    
    if (result.errors.length > 0) {
      console.log('Errors:', result.errors);
    }
    
    if (result.warnings.length > 0) {
      console.log('Warnings:', result.warnings.slice(0, 3)); // Show first 3 warnings
    }
    
    if (Object.keys(result.fieldErrors).length > 0) {
      console.log('Field Errors:', Object.keys(result.fieldErrors));
    }
  });
}

/**
 * Example: Data cleaning and normalization
 */
export function cleaningExample(): void {
  console.log('\n=== Data Cleaning Example ===');
  
  const cleaner = createDataCleaner({
    normalizeUnicode: true,
    standardizeAllergens: true,
    cleanIngredients: true,
    deduplicateTags: true
  });
  
  // Example product with messy data
  const messyProduct: CreateProductInput = {
    code: '123-456-789-012', // Has dashes
    product_name: '  CHOCOLATE  CHIP   COOKIES  ', // Extra spaces, all caps
    ingredients_text: 'flour (wheat) , sugar ; chocolate chips (milk) , salt,, vanilla extract', // Mixed separators, double commas
    allergens_tags: ['milk', 'GLUTEN', 'milk', 'gluten'], // Duplicates, inconsistent case
    brands_tags: ['  Brand Name  ', '', 'Brand Name'], // Duplicates, empty string, extra spaces
    categories_tags: ['snacks', 'SNACKS', 'cookies'],
    data_quality_score: 0.7,
    source: 'openfoodfacts',
    imageUrl: 'http://example.com/image with spaces.jpg' // HTTP and spaces
  };
  
  console.log('Original product:');
  console.log('Code:', messyProduct.code);
  console.log('Name:', `"${messyProduct.product_name}"`);
  console.log('Ingredients:', messyProduct.ingredients_text);
  console.log('Allergens:', messyProduct.allergens_tags);
  console.log('Brands:', messyProduct.brands_tags);
  console.log('Image URL:', messyProduct.imageUrl);
  
  const { cleaned, stats } = cleaner.cleanProduct(messyProduct);
  
  console.log('\nCleaned product:');
  console.log('Code:', cleaned.code);
  console.log('Name:', `"${cleaned.product_name}"`);
  console.log('Ingredients:', cleaned.ingredients_text);
  console.log('Allergens:', cleaned.allergens_tags);
  console.log('Brands:', cleaned.brands_tags);
  console.log('Image URL:', cleaned.imageUrl);
  
  console.log('\nCleaning stats:');
  console.log('Fields modified:', stats.fieldsModified);
  console.log('Duplicates removed:', stats.duplicatesRemoved);
  console.log('Characters normalized:', stats.charactersNormalized);
}

/**
 * Example: Product filtering and ranking
 */
export async function filteringExample(): Promise<void> {
  console.log('\n=== Product Filtering Example ===');
  
  // Create sample products with varying quality
  const sampleProducts: CreateProductInput[] = [
    {
      code: '1111111111111',
      product_name: 'Premium Organic Cookies',
      ingredients_text: 'organic flour, organic sugar, organic chocolate chips',
      allergens_tags: ['en:gluten', 'en:milk'],
      brands_tags: ['premium-brand'],
      categories_tags: ['en:snacks', 'en:cookies', 'en:organic'],
      labels_tags: ['en:organic', 'en:non-gmo'],
      data_quality_score: 0.95,
      popularity_score: 0.8,
      completeness_score: 0.9,
      source: 'openfoodfacts',
      nutritionalInfo: { calories: 400, sodium: 150, sugar: 20 },
      imageUrl: 'https://example.com/premium-cookies.jpg'
    },
    {
      code: '2222222222222',
      product_name: 'Basic Crackers',
      ingredients_text: 'flour, salt, oil',
      allergens_tags: ['en:gluten'],
      categories_tags: ['en:snacks'],
      data_quality_score: 0.6,
      popularity_score: 0.3,
      source: 'openfoodfacts'
    },
    {
      code: '3333333333333',
      product_name: 'Low Quality Item',
      ingredients_text: 'unknown',
      allergens_tags: [],
      data_quality_score: 0.2, // Below most thresholds
      source: 'manual'
    },
    {
      code: '4444444444444',
      product_name: 'Popular Snack',
      ingredients_text: 'corn, salt, flavoring',
      allergens_tags: [],
      brands_tags: ['popular-brand'],
      categories_tags: ['en:snacks', 'en:chips'],
      data_quality_score: 0.7,
      popularity_score: 0.9, // Very popular
      source: 'openfoodfacts',
      nutritionalInfo: { calories: 500, sodium: 300 }
    }
  ];
  
  // Test different filter presets
  const filterConfigs = [
    { name: 'High Quality', config: FilterPresets.highQuality() },
    { name: 'Balanced', config: FilterPresets.balanced() },
    { name: 'Permissive', config: FilterPresets.permissive() },
    { name: 'Allergen Focused', config: FilterPresets.allergenFocused() }
  ];
  
  for (const { name, config } of filterConfigs) {
    console.log(`\n--- ${name} Filter ---`);
    
    const filter = createProductFilter({
      ...config,
      maxProducts: 10 // Small limit for example
    });
    
    const { selected, stats, ranked } = await filter.filterProducts(sampleProducts);
    
    console.log(`Input products: ${stats.totalInput}`);
    console.log(`Passed quality filter: ${stats.passedQualityFilter}`);
    console.log(`Passed completeness filter: ${stats.passedCompletenessFilter}`);
    console.log(`Final selected: ${stats.finalSelected}`);
    console.log(`Average quality score: ${stats.averageQualityScore.toFixed(2)}`);
    console.log(`Average completeness score: ${stats.averageCompletenessScore.toFixed(2)}`);
    
    console.log('Selected products:');
    selected.forEach((product, index) => {
      const rankedProduct = ranked.find(r => r.product.code === product.code);
      console.log(`  ${index + 1}. ${product.product_name} (Score: ${rankedProduct?.rankingScore.toFixed(2)})`);
    });
  }
}

/**
 * Example: Complete data processing pipeline
 */
export async function completeProcessingExample(): Promise<void> {
  console.log('\n=== Complete Processing Pipeline Example ===');
  
  // Create pipeline with optimized settings for MongoDB Atlas M0
  const pipeline = new DataProcessingPipeline(
    // Extraction config
    {
      sourceConnectionString: process.env.OPENFOODFACTS_MONGO_URI || 'mongodb://localhost:27017',
      maxProducts: 5000, // Limit for M0 storage
      minDataQuality: 0.4,
      requireUPC: true,
      requireIngredients: true
    },
    // Validation config
    {
      strictUPCValidation: false, // More permissive for real-world data
      minDataQualityScore: 0.3
    },
    // Cleaning config
    {
      normalizeUnicode: true,
      standardizeAllergens: true,
      cleanIngredients: true,
      deduplicateTags: true
    },
    // Filtering config
    FilterPresets.balanced()
  );
  
  try {
    console.log('Starting complete data processing pipeline...');
    
    const result = await pipeline.processData();
    
    console.log('\n=== Pipeline Results ===');
    console.log(`Total products processed: ${result.extractionStats.totalProcessed}`);
    console.log(`Valid products extracted: ${result.extractionStats.validProducts}`);
    console.log(`Final products selected: ${result.products.length}`);
    console.log(`Processing errors: ${result.processingErrors.length}`);
    
    if (result.processingErrors.length > 0) {
      console.log('\nFirst 5 processing errors:');
      result.processingErrors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    console.log('\nFilter statistics:');
    console.log(`Average quality score: ${result.filterStats.averageQualityScore.toFixed(2)}`);
    console.log(`Average completeness score: ${result.filterStats.averageCompletenessScore.toFixed(2)}`);
    console.log(`Estimated storage: ${(result.filterStats.estimatedStorageBytes / 1024 / 1024).toFixed(2)} MB`);
    
    if (result.filterStats.topCategories.length > 0) {
      console.log('\nTop categories:');
      result.filterStats.topCategories.slice(0, 5).forEach(({ category, count }) => {
        console.log(`  ${category}: ${count} products`);
      });
    }
    
    if (result.filterStats.topBrands.length > 0) {
      console.log('\nTop brands:');
      result.filterStats.topBrands.slice(0, 5).forEach(({ brand, count }) => {
        console.log(`  ${brand}: ${count} products`);
      });
    }
    
    // Show sample of final products
    console.log('\nSample of final products:');
    result.products.slice(0, 3).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.product_name} (${product.code})`);
      console.log(`     Quality: ${product.data_quality_score.toFixed(2)}, Source: ${product.source}`);
      console.log(`     Allergens: ${product.allergens_tags.join(', ') || 'None'}`);
    });
    
  } catch (error) {
    console.error('Pipeline processing failed:', error);
  }
}

/**
 * Example: UPC validation edge cases
 */
export function upcValidationExample(): void {
  console.log('\n=== UPC Validation Edge Cases ===');
  
  const validator = createDataValidator({ strictUPCValidation: true });
  
  const testUPCs = [
    '036000291452', // Valid Coca-Cola UPC-A
    '123456789012', // Invalid check digit
    '1234567890123', // Valid EAN-13 length
    '12345678', // Valid EAN-8 length
    '123-456-789-012', // With dashes
    '123 456 789 012', // With spaces
    'abcd1234567890', // Contains letters
    '123', // Too short
    '12345678901234567890', // Too long
    '', // Empty
    '0000000000000' // All zeros
  ];
  
  testUPCs.forEach(upc => {
    const result = validator.validateUPC(upc);
    console.log(`UPC: "${upc}" -> Valid: ${result.isValid}, Format: ${result.format || 'N/A'}, Check Digit: ${result.checkDigitValid || 'N/A'}`);
    if (!result.isValid && result.errors.length > 0) {
      console.log(`  Errors: ${result.errors[0]}`);
    }
  });
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Running Data Processing Examples\n');
  
  try {
    // Run examples that don't require database connection
    validationExample();
    cleaningExample();
    await filteringExample();
    upcValidationExample();
    
    // Run database-dependent examples only if connection is available
    if (process.env.OPENFOODFACTS_MONGO_URI) {
      await basicExtractionExample();
      await completeProcessingExample();
    } else {
      console.log('\n⚠️  Skipping database-dependent examples (OPENFOODFACTS_MONGO_URI not set)');
    }
    
    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Example execution failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}