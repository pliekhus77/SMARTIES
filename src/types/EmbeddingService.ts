/**
 * Embedding Service Types for SMARTIES Application
 * Defines interfaces for vector embedding generation using Hugging Face Transformers
 * Implements Requirements 2.1 and 2.5 from data schema specification
 */

/**
 * Embedding request for batch processing
 */
export interface EmbeddingRequest {
  id: string;                    // Unique identifier for the request
  text: string;                  // Text to embed
  type: EmbeddingType;          // Type of embedding to generate
}

/**
 * Embedding response from batch processing
 */
export interface EmbeddingResponse {
  id: string;                    // Matches request ID
  embedding: number[];           // Generated embedding vector (384 dimensions)
  success: boolean;              // Whether embedding generation succeeded
  error?: string;                // Error message if failed
  cached: boolean;               // Whether result was retrieved from cache
}

/**
 * Types of embeddings supported by the service
 */
export type EmbeddingType = 'ingredient' | 'product_name' | 'allergen';

/**
 * Model information and configuration
 */
export interface ModelInfo {
  model_name: string;            // Sentence transformer model name
  embedding_dimension: number;   // Vector dimension (384 for all-MiniLM-L6-v2)
  max_sequence_length: number;   // Maximum input text length
  cache_directory: string;       // Model cache location
  batch_size: number;           // Default batch processing size
  cpu_threads: number;          // CPU threads for processing
  is_loaded: boolean;           // Whether model is currently loaded
  actual_embedding_dim?: number; // Actual embedding dimension from loaded model
  actual_max_seq_length?: number; // Actual max sequence length from loaded model
}

/**
 * Embedding generation statistics
 */
export interface EmbeddingStats {
  total_requests: number;        // Total embedding requests processed
  cache_hits: number;           // Number of cache hits
  cache_misses: number;         // Number of cache misses
  average_generation_time: number; // Average time per embedding (ms)
  batch_processing_rate: number; // Items processed per second in batch
  error_count: number;          // Number of failed requests
  last_updated: Date;           // Last statistics update
}

/**
 * Cache configuration for embedding storage
 */
export interface EmbeddingCacheConfig {
  max_entries: number;          // Maximum number of cached embeddings
  ttl_hours: number;           // Time to live in hours
  cleanup_interval_minutes: number; // Cache cleanup frequency
  storage_path?: string;        // Optional persistent storage path
  memory_limit_mb: number;      // Memory limit for cache
}

/**
 * Embedding cache entry
 */
export interface CacheEntry {
  embedding: number[];          // Cached embedding vector
  text_hash: string;           // Hash of original text for validation
  type: EmbeddingType;         // Type of embedding
  created_at: Date;            // Cache entry creation time
  access_count: number;        // Number of times accessed
  last_accessed: Date;         // Last access timestamp
}

/**
 * Batch processing configuration
 */
export interface BatchConfig {
  batch_size: number;          // Number of items per batch
  max_concurrent_batches: number; // Maximum parallel batches
  timeout_seconds: number;     // Timeout for batch processing
  retry_attempts: number;      // Number of retry attempts for failed batches
  progress_callback?: (processed: number, total: number) => void; // Progress reporting
}

/**
 * Embedding service error types
 */
export class EmbeddingServiceError extends Error {
  constructor(
    message: string,
    public readonly errorType: 'model_load' | 'generation' | 'cache' | 'validation' | 'timeout',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'EmbeddingServiceError';
  }
}

/**
 * Main interface for the embedding service
 * Provides methods for generating embeddings with caching and batch processing
 */
export interface IEmbeddingService {
  /**
   * Initialize the embedding service and load the model
   * @returns Promise that resolves when service is ready
   */
  initialize(): Promise<void>;

  /**
   * Check if the service is initialized and ready
   * @returns True if service is ready for use
   */
  isReady(): boolean;

  /**
   * Generate embedding for ingredient text
   * @param ingredientsText Raw ingredient text from product
   * @returns Promise resolving to 384-dimension embedding vector
   */
  generateIngredientEmbedding(ingredientsText: string): Promise<number[]>;

  /**
   * Generate embedding for product name
   * @param productName Product name text
   * @returns Promise resolving to 384-dimension embedding vector
   */
  generateProductNameEmbedding(productName: string): Promise<number[]>;

  /**
   * Generate embedding for allergen information
   * @param allergens Allergen text or array of allergens
   * @returns Promise resolving to 384-dimension embedding vector
   */
  generateAllergenEmbedding(allergens: string | string[]): Promise<number[]>;

  /**
   * Generate embeddings for multiple requests efficiently
   * @param requests Array of embedding requests
   * @param config Optional batch processing configuration
   * @returns Promise resolving to array of embedding responses
   */
  generateEmbeddingsBatch(
    requests: EmbeddingRequest[],
    config?: Partial<BatchConfig>
  ): Promise<EmbeddingResponse[]>;

  /**
   * Get model information and configuration
   * @returns Model information object
   */
  getModelInfo(): Promise<ModelInfo>;

  /**
   * Get embedding generation statistics
   * @returns Statistics about service usage
   */
  getStats(): EmbeddingStats;

  /**
   * Clear embedding cache
   * @param type Optional embedding type to clear (clears all if not specified)
   * @returns Promise that resolves when cache is cleared
   */
  clearCache(type?: EmbeddingType): Promise<void>;

  /**
   * Get cache statistics
   * @returns Information about cache usage
   */
  getCacheStats(): {
    size: number;
    hit_rate: number;
    memory_usage_mb: number;
    oldest_entry: Date | null;
  };

  /**
   * Shutdown the service and cleanup resources
   * @returns Promise that resolves when cleanup is complete
   */
  shutdown(): Promise<void>;
}

/**
 * Configuration for the Hugging Face embedding service
 */
export interface HuggingFaceEmbeddingConfig {
  model_name: string;           // Sentence transformer model name
  cache_directory: string;      // Model cache directory
  batch_size: number;          // Default batch size
  cpu_threads: number;         // CPU threads for processing
  python_executable?: string;   // Path to Python executable
  service_script_path: string; // Path to Python embedding service script
  timeout_seconds: number;     // Request timeout
  max_retries: number;         // Maximum retry attempts
  cache_config: EmbeddingCacheConfig; // Cache configuration
}

/**
 * Default configuration values
 */
export const DEFAULT_EMBEDDING_CONFIG: HuggingFaceEmbeddingConfig = {
  model_name: 'all-MiniLM-L6-v2',
  cache_directory: './models_cache',
  batch_size: 32,
  cpu_threads: 4,
  service_script_path: './embedding_service_interface.py',
  timeout_seconds: 30,
  max_retries: 3,
  cache_config: {
    max_entries: 10000,
    ttl_hours: 24,
    cleanup_interval_minutes: 60,
    memory_limit_mb: 100
  }
};

/**
 * Validation functions for embedding service inputs
 */

/**
 * Validate text input for embedding generation
 * @param text Text to validate
 * @param maxLength Maximum allowed length
 * @returns Validation result
 */
export function validateEmbeddingText(text: string, maxLength: number = 256): {
  isValid: boolean;
  error?: string;
} {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Text must be a non-empty string' };
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return { isValid: false, error: 'Text cannot be empty after trimming' };
  }

  if (trimmedText.length > maxLength) {
    return { isValid: false, error: `Text length (${trimmedText.length}) exceeds maximum (${maxLength})` };
  }

  return { isValid: true };
}

/**
 * Validate embedding vector
 * @param embedding Embedding vector to validate
 * @param expectedDimension Expected vector dimension
 * @returns Validation result
 */
export function validateEmbedding(embedding: number[], expectedDimension: number = 384): {
  isValid: boolean;
  error?: string;
} {
  if (!Array.isArray(embedding)) {
    return { isValid: false, error: 'Embedding must be an array' };
  }

  if (embedding.length !== expectedDimension) {
    return { isValid: false, error: `Embedding dimension (${embedding.length}) does not match expected (${expectedDimension})` };
  }

  if (!embedding.every(val => typeof val === 'number' && !isNaN(val))) {
    return { isValid: false, error: 'Embedding must contain only valid numbers' };
  }

  return { isValid: true };
}

/**
 * Validate batch embedding requests
 * @param requests Array of embedding requests to validate
 * @returns Validation result
 */
export function validateBatchRequests(requests: EmbeddingRequest[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!Array.isArray(requests)) {
    return { isValid: false, errors: ['Requests must be an array'] };
  }

  if (requests.length === 0) {
    return { isValid: false, errors: ['Requests array cannot be empty'] };
  }

  const seenIds = new Set<string>();

  requests.forEach((request, index) => {
    if (!request.id || typeof request.id !== 'string') {
      errors.push(`Request ${index}: ID must be a non-empty string`);
    } else if (seenIds.has(request.id)) {
      errors.push(`Request ${index}: Duplicate ID '${request.id}'`);
    } else {
      seenIds.add(request.id);
    }

    const textValidation = validateEmbeddingText(request.text);
    if (!textValidation.isValid) {
      errors.push(`Request ${index}: ${textValidation.error}`);
    }

    if (!['ingredient', 'product_name', 'allergen'].includes(request.type)) {
      errors.push(`Request ${index}: Invalid embedding type '${request.type}'`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}