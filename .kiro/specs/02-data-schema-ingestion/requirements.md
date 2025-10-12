# Requirements Document

## Introduction

This specification covers the data schema and ingestion phase (steps 2.1 - 2.5) of the SMARTIES hackathon project. The goal is to establish a robust product data foundation using the OpenFoodFacts database dump (69GB of real product data) with proper schema design and data ingestion that will enable immediate testing and development of the dietary compliance features. This phase focuses on importing and structuring real-world product data with comprehensive UPC-to-product mapping and allergen information with MongoDB Atlas Vector Search capabilities for AI-powered semantic analysis.

## Requirements

### Requirement 1

**User Story:** As a data engineer, I want to define a comprehensive product schema with MongoDB Atlas Vector Search capabilities so that the application can store detailed product information with AI-powered semantic search for enhanced product matching and dietary analysis.

#### Acceptance Criteria

1. WHEN the product schema is defined THEN the system SHALL include fields for `code` (UPC/barcode), `product_name`, `brands_tags`, `ingredients_text`, and `allergens_tags` based on OpenFoodFacts structure
2. WHEN vector embeddings are added THEN the system SHALL include vector fields for `ingredients_embedding`, `product_name_embedding`, and `allergens_embedding` using OpenAI/Anthropic embeddings with 1536 dimensions
3. WHEN allergen fields are structured THEN the system SHALL support comprehensive allergen information from `allergens_tags`, `allergens_hierarchy`, and `traces_tags` with vector similarity search capabilities
4. WHEN dietary compliance fields are added THEN the system SHALL derive boolean flags for halal, kosher, vegan, vegetarian, and gluten-free status from `ingredients_analysis_tags` and `labels_tags`
5. WHEN the schema is validated THEN the system SHALL ensure proper data types, vector indexes for semantic search, and validation rules for fast barcode scanning and AI-powered matching

### Requirement 2

**User Story:** As a backend developer, I want to ingest OpenFoodFacts data with vector embeddings into MongoDB Atlas so that the system can perform semantic product matching, ingredient similarity analysis, and AI-powered dietary compliance checking.

#### Acceptance Criteria

1. WHEN the OpenFoodFacts dump is processed THEN the system SHALL import products with generated vector embeddings for ingredients, product names, and allergen information using OpenAI/Anthropic APIs
2. WHEN vector indexes are created THEN the system SHALL configure MongoDB Atlas Vector Search indexes for `ingredients_embedding`, `product_name_embedding`, and `allergens_embedding` fields with cosine similarity
3. WHEN semantic search is enabled THEN the system SHALL support finding similar products by ingredient composition using vector similarity with configurable threshold scores
4. WHEN AI-powered matching works THEN the system SHALL identify potential allergen risks in products with similar ingredient profiles using vector distance calculations
5. WHEN data quality is maintained THEN the system SHALL ensure all imported products have valid UPC codes, non-empty ingredient text, and successfully generated vector embeddings

### Requirement 3

**User Story:** As a quality assurance engineer, I want to leverage vector search for intelligent allergen detection so that the system can identify hidden allergens, ingredient substitutions, and cross-contamination risks through semantic analysis.

#### Acceptance Criteria

1. WHEN semantic allergen detection is queried THEN the system SHALL identify products with similar allergen profiles using vector similarity search with minimum 0.8 cosine similarity
2. WHEN ingredient analysis is performed THEN the system SHALL detect potential allergen risks in ingredient synonyms and derivatives using vector embeddings with confidence scores
3. WHEN cross-contamination detection is executed THEN the system SHALL find products with similar manufacturing processes that may share allergen risks using facility and trace information
4. WHEN AI-powered recommendations are requested THEN the system SHALL suggest safer alternative products using vector similarity matching with dietary restriction filters
5. WHEN confidence scoring is calculated THEN the system SHALL provide confidence levels for allergen detection based on vector similarity scores ranging from 0.0 to 1.0

### Requirement 4

**User Story:** As a product manager, I want to use vector search for intelligent dietary compliance matching so that users can find products that match their dietary restrictions through semantic understanding of ingredients and certifications.

#### Acceptance Criteria

1. WHEN dietary preference matching is requested THEN the system SHALL find products suitable for specific diets (vegan, kosher, halal, gluten-free) using vector similarity of ingredient profiles with minimum 0.7 similarity threshold
2. WHEN ingredient substitution detection is performed THEN the system SHALL identify when products contain alternative ingredients that may affect dietary compliance using semantic ingredient analysis
3. WHEN semantic certification matching is executed THEN the system SHALL understand certification equivalencies and ingredient implications using AI-powered label analysis
4. WHEN personalized recommendations are generated THEN the system SHALL suggest products based on user's dietary history and preferences using vector search combined with explicit dietary flags
5. WHEN cultural dietary understanding is applied THEN the system SHALL recognize cultural dietary restrictions (Hindu vegetarian, Jain, Buddhist) through semantic analysis of ingredients and preparation methods

### Requirement 5

**User Story:** As a developer, I want to implement hybrid search combining exact UPC lookup with vector similarity so that the system supports both fast barcode scanning and intelligent product discovery with AI-powered insights.

#### Acceptance Criteria

1. WHEN hybrid search is implemented THEN the system SHALL combine exact `code` field matching with vector similarity search for comprehensive product discovery using MongoDB compound queries
2. WHEN UPC lookup is optimized THEN the system SHALL retrieve products by barcode in under 100ms using indexed exact match while maintaining vector search capabilities for related products
3. WHEN semantic queries are processed THEN the system SHALL support natural language queries like "nut-free cookies similar to Oreos" using vector search with text-to-embedding conversion
4. WHEN AI-powered analysis is performed THEN the system SHALL provide intelligent dietary insights using RAG (Retrieval-Augmented Generation) with vector search results as context
5. WHEN performance is measured THEN the system SHALL ensure vector operations execute in under 500ms and don't impact real-time barcode scanning performance of sub-100ms

## MongoDB Atlas Vector Search Integration

### Vector Search Capabilities:
- **Semantic Product Matching**: Find similar products by ingredient composition
- **Intelligent Allergen Detection**: Identify hidden allergens through ingredient similarity
- **AI-Powered Recommendations**: Suggest safer alternatives using vector similarity
- **Natural Language Queries**: Support queries like "gluten-free bread alternatives"
- **Cross-Contamination Analysis**: Detect manufacturing similarity risks

### Vector Embedding Strategy:
```javascript
// Product schema with vector fields
{
  code: "1234567890123",           // UPC for exact lookup
  product_name: "Chocolate Chip Cookies",
  ingredients_text: "flour, sugar, chocolate chips...",
  allergens_tags: ["en:gluten", "en:milk"],
  
  // Vector embeddings for AI-powered search
  ingredients_embedding: [0.1, 0.2, ...],      // 1536-dim OpenAI embedding
  product_name_embedding: [0.3, 0.4, ...],     // Product name semantic vector
  allergens_embedding: [0.5, 0.6, ...],        // Allergen profile vector
  
  // Derived compliance flags
  dietary_flags: {
    vegan: false,
    vegetarian: true,
    gluten_free: false,
    kosher: true,
    halal: true
  }
}
```

### Vector Search Indexes:
```javascript
// MongoDB Atlas Vector Search index configuration
{
  "fields": [
    {
      "type": "vector",
      "path": "ingredients_embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "vector", 
      "path": "product_name_embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "vector",
      "path": "allergens_embedding", 
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

### Use Cases Enhanced by Vector Search:
1. **Smart Product Discovery**: "Find dairy-free chocolate alternatives"
2. **Ingredient Risk Analysis**: Detect allergen risks in ingredient derivatives
3. **Manufacturing Cross-Contamination**: Find products made in similar facilities
4. **Personalized Recommendations**: AI-powered product suggestions
5. **Natural Language Queries**: Conversational product search
6. **Confidence Scoring**: Vector similarity scores for allergen detection reliability

## OpenFoodFacts Data Integration Notes

### Available Data Fields:
- **UPC/Barcode**: `code` field contains UPC codes (confirmed present in dump)
- **Product Info**: `product_name`, `brands_tags`, `categories_tags`
- **Allergens**: `allergens_tags`, `allergens_hierarchy`, `traces_tags`
- **Ingredients**: `ingredients_text`, `ingredients_tags`, `ingredients_analysis_tags`
- **Dietary**: `labels_tags` (organic, vegan, kosher, halal, gluten-free)
- **Nutrition**: `nutrition_grades_tags`, `additives_tags`, nutrition data
- **Quality**: `data_quality_*_tags`, popularity metrics

### Database Size:
- **Compressed**: ~12GB (openfoodfacts-mongodbdump.gz)
- **Uncompressed**: ~69GB (openfoodfacts-mongodbdump)
- **Collection**: `products` in `off` database
- **Records**: Millions of real products with UPC codes
