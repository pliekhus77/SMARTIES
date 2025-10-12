/**
 * Example demonstrating dietary compliance flag derivation
 * Shows how to use DietaryComplianceDeriver in data processing pipeline
 */

import { DietaryComplianceDeriver, createDietaryComplianceDeriver } from '../DietaryComplianceDeriver';
import { CreateProductInput } from '../../../types/Product';

/**
 * Example products with different dietary characteristics
 */
const exampleProducts: CreateProductInput[] = [
  // Vegan product with explicit labeling
  {
    code: '1234567890001',
    product_name: 'Organic Vegan Burger',
    ingredients_text: 'organic pea protein, organic coconut oil, organic potato starch, natural flavors',
    ingredients_analysis_tags: ['en:vegan', 'en:vegetarian', 'en:gluten-free'],
    allergens_tags: [],
    labels_tags: ['en:organic', 'en:vegan', 'en:gluten-free'],
    ingredients_tags: ['pea-protein', 'coconut-oil', 'potato-starch'],
    traces_tags: [],
    data_quality_score: 0.9,
    source: 'openfoodfacts'
  },
  
  // Vegetarian product with dairy
  {
    code: '1234567890002',
    product_name: 'Margherita Pizza',
    ingredients_text: 'wheat flour, tomato sauce, mozzarella cheese, olive oil, basil',
    ingredients_analysis_tags: ['en:vegetarian', 'en:non-vegan'],
    allergens_tags: ['en:milk', 'en:gluten'],
    labels_tags: ['en:vegetarian'],
    ingredients_tags: ['wheat-flour', 'tomato-sauce', 'mozzarella-cheese', 'olive-oil', 'basil'],
    traces_tags: [],
    data_quality_score: 0.8,
    source: 'openfoodfacts'
  },
  
  // Kosher certified product
  {
    code: '1234567890003',
    product_name: 'Kosher Chicken Soup',
    ingredients_text: 'chicken broth, carrots, celery, onions, chicken meat, salt, spices',
    ingredients_analysis_tags: ['en:non-vegetarian', 'en:non-vegan'],
    allergens_tags: [],
    labels_tags: ['en:kosher', 'en:kosher-certified'],
    ingredients_tags: ['chicken-broth', 'carrots', 'celery', 'onions', 'chicken-meat', 'salt', 'spices'],
    traces_tags: [],
    data_quality_score: 0.85,
    source: 'openfoodfacts'
  },
  
  // Halal certified product
  {
    code: '1234567890004',
    product_name: 'Halal Beef Jerky',
    ingredients_text: 'halal beef, salt, sugar, spices, natural flavors',
    ingredients_analysis_tags: ['en:non-vegetarian', 'en:non-vegan'],
    allergens_tags: [],
    labels_tags: ['en:halal', 'en:halal-certified'],
    ingredients_tags: ['beef', 'salt', 'sugar', 'spices', 'natural-flavors'],
    traces_tags: [],
    data_quality_score: 0.8,
    source: 'openfoodfacts'
  },
  
  // Gluten-free product
  {
    code: '1234567890005',
    product_name: 'Gluten-Free Bread',
    ingredients_text: 'rice flour, tapioca starch, potato starch, xanthan gum, yeast, salt',
    ingredients_analysis_tags: ['en:gluten-free', 'en:vegan', 'en:vegetarian'],
    allergens_tags: [],
    labels_tags: ['en:gluten-free', 'en:certified-gluten-free'],
    ingredients_tags: ['rice-flour', 'tapioca-starch', 'potato-starch', 'xanthan-gum', 'yeast', 'salt'],
    traces_tags: [],
    data_quality_score: 0.9,
    source: 'openfoodfacts'
  },
  
  // Product with conflicting information (should prioritize safety)
  {
    code: '1234567890006',
    product_name: 'Questionable Product',
    ingredients_text: 'milk powder, sugar, cocoa, vegetable oil',
    ingredients_analysis_tags: ['en:vegan'], // Conflicting with milk powder
    allergens_tags: ['en:milk'],
    labels_tags: [],
    ingredients_tags: ['milk-powder', 'sugar', 'cocoa', 'vegetable-oil'],
    traces_tags: ['en:nuts'],
    data_quality_score: 0.4,
    source: 'openfoodfacts'
  },
  
  // Minimal information product
  {
    code: '1234567890007',
    product_name: 'Basic Crackers',
    ingredients_text: 'flour, water, salt, oil',
    allergens_tags: ['en:gluten'],
    data_quality_score: 0.3,
    source: 'openfoodfacts'
  }
];

/**
 * Demonstrates dietary compliance flag derivation
 */
export async function demonstrateDietaryComplianceDerivation(): Promise<void> {
  console.log('=== Dietary Compliance Flag Derivation Demo ===\n');
  
  // Create dietary compliance deriver
  const deriver = createDietaryComplianceDeriver({
    minConfidenceThreshold: 0.7,
    strictMode: false
  });
  
  console.log('Processing individual products:\n');
  
  // Process each product individually to show detailed results
  for (const product of exampleProducts) {
    console.log(`--- Product: ${product.product_name} (${product.code}) ---`);
    
    const result = deriver.deriveComplianceFlags(product);
    
    console.log('Dietary Flags:');
    console.log(`  Vegan: ${result.dietary_flags.vegan} (confidence: ${result.confidence_scores.vegan.toFixed(2)})`);
    console.log(`  Vegetarian: ${result.dietary_flags.vegetarian} (confidence: ${result.confidence_scores.vegetarian.toFixed(2)})`);
    console.log(`  Gluten-Free: ${result.dietary_flags.gluten_free} (confidence: ${result.confidence_scores.gluten_free.toFixed(2)})`);
    console.log(`  Kosher: ${result.dietary_flags.kosher} (confidence: ${result.confidence_scores.kosher.toFixed(2)})`);
    console.log(`  Halal: ${result.dietary_flags.halal} (confidence: ${result.confidence_scores.halal.toFixed(2)})`);
    console.log(`  Organic: ${result.dietary_flags.organic} (confidence: ${result.confidence_scores.organic.toFixed(2)})`);
    
    console.log(`\nQuality Scores:`);
    console.log(`  Data Quality: ${result.data_quality_score.toFixed(2)}`);
    console.log(`  Completeness: ${result.completeness_score.toFixed(2)}`);
    
    if (result.derivation_notes.length > 0) {
      console.log(`\nDerivation Notes:`);
      result.derivation_notes.forEach(note => console.log(`  - ${note}`));
    }
    
    console.log('\n');
  }
  
  // Demonstrate batch processing
  console.log('=== Batch Processing Demo ===\n');
  
  const batchResult = await deriver.batchDeriveCompliance(exampleProducts);
  
  console.log('Batch Processing Statistics:');
  console.log(`  Total Products: ${batchResult.stats.total}`);
  console.log(`  Successfully Processed: ${batchResult.stats.processed}`);
  console.log(`  Errors: ${batchResult.stats.errors}`);
  console.log(`  Average Confidence: ${batchResult.stats.averageConfidence.toFixed(2)}`);
  
  console.log('\nDietary Flag Counts:');
  Object.entries(batchResult.stats.flagCounts).forEach(([flag, count]) => {
    console.log(`  ${flag}: ${count} products`);
  });
  
  // Show products with high confidence dietary flags
  console.log('\n=== High Confidence Products ===\n');
  
  batchResult.processed.forEach(product => {
    const result = deriver.deriveComplianceFlags(product);
    const highConfidenceFlags = Object.entries(result.confidence_scores)
      .filter(([_, confidence]) => confidence > 0.8)
      .map(([flag, confidence]) => `${flag} (${confidence.toFixed(2)})`);
    
    if (highConfidenceFlags.length > 0) {
      console.log(`${product.product_name}: ${highConfidenceFlags.join(', ')}`);
    }
  });
  
  // Demonstrate filtering by dietary requirements
  console.log('\n=== Filtering by Dietary Requirements ===\n');
  
  const veganProducts = batchResult.processed.filter(product => {
    const result = deriver.deriveComplianceFlags(product);
    return result.dietary_flags.vegan && result.confidence_scores.vegan > 0.5;
  });
  
  const vegetarianProducts = batchResult.processed.filter(product => {
    const result = deriver.deriveComplianceFlags(product);
    return result.dietary_flags.vegetarian && result.confidence_scores.vegetarian > 0.5;
  });
  
  const glutenFreeProducts = batchResult.processed.filter(product => {
    const result = deriver.deriveComplianceFlags(product);
    return result.dietary_flags.gluten_free && result.confidence_scores.gluten_free > 0.5;
  });
  
  const kosherProducts = batchResult.processed.filter(product => {
    const result = deriver.deriveComplianceFlags(product);
    return result.dietary_flags.kosher && result.confidence_scores.kosher > 0.5;
  });
  
  const halalProducts = batchResult.processed.filter(product => {
    const result = deriver.deriveComplianceFlags(product);
    return result.dietary_flags.halal && result.confidence_scores.halal > 0.5;
  });
  
  console.log(`Vegan Products (${veganProducts.length}):`);
  veganProducts.forEach(p => console.log(`  - ${p.product_name}`));
  
  console.log(`\nVegetarian Products (${vegetarianProducts.length}):`);
  vegetarianProducts.forEach(p => console.log(`  - ${p.product_name}`));
  
  console.log(`\nGluten-Free Products (${glutenFreeProducts.length}):`);
  glutenFreeProducts.forEach(p => console.log(`  - ${p.product_name}`));
  
  console.log(`\nKosher Products (${kosherProducts.length}):`);
  kosherProducts.forEach(p => console.log(`  - ${p.product_name}`));
  
  console.log(`\nHalal Products (${halalProducts.length}):`);
  halalProducts.forEach(p => console.log(`  - ${p.product_name}`));
  
  console.log('\n=== Demo Complete ===');
}

/**
 * Demonstrates integration with data cleaning pipeline
 */
export async function demonstrateIntegrationWithDataCleaning(): Promise<void> {
  console.log('\n=== Integration with Data Cleaning Pipeline ===\n');
  
  // Import DataCleaner to show integration
  const { DataCleaner } = await import('../DataCleaner');
  
  // Create cleaner with dietary flag derivation enabled
  const cleaner = new DataCleaner({
    deriveDietaryFlags: true,
    cleanIngredients: true,
    standardizeAllergens: true
  });
  
  // Example product with messy data
  const messyProduct: CreateProductInput = {
    code: '  1234567890008  ',
    product_name: '  Organic  Vegan   Protein  Bar  ',
    ingredients_text: 'organic pea protein,  organic coconut oil;  organic dates | natural flavors',
    ingredients_analysis_tags: ['en:vegan', 'en:vegetarian', 'en:organic'],
    allergens_tags: ['en:may-contain-nuts', 'en:may-contain-nuts'], // Duplicate
    labels_tags: ['en:organic', 'EN:VEGAN', 'en:gluten-free'], // Mixed case
    data_quality_score: 0.6,
    source: 'openfoodfacts'
  };
  
  console.log('Original messy product:');
  console.log(`  Name: "${messyProduct.product_name}"`);
  console.log(`  Ingredients: "${messyProduct.ingredients_text}"`);
  console.log(`  Allergens: [${messyProduct.allergens_tags.join(', ')}]`);
  console.log(`  Labels: [${messyProduct.labels_tags?.join(', ')}]`);
  console.log(`  Quality Score: ${messyProduct.data_quality_score}`);
  
  // Clean the product (includes dietary flag derivation)
  const { cleaned, stats } = cleaner.cleanProduct(messyProduct);
  
  console.log('\nCleaned product:');
  console.log(`  Name: "${cleaned.product_name}"`);
  console.log(`  Ingredients: "${cleaned.ingredients_text}"`);
  console.log(`  Allergens: [${cleaned.allergens_tags.join(', ')}]`);
  console.log(`  Labels: [${cleaned.labels_tags?.join(', ')}]`);
  console.log(`  Quality Score: ${cleaned.data_quality_score}`);
  console.log(`  Completeness Score: ${cleaned.completeness_score}`);
  
  if (cleaned.dietary_flags) {
    console.log('\nDerived Dietary Flags:');
    Object.entries(cleaned.dietary_flags).forEach(([flag, value]) => {
      console.log(`  ${flag}: ${value}`);
    });
  }
  
  console.log('\nCleaning Statistics:');
  console.log(`  Fields Modified: [${stats.fieldsModified.join(', ')}]`);
  console.log(`  Duplicates Removed: ${stats.duplicatesRemoved}`);
  console.log(`  Characters Normalized: ${stats.charactersNormalized}`);
  console.log(`  Empty Fields Removed: ${stats.emptyFieldsRemoved}`);
}

// Export for use in other examples or tests
export { exampleProducts };