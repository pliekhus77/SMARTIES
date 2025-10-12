# Data Processing Services

This directory contains the data extraction, validation, cleaning, and filtering components for processing OpenFoodFacts data for the SMARTIES application. These services implement Requirements 2.2 and 2.5 from the data schema specification.

## Overview

The data processing pipeline transforms raw OpenFoodFacts MongoDB dump data into clean, validated, and optimized product records suitable for MongoDB Atlas M0 storage with vector search capabilities.

## Components

### 1. DataExtractor (`DataExtractor.ts`)

Extracts product data from OpenFoodFacts MongoDB dumps with intelligent filtering and transformation.

**Features:**
- Reads OpenFoodFacts MongoDB dump files
- Extracts relevant product data with language preferences
- Handles large datasets with memory optimization
- Supports filtering and pagination for storage limits
- Calculates data quality and popularity scores

**Usage:**
```typescript
import { createDataExtractor } from './data';

const extractor = createDataExtractor({
  sourceConnectionString: 'mongodb://localhost:27017',
  sourceDatabaseName: 'off',
  sourceCollectionName: 'products',
  maxProducts: 15000,
  minDataQuality: 0.3,
  requireUPC: true,
  requireIngredients: true,
  preferredLanguage: 'en'
});

for await (const product of extractor.extractProducts()) {
  console.log(`Extracted: ${product.product_name}`);
}
```

### 2. DataValidator (`DataValidator.ts`)

Validates product data with comprehensive UPC validation and field checking.

**Features:**
- UPC code validation (UPC-A, EAN-13, EAN-8, GTIN-14)
- Check digit validation for barcode formats
- Required field validation
- Data quality scoring
- Detailed validation results with field-specific errors

**Usage:**
```typescript
import { createDataValidator } from './data';

const validator = createDataValidator({
  strictUPCValidation: true,
  minDataQualityScore: 0.3,
  requireIngredients: true
});

const result = validator.validateProduct(productData);
if (result.isValid) {
  console.log('Product is valid');
} else {
  console.log('Validation errors:', result.errors);
}
```

### 3. DataCleaner (`DataCleaner.ts`)

Cleans and normalizes product data for consistency and quality.

**Features:**
- Unicode normalization
- Ingredient text cleaning and standardization
- Allergen tag standardization
- Text encoding issue fixes
- Duplicate removal and deduplication

**Usage:**
```typescript
import { createDataCleaner } from './data';

const cleaner = createDataCleaner({
  normalizeUnicode: true,
  standardizeAllergens: true,
  cleanIngredients: true,
  deduplicateTags: true
});

const { cleaned, stats } = cleaner.cleanProduct(rawProduct);
console.log('Cleaning stats:', stats);
```

### 4. ProductFilter (`ProductFilter.ts`)

Filters and ranks products for optimal selection within storage constraints.

**Features:**
- Quality-based filtering
- Completeness scoring
- Popularity-based ranking
- Storage optimization for MongoDB Atlas M0
- Category and content filtering
- Multiple filter presets

**Usage:**
```typescript
import { createProductFilter, FilterPresets } from './data';

const filter = createProductFilter(FilterPresets.balanced());
const { selected, stats } = await filter.filterProducts(products);

console.log(`Selected ${selected.length} products`);
console.log(`Estimated storage: ${stats.estimatedStorageBytes / 1024 / 1024} MB`);
```

### 5. DataProcessingPipeline (`index.ts`)

Complete pipeline combining all processing steps.

**Usage:**
```typescript
import { DataProcessingPipeline, FilterPresets } from './data';

const pipeline = new DataProcessingPipeline(
  { maxProducts: 15000, minDataQuality: 0.4 }, // Extraction config
  { strictUPCValidation: false }, // Validation config
  { normalizeUnicode: true }, // Cleaning config
  FilterPresets.balanced() // Filtering config
);

const result = await pipeline.processData();
console.log(`Processed ${result.products.length} products`);
```

## Filter Presets

Pre-configured filter settings for different use cases:

- **`FilterPresets.highQuality()`**: Premium product selection with strict requirements
- **`FilterPresets.balanced()`**: General use with moderate requirements
- **`FilterPresets.permissive()`**: Maximum coverage with minimal requirements
- **`FilterPresets.allergenFocused()`**: Prioritizes products with allergen information

## Configuration Options

### ExtractionConfig
- `sourceConnectionString`: MongoDB connection string
- `maxProducts`: Maximum products to extract (default: 15000)
- `minDataQuality`: Minimum data quality score (default: 0.3)
- `requireUPC`: Require valid UPC codes (default: true)
- `requireIngredients`: Require ingredients text (default: true)
- `preferredLanguage`: Language preference for text fields (default: 'en')

### ValidationConfig
- `strictUPCValidation`: Enforce check digit validation (default: true)
- `minDataQualityScore`: Minimum acceptable quality score (default: 0.3)
- `requireIngredients`: Require ingredients text (default: true)
- `minProductNameLength`: Minimum product name length (default: 2)
- `maxProductNameLength`: Maximum product name length (default: 200)

### CleaningConfig
- `normalizeUnicode`: Normalize Unicode characters (default: true)
- `standardizeAllergens`: Standardize allergen names (default: true)
- `cleanIngredients`: Clean ingredients text (default: true)
- `deduplicateTags`: Remove duplicate tags (default: true)
- `maxTagLength`: Maximum tag length (default: 100)

### FilterConfig
- `minDataQuality`: Minimum data quality score (default: 0.3)
- `minCompleteness`: Minimum completeness score (default: 0.4)
- `maxProducts`: Maximum products to select (default: 15000)
- `maxStorageBytes`: Maximum storage limit (default: 90% of 512MB)
- `qualityWeight`: Weight for quality in ranking (default: 0.4)
- `popularityWeight`: Weight for popularity in ranking (default: 0.3)

## MongoDB Atlas M0 Optimization

The services are optimized for MongoDB Atlas M0 (free tier) with 512MB storage limit:

- **Storage Estimation**: Calculates document sizes including vector embeddings
- **Product Limits**: Defaults to ~15,000 products (estimated 12KB each)
- **Quality Filtering**: Prioritizes high-quality products for storage efficiency
- **Selective Import**: Focuses on popular, complete products

## Error Handling

All services include comprehensive error handling:

- **Validation Errors**: Detailed field-specific error messages
- **Processing Errors**: Graceful handling of malformed data
- **Connection Errors**: Proper MongoDB connection error handling
- **Memory Management**: Streaming processing for large datasets

## Testing

Unit tests are provided for all components:

```bash
npm test src/services/data/__tests__/
```

Test coverage includes:
- UPC validation edge cases
- Data cleaning transformations
- Filtering logic
- Error conditions
- Configuration options

## Examples

See `examples/DataProcessingExample.ts` for comprehensive usage examples:

```bash
npm run example:data-processing
```

## Performance Considerations

- **Memory Usage**: Streaming processing to handle large datasets
- **Processing Speed**: Optimized aggregation pipelines for MongoDB
- **Storage Efficiency**: Intelligent product selection for space constraints
- **Network Usage**: Batch processing to minimize database round trips

## Integration with Vector Search

The processed products are ready for vector embedding generation:

1. **Clean Text**: Normalized ingredients and product names
2. **Structured Data**: Consistent allergen and category tags
3. **Quality Scores**: Metadata for ranking and filtering
4. **Storage Optimization**: Fits within MongoDB Atlas M0 limits

## Troubleshooting

### Common Issues

1. **Connection Errors**: Verify MongoDB connection string and network access
2. **Memory Issues**: Reduce batch size or product limits
3. **Validation Failures**: Check data quality thresholds
4. **Storage Limits**: Adjust maxProducts or quality filters

### Debug Logging

Enable debug logging for detailed processing information:

```typescript
const extractor = createDataExtractor({
  // ... config
});

// Monitor extraction progress
for await (const product of extractor.extractProducts()) {
  if (count % 1000 === 0) {
    console.log(`Processed ${count} products`);
  }
}
```

## Contributing

When adding new features:

1. Follow existing patterns for configuration and error handling
2. Add comprehensive unit tests
3. Update documentation and examples
4. Consider MongoDB Atlas M0 storage constraints
5. Maintain backward compatibility with existing APIs