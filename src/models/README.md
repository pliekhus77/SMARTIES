# MongoDB Atlas Vector Search Models

This directory contains the MongoDB Atlas Vector Search infrastructure and data models for the SMARTIES application, implementing Requirements 1.1, 1.2, and 1.5 from the data schema specification.

## Overview

The models provide:
- **384-dimension vector embeddings** for semantic product search using Hugging Face Transformers
- **Optimized indexes** for sub-100ms UPC lookup and vector similarity search
- **Storage optimization** for MongoDB Atlas M0 free tier (512MB limit)
- **Dietary compliance flags** derived from OpenFoodFacts data
- **Hybrid search capabilities** combining exact UPC lookup with AI-powered similarity

## Architecture

```
src/models/
├── Product.ts              # Product schema with vector embeddings
├── VectorSearchIndex.ts    # Vector search query management
├── DatabaseConnection.ts   # MongoDB Atlas connection utilities
└── __tests__/             # Comprehensive test suite
```

## Key Features

### 1. Vector-Enhanced Product Schema

```typescript
interface Product {
  // Core identification
  code: string;                    // UPC/barcode
  product_name: string;            // Product name
  
  // OpenFoodFacts compatibility
  ingredients_text: string;        // Raw ingredients for embedding
  allergens_tags: string[];        // Allergen information
  labels_tags: string[];           // Certifications (kosher, halal, etc.)
  
  // AI-powered search vectors (384 dimensions each)
  ingredients_embedding: number[]; // Ingredient similarity
  product_name_embedding: number[]; // Product name matching
  allergens_embedding: number[];   // Allergen profile analysis
  
  // Derived dietary compliance
  dietary_flags: {
    vegan: boolean;
    vegetarian: boolean;
    gluten_free: boolean;
    kosher: boolean;
    halal: boolean;
  };
}
```

### 2. Vector Search Capabilities

- **Semantic Ingredient Matching**: Find products with similar ingredients
- **Allergen Risk Detection**: Identify potential allergen cross-contamination
- **Dietary Compliance**: Match products to user dietary restrictions
- **Product Discovery**: Natural language queries like "nut-free cookies"

### 3. Performance Optimization

- **Sub-100ms UPC Lookup**: Optimized indexes for barcode scanning
- **Hybrid Search**: Combines exact matching with vector similarity
- **Storage Efficiency**: Selective data import for M0 tier limits
- **Query Optimization**: Compound indexes and filtering strategies

## Setup Instructions

### 1. Database Connection

```bash
# Test MongoDB Atlas connection
npm run test:mongodb

# Full setup with index creation
npm run setup:mongodb
```

### 2. Environment Configuration

```bash
# Required environment variables
MONGODB_URI=mongodb+srv://username:password@cluster0.31pwc7s.mongodb.net/smarties_db
MONGODB_DATABASE=smarties_db
```

### 3. Vector Search Index Creation

Vector search indexes must be created via MongoDB Atlas UI:

```javascript
// Ingredients Vector Index
{
  "name": "ingredients_vector_index",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "ingredients_embedding",
        "numDimensions": 384,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "dietary_flags"
      }
    ]
  }
}
```

## Usage Examples

### 1. Product Creation

```typescript
import { ProductModel } from './models/Product';

const productInput: CreateProductInput = {
  code: '1234567890123',
  product_name: 'Organic Chocolate Chip Cookies',
  ingredients_text: 'organic flour, organic sugar, chocolate chips, butter, eggs',
  allergens_tags: ['en:gluten', 'en:milk', 'en:eggs'],
  labels_tags: ['en:organic'],
  data_quality_score: 0.9,
  source: 'openfoodfacts'
};

const document = ProductModel.createDocument(productInput);
// Note: Vector embeddings added separately by embedding service
```

### 2. Vector Search

```typescript
import { VectorSearchIndexManager } from './models/VectorSearchIndex';

const vectorManager = new VectorSearchIndexManager(dbService);

// Find similar products by ingredients
const query: VectorSearchQuery = {
  queryVector: ingredientEmbedding, // 384-dimension vector
  path: 'ingredients_embedding',
  numCandidates: 100,
  limit: 10,
  minScore: 0.7,
  filter: {
    'dietary_flags.vegan': true,
    'allergens_tags': { $nin: ['en:milk', 'en:eggs'] }
  }
};

const results = await vectorManager.vectorSearch('products', query);
```

### 3. Hybrid Search

```typescript
// Combine exact UPC lookup with similarity search
const hybridQuery = {
  exactQuery: { code: '1234567890123' },
  vectorQuery: {
    queryVector: productEmbedding,
    path: 'product_name_embedding',
    numCandidates: 50,
    limit: 5
  },
  maxResults: 10,
  boostExactMatches: true,
  minVectorScore: 0.6
};

const results = await vectorManager.hybridSearch('products', hybridQuery);
```

## Storage Optimization

### MongoDB Atlas M0 Limits
- **Storage**: 512MB maximum
- **Connections**: 500 concurrent
- **Vector Search**: Supported (10 indexes max)

### Optimization Strategies
```typescript
import { StorageOptimizer } from './models/Product';

// Estimate storage usage
const documentSize = StorageOptimizer.estimateDocumentSize(product);
const maxProducts = StorageOptimizer.calculateMaxProducts(12000); // ~38,000 products

// Get optimization recommendations
const suggestions = StorageOptimizer.getOptimizationSuggestions();
```

## Index Strategy

### Standard Indexes
- **Primary UPC**: `{ code: 1 }` (unique, sub-100ms lookup)
- **Dietary Filters**: `{ 'dietary_flags.vegan': 1 }`, etc.
- **Quality Ranking**: `{ data_quality_score: -1, popularity_score: -1 }`
- **Text Search**: Full-text index for fallback queries

### Vector Search Indexes
- **Ingredients**: 384-dim cosine similarity with dietary filters
- **Product Names**: 384-dim cosine similarity with category filters  
- **Allergens**: 384-dim cosine similarity with allergen filters

## Testing

```bash
# Unit tests
npm test -- --testPathPattern="models"

# Integration tests (requires MongoDB connection)
RUN_INTEGRATION_TESTS=true npm test -- --testPathPattern="integration"

# Coverage report
npm run test:coverage
```

## Performance Benchmarks

### Target Performance
- **UPC Lookup**: <100ms (99th percentile)
- **Vector Search**: <500ms (95th percentile)
- **Hybrid Search**: <300ms (combining both)
- **Storage Efficiency**: 10,000-15,000 products in 512MB

### Monitoring
```typescript
import { DatabaseConnection } from './models/DatabaseConnection';

const db = DatabaseManager.getInstance();
const stats = await db.getStorageStats();
const validation = await db.validateSetup();
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   ```bash
   # Check network connectivity
   npm run test:mongodb
   ```

2. **Vector Search Not Working**
   - Verify indexes created in MongoDB Atlas UI
   - Check vector dimensions (must be exactly 384)
   - Validate embedding generation

3. **Storage Limit Exceeded**
   ```typescript
   const stats = await db.getStorageStats();
   console.log(`Usage: ${stats.utilizationPercentage}%`);
   ```

4. **Slow Query Performance**
   - Check index usage with `explain()`
   - Optimize `numCandidates` parameter
   - Add appropriate filters

### Debug Commands
```bash
# Test connection only
npm run test:mongodb

# Full setup validation
npm run setup:mongodb

# Check storage usage
node -e "require('./src/models/DatabaseConnection').DatabaseManager.getInstance().getStorageStats().then(console.log)"
```

## Next Steps

1. **Create Vector Search Indexes** via MongoDB Atlas UI
2. **Configure IP Whitelist** for hackathon venue access
3. **Import Sample Data** using embedding generation service
4. **Test Hybrid Search** functionality with real product data
5. **Monitor Performance** and optimize based on usage patterns

## Related Documentation

- [Vector Search Setup Guide](../docs/vector-search-setup.md)
- [Embedding Generation Service](../services/README.md)
- [Performance Optimization](../docs/performance-optimization.md)
- [MongoDB Atlas Configuration](../docs/mongodb-atlas-setup.md)