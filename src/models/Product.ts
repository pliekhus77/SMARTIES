/**
 * MongoDB Product Model with Vector Search Support
 * Implements Requirements 1.1, 1.2, and 1.5 from data schema specification
 * 
 * Features:
 * - 384-dimension vector embeddings for semantic search
 * - Optimized indexes for UPC lookup and vector similarity
 * - Dietary compliance flags derived from OpenFoodFacts data
 * - Storage optimization for MongoDB Atlas M0 (512MB limit)
 */

import { Product, CreateProductInput, UpdateProductInput } from '../types/Product';

/**
 * MongoDB collection name for products
 */
export const PRODUCTS_COLLECTION = 'products';

/**
 * MongoDB schema definition for Product collection
 * Optimized for MongoDB Atlas M0 with Vector Search capabilities
 */
export const ProductSchema = {
  // Core identification fields with indexes
  code: { type: 'string', required: true, index: true }, // UPC/barcode - primary lookup
  product_name: { type: 'string', required: true, index: 'text' }, // Text search
  brands_tags: { type: 'array', items: { type: 'string' } },
  categories_tags: { type: 'array', items: { type: 'string' } },
  
  // Ingredient and allergen information
  ingredients_text: { type: 'string', required: true, index: 'text' },
  ingredients_tags: { type: 'array', items: { type: 'string' } },
  ingredients_analysis_tags: { type: 'array', items: { type: 'string' } },
  allergens_tags: { type: 'array', items: { type: 'string' }, index: true },
  allergens_hierarchy: { type: 'array', items: { type: 'string' } },
  traces_tags: { type: 'array', items: { type: 'string' } },
  
  // Certification and dietary labels
  labels_tags: { type: 'array', items: { type: 'string' }, index: true },
  
  // Vector embeddings for AI-powered search (384 dimensions each)
  ingredients_embedding: { 
    type: 'array', 
    items: { type: 'number' },
    minItems: 384,
    maxItems: 384,
    vectorSearch: true
  },
  product_name_embedding: { 
    type: 'array', 
    items: { type: 'number' },
    minItems: 384,
    maxItems: 384,
    vectorSearch: true
  },
  allergens_embedding: { 
    type: 'array', 
    items: { type: 'number' },
    minItems: 384,
    maxItems: 384,
    vectorSearch: true
  },
  
  // Derived dietary compliance flags (indexed for filtering)
  dietary_flags: {
    type: 'object',
    properties: {
      vegan: { type: 'boolean', index: true },
      vegetarian: { type: 'boolean', index: true },
      gluten_free: { type: 'boolean', index: true },
      kosher: { type: 'boolean', index: true },
      halal: { type: 'boolean', index: true },
      organic: { type: 'boolean' }
    },
    required: ['vegan', 'vegetarian', 'gluten_free', 'kosher', 'halal']
  },
  
  // Data quality and metadata (indexed for ranking)
  data_quality_score: { type: 'number', min: 0.0, max: 1.0, required: true, index: true },
  popularity_score: { type: 'number', min: 0.0, index: true },
  completeness_score: { type: 'number', min: 0.0, max: 1.0 },
  last_updated: { type: 'date', required: true, index: true },
  source: { type: 'string', enum: ['manual', 'openfoodfacts', 'usda'], required: true },
  
  // Optional fields
  nutritionalInfo: {
    type: 'object',
    properties: {
      calories: { type: 'number', min: 0 },
      sodium: { type: 'number', min: 0 },
      sugar: { type: 'number', min: 0 }
    }
  },
  imageUrl: { type: 'string', maxLength: 500 }
};

/**
 * MongoDB indexes for optimal query performance
 * Implements Requirements 1.3 and 5.2 for sub-100ms UPC lookup
 */
export const ProductIndexes = [
  // Primary UPC lookup index (most important for barcode scanning)
  { key: { code: 1 }, name: 'code_1', unique: true },
  
  // Compound index for hybrid search optimization
  { 
    key: { code: 1, popularity_score: -1, data_quality_score: -1 }, 
    name: 'hybrid_search_1' 
  },
  
  // Dietary filtering indexes
  { key: { 'dietary_flags.vegan': 1 }, name: 'dietary_vegan_1' },
  { key: { 'dietary_flags.vegetarian': 1 }, name: 'dietary_vegetarian_1' },
  { key: { 'dietary_flags.gluten_free': 1 }, name: 'dietary_gluten_free_1' },
  { key: { 'dietary_flags.kosher': 1 }, name: 'dietary_kosher_1' },
  { key: { 'dietary_flags.halal': 1 }, name: 'dietary_halal_1' },
  
  // Allergen filtering index
  { key: { allergens_tags: 1 }, name: 'allergens_tags_1' },
  
  // Quality and popularity ranking
  { key: { data_quality_score: -1, popularity_score: -1 }, name: 'quality_ranking_1' },
  
  // Source and update tracking
  { key: { source: 1, last_updated: -1 }, name: 'source_updated_1' },
  
  // Text search index for fallback queries
  { 
    key: { 
      product_name: 'text', 
      ingredients_text: 'text',
      brands_tags: 'text'
    }, 
    name: 'text_search_1',
    weights: {
      product_name: 10,
      brands_tags: 5,
      ingredients_text: 1
    }
  }
];

/**
 * MongoDB Atlas Vector Search index configurations
 * Implements Requirements 1.2 and 2.3 for semantic similarity search
 */
export const VectorSearchIndexes = [
  // Ingredients vector search index
  {
    name: 'ingredients_vector_index',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'ingredients_embedding',
          numDimensions: 384,
          similarity: 'cosine'
        },
        {
          type: 'filter',
          path: 'dietary_flags'
        },
        {
          type: 'filter',
          path: 'allergens_tags'
        },
        {
          type: 'filter',
          path: 'data_quality_score'
        }
      ]
    }
  },
  
  // Product name vector search index
  {
    name: 'product_name_vector_index',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'product_name_embedding',
          numDimensions: 384,
          similarity: 'cosine'
        },
        {
          type: 'filter',
          path: 'dietary_flags'
        },
        {
          type: 'filter',
          path: 'categories_tags'
        }
      ]
    }
  },
  
  // Allergen profile vector search index
  {
    name: 'allergens_vector_index',
    definition: {
      fields: [
        {
          type: 'vector',
          path: 'allergens_embedding',
          numDimensions: 384,
          similarity: 'cosine'
        },
        {
          type: 'filter',
          path: 'allergens_tags'
        },
        {
          type: 'filter',
          path: 'traces_tags'
        }
      ]
    }
  }
];

/**
 * Product model utility functions
 */
export class ProductModel {
  /**
   * Transforms CreateProductInput to MongoDB document format
   * Handles legacy field mapping and sets default values
   */
  static transformCreateInput(input: CreateProductInput): Omit<Product, '_id'> {
    const now = new Date();
    
    // Handle legacy field mapping
    const code = input.code || input.upc;
    const product_name = input.product_name || input.name;
    const ingredients_text = input.ingredients_text || (input.ingredients ? input.ingredients.join(', ') : '');
    const allergens_tags = input.allergens_tags.length > 0 ? input.allergens_tags : (input.allergens || []);
    const data_quality_score = input.data_quality_score || input.confidence || 0.5;
    
    if (!code) {
      throw new Error('Product code (UPC) is required');
    }
    if (!product_name) {
      throw new Error('Product name is required');
    }
    if (!ingredients_text) {
      throw new Error('Ingredients text is required');
    }
    
    // Derive dietary flags if not provided
    const dietary_flags = input.dietary_flags || this.deriveDietaryFlags(
      input.ingredients_analysis_tags || [],
      input.labels_tags || []
    );
    
    return {
      code,
      product_name,
      brands_tags: input.brands_tags || [],
      categories_tags: input.categories_tags || [],
      ingredients_text,
      ingredients_tags: input.ingredients_tags || [],
      ingredients_analysis_tags: input.ingredients_analysis_tags || [],
      allergens_tags,
      allergens_hierarchy: input.allergens_hierarchy || [],
      traces_tags: input.traces_tags || [],
      labels_tags: input.labels_tags || [],
      
      // Vector embeddings will be generated separately
      ingredients_embedding: [],
      product_name_embedding: [],
      allergens_embedding: [],
      
      dietary_flags,
      data_quality_score,
      popularity_score: input.popularity_score || 0.0,
      completeness_score: input.completeness_score || this.calculateCompleteness(input),
      last_updated: now,
      source: input.source,
      
      nutritionalInfo: input.nutritionalInfo,
      imageUrl: input.imageUrl
    };
  }
  
  /**
   * Derives dietary flags from OpenFoodFacts analysis tags and labels
   */
  static deriveDietaryFlags(
    analysisTagsInput: string[] = [], 
    labelsTagsInput: string[] = []
  ): Product['dietary_flags'] {
    const analysisTags = analysisTagsInput.map(tag => tag.toLowerCase());
    const labelsTags = labelsTagsInput.map(tag => tag.toLowerCase());
    
    return {
      vegan: analysisTags.includes('en:vegan') || labelsTags.some(tag => tag.includes('vegan')),
      vegetarian: analysisTags.includes('en:vegetarian') || analysisTags.includes('en:vegan') || 
                 labelsTags.some(tag => tag.includes('vegetarian') || tag.includes('vegan')),
      gluten_free: analysisTags.includes('en:gluten-free') || 
                   labelsTags.some(tag => tag.includes('gluten-free') || tag.includes('sans-gluten')),
      kosher: labelsTags.some(tag => tag.includes('kosher') || tag.includes('kasher')),
      halal: labelsTags.some(tag => tag.includes('halal')),
      organic: labelsTags.some(tag => tag.includes('organic') || tag.includes('bio'))
    };
  }
  
  /**
   * Calculates data completeness score based on available fields
   */
  static calculateCompleteness(input: CreateProductInput): number {
    let score = 0;
    let maxScore = 10;
    
    // Required fields (already validated)
    score += 3; // code, product_name, ingredients_text
    
    // Optional but important fields
    if (input.brands_tags && input.brands_tags.length > 0) score += 1;
    if (input.categories_tags && input.categories_tags.length > 0) score += 1;
    if (input.ingredients_tags && input.ingredients_tags.length > 0) score += 1;
    if (input.allergens_tags && input.allergens_tags.length > 0) score += 1;
    if (input.labels_tags && input.labels_tags.length > 0) score += 1;
    if (input.nutritionalInfo) score += 1;
    if (input.imageUrl) score += 1;
    
    return Math.min(score / maxScore, 1.0);
  }
  
  /**
   * Validates that vector embeddings have correct dimensions
   */
  static validateVectorEmbeddings(product: Partial<Product>): string[] {
    const errors: string[] = [];
    
    if (product.ingredients_embedding) {
      if (product.ingredients_embedding.length !== 384) {
        errors.push(`ingredients_embedding must have exactly 384 dimensions, got ${product.ingredients_embedding.length}`);
      }
    }
    
    if (product.product_name_embedding) {
      if (product.product_name_embedding.length !== 384) {
        errors.push(`product_name_embedding must have exactly 384 dimensions, got ${product.product_name_embedding.length}`);
      }
    }
    
    if (product.allergens_embedding) {
      if (product.allergens_embedding.length !== 384) {
        errors.push(`allergens_embedding must have exactly 384 dimensions, got ${product.allergens_embedding.length}`);
      }
    }
    
    return errors;
  }
  
  /**
   * Creates a product document ready for MongoDB insertion
   * Note: Vector embeddings must be added separately via embedding service
   */
  static createDocument(input: CreateProductInput): Omit<Product, '_id' | 'ingredients_embedding' | 'product_name_embedding' | 'allergens_embedding'> {
    const transformed = this.transformCreateInput(input);
    
    // Remove empty vector embeddings - they will be added by embedding service
    const { ingredients_embedding, product_name_embedding, allergens_embedding, ...document } = transformed;
    
    return document;
  }
}

/**
 * Storage optimization utilities for MongoDB Atlas M0 (512MB limit)
 */
export class StorageOptimizer {
  /**
   * Estimates document size in bytes for storage planning
   */
  static estimateDocumentSize(product: Product): number {
    const jsonString = JSON.stringify(product);
    
    // Add overhead for MongoDB BSON format (~20% typical overhead)
    const bsonOverhead = jsonString.length * 0.2;
    
    // Vector embeddings are the largest component (384 * 3 * 8 bytes = ~9KB per product)
    const vectorSize = (product.ingredients_embedding.length + 
                       product.product_name_embedding.length + 
                       product.allergens_embedding.length) * 8; // 8 bytes per double
    
    return Math.ceil(jsonString.length + bsonOverhead + vectorSize);
  }
  
  /**
   * Calculates maximum products that can fit in MongoDB Atlas M0 (512MB)
   */
  static calculateMaxProducts(averageDocumentSize: number = 12000): number {
    const maxStorageBytes = 512 * 1024 * 1024; // 512MB
    const reservedSpace = maxStorageBytes * 0.1; // Reserve 10% for indexes and overhead
    const availableSpace = maxStorageBytes - reservedSpace;
    
    return Math.floor(availableSpace / averageDocumentSize);
  }
  
  /**
   * Suggests optimization strategies for storage efficiency
   */
  static getOptimizationSuggestions(): string[] {
    return [
      'Prioritize products with high popularity_score and data_quality_score',
      'Limit ingredients_text to essential information (max 500 characters)',
      'Use abbreviated brand and category tags',
      'Compress or omit imageUrl for products with low popularity',
      'Consider storing only top 10,000-15,000 most popular products',
      'Implement data archiving for products not scanned in 6+ months'
    ];
  }
}