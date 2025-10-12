/**
 * Hugging Face Embedding Service Implementation for SMARTIES
 * Provides vector embedding generation using Sentence Transformers
 * Implements Requirements 2.1 and 2.5 from data schema specification
 */

import { spawn, ChildProcess } from 'child_process';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import {
  IEmbeddingService,
  EmbeddingRequest,
  EmbeddingResponse,
  EmbeddingType,
  ModelInfo,
  EmbeddingStats,
  EmbeddingCacheConfig,
  CacheEntry,
  BatchConfig,
  EmbeddingServiceError,
  HuggingFaceEmbeddingConfig,
  DEFAULT_EMBEDDING_CONFIG,
  validateEmbeddingText,
  validateEmbedding,
  validateBatchRequests
} from '../types/EmbeddingService';

/**
 * In-memory cache for embeddings with LRU eviction
 */
class EmbeddingCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder: string[] = [];
  private config: EmbeddingCacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: EmbeddingCacheConfig) {
    this.config = config;
    // Only start cleanup timer if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.startCleanupTimer();
    }
  }

  /**
   * Generate cache key from text and type
   */
  private generateKey(text: string, type: EmbeddingType): string {
    const textHash = createHash('sha256').update(text.trim().toLowerCase()).digest('hex');
    return `${type}:${textHash}`;
  }

  /**
   * Get embedding from cache
   */
  get(text: string, type: EmbeddingType): number[] | null {
    const key = this.generateKey(text, type);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    const ageHours = (Date.now() - entry.created_at.getTime()) / (1000 * 60 * 60);
    if (ageHours > this.config.ttl_hours) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    // Update access tracking
    entry.access_count++;
    entry.last_accessed = new Date();
    this.updateAccessOrder(key);

    return entry.embedding;
  }

  /**
   * Store embedding in cache
   */
  set(text: string, type: EmbeddingType, embedding: number[]): void {
    const key = this.generateKey(text, type);
    const textHash = createHash('sha256').update(text.trim().toLowerCase()).digest('hex');

    // Evict if at capacity
    if (this.cache.size >= this.config.max_entries && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry = {
      embedding,
      text_hash: textHash,
      type,
      created_at: new Date(),
      access_count: 1,
      last_accessed: new Date()
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  /**
   * Clear cache entries by type
   */
  clear(type?: EmbeddingType): void {
    if (!type) {
      this.cache.clear();
      this.accessOrder = [];
      return;
    }

    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (entry.type === type) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    });
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hit_rate: number;
    memory_usage_mb: number;
    oldest_entry: Date | null;
  } {
    let oldestEntry: Date | null = null;
    let totalAccesses = 0;
    let totalHits = 0;

    for (const entry of this.cache.values()) {
      if (!oldestEntry || entry.created_at < oldestEntry) {
        oldestEntry = entry.created_at;
      }
      totalAccesses += entry.access_count;
      totalHits += entry.access_count - 1; // First access is not a hit
    }

    // Rough memory usage calculation (384 floats * 4 bytes + overhead)
    const memoryUsageMb = (this.cache.size * (384 * 4 + 200)) / (1024 * 1024);

    return {
      size: this.cache.size,
      hit_rate: totalAccesses > 0 ? totalHits / totalAccesses : 0,
      memory_usage_mb: memoryUsageMb,
      oldest_entry: oldestEntry
    };
  }

  /**
   * Update access order for LRU tracking
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order tracking
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.cache.delete(lruKey);
      this.accessOrder.shift();
    }
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanup_interval_minutes * 60 * 1000);
    
    // Unref the timer so it doesn't keep the process alive
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const ageHours = (now - entry.created_at.getTime()) / (1000 * 60 * 60);
      if (ageHours > this.config.ttl_hours) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    });

    if (expiredKeys.length > 0) {
      console.log(`EmbeddingCache: Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Shutdown cache and cleanup resources
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.cache.clear();
    this.accessOrder = [];
  }
}

/**
 * Hugging Face Embedding Service Implementation
 * Interfaces with Python embedding service for vector generation
 */
export class HuggingFaceEmbeddingService implements IEmbeddingService {
  private config: HuggingFaceEmbeddingConfig;
  private cache: EmbeddingCache;
  private isInitialized = false;
  private stats: EmbeddingStats;
  private pythonProcess?: ChildProcess;

  constructor(config?: Partial<HuggingFaceEmbeddingConfig>) {
    this.config = { ...DEFAULT_EMBEDDING_CONFIG, ...config };
    this.cache = new EmbeddingCache(this.config.cache_config);
    this.stats = {
      total_requests: 0,
      cache_hits: 0,
      cache_misses: 0,
      average_generation_time: 0,
      batch_processing_rate: 0,
      error_count: 0,
      last_updated: new Date()
    };
  }

  /**
   * Initialize the embedding service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Verify Python service script exists
      await fs.access(this.config.service_script_path);

      // Test Python service by getting model info
      await this.getModelInfo();

      this.isInitialized = true;
      console.log('HuggingFaceEmbeddingService: Initialized successfully');
    } catch (error) {
      throw new EmbeddingServiceError(
        'Failed to initialize embedding service',
        'model_load',
        error as Error
      );
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Generate ingredient embedding
   */
  async generateIngredientEmbedding(ingredientsText: string): Promise<number[]> {
    const validation = validateEmbeddingText(ingredientsText);
    if (!validation.isValid) {
      throw new EmbeddingServiceError(validation.error!, 'validation');
    }

    return this.generateSingleEmbedding(ingredientsText, 'ingredient');
  }

  /**
   * Generate product name embedding
   */
  async generateProductNameEmbedding(productName: string): Promise<number[]> {
    const validation = validateEmbeddingText(productName);
    if (!validation.isValid) {
      throw new EmbeddingServiceError(validation.error!, 'validation');
    }

    return this.generateSingleEmbedding(productName, 'product_name');
  }

  /**
   * Generate allergen embedding
   */
  async generateAllergenEmbedding(allergens: string | string[]): Promise<number[]> {
    const allergenText = Array.isArray(allergens) ? allergens.join(', ') : allergens;
    
    const validation = validateEmbeddingText(allergenText);
    if (!validation.isValid) {
      throw new EmbeddingServiceError(validation.error!, 'validation');
    }

    return this.generateSingleEmbedding(allergenText, 'allergen');
  }

  /**
   * Generate embeddings in batch
   */
  async generateEmbeddingsBatch(
    requests: EmbeddingRequest[],
    config?: Partial<BatchConfig>
  ): Promise<EmbeddingResponse[]> {
    const validation = validateBatchRequests(requests);
    if (!validation.isValid) {
      throw new EmbeddingServiceError(
        `Batch validation failed: ${validation.errors.join(', ')}`,
        'validation'
      );
    }

    const batchConfig: BatchConfig = {
      batch_size: this.config.batch_size,
      max_concurrent_batches: 3,
      timeout_seconds: this.config.timeout_seconds,
      retry_attempts: this.config.max_retries,
      ...config
    };

    const responses: EmbeddingResponse[] = [];
    const uncachedRequests: EmbeddingRequest[] = [];

    // Check cache first
    for (const request of requests) {
      const cachedEmbedding = this.cache.get(request.text, request.type);
      if (cachedEmbedding) {
        responses.push({
          id: request.id,
          embedding: cachedEmbedding,
          success: true,
          cached: true
        });
        this.stats.cache_hits++;
      } else {
        uncachedRequests.push(request);
        this.stats.cache_misses++;
      }
    }

    // Process uncached requests in batches
    if (uncachedRequests.length > 0) {
      const batchResponses = await this.processBatches(uncachedRequests, batchConfig);
      responses.push(...batchResponses);
    }

    this.stats.total_requests += requests.length;
    this.stats.last_updated = new Date();

    return responses.sort((a, b) => {
      const aIndex = requests.findIndex(r => r.id === a.id);
      const bIndex = requests.findIndex(r => r.id === b.id);
      return aIndex - bIndex;
    });
  }

  /**
   * Get model information
   */
  async getModelInfo(): Promise<ModelInfo> {
    try {
      const result = await this.executePythonCommand('get_model_info', {});
      return result as ModelInfo;
    } catch (error) {
      throw new EmbeddingServiceError(
        'Failed to get model info',
        'model_load',
        error as Error
      );
    }
  }

  /**
   * Get service statistics
   */
  getStats(): EmbeddingStats {
    return { ...this.stats };
  }

  /**
   * Clear cache
   */
  async clearCache(type?: EmbeddingType): Promise<void> {
    this.cache.clear(type);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hit_rate: number;
    memory_usage_mb: number;
    oldest_entry: Date | null;
  } {
    return this.cache.getStats();
  }

  /**
   * Shutdown service
   */
  async shutdown(): Promise<void> {
    this.cache.shutdown();
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = undefined;
    }
    this.isInitialized = false;
  }

  /**
   * Generate single embedding with caching
   */
  private async generateSingleEmbedding(text: string, type: EmbeddingType): Promise<number[]> {
    if (!this.isInitialized) {
      throw new EmbeddingServiceError('Service not initialized', 'model_load');
    }

    // Check cache first
    const cachedEmbedding = this.cache.get(text, type);
    if (cachedEmbedding) {
      this.stats.cache_hits++;
      this.stats.total_requests++;
      this.stats.last_updated = new Date();
      return cachedEmbedding;
    }

    this.stats.cache_misses++;

    const startTime = Date.now();
    try {
      const command = this.getEmbeddingCommand(type);
      const result = await this.executePythonCommand(command, { text });
      
      const embedding = result.embedding as number[];
      
      // Validate embedding
      const validation = validateEmbedding(embedding);
      if (!validation.isValid) {
        throw new EmbeddingServiceError(validation.error!, 'generation');
      }

      // Cache the result
      this.cache.set(text, type, embedding);

      // Update stats
      const generationTime = Date.now() - startTime;
      this.updateGenerationStats(generationTime);

      return embedding;
    } catch (error) {
      this.stats.error_count++;
      throw new EmbeddingServiceError(
        `Failed to generate ${type} embedding`,
        'generation',
        error as Error
      );
    }
  }

  /**
   * Process requests in batches
   */
  private async processBatches(
    requests: EmbeddingRequest[],
    config: BatchConfig
  ): Promise<EmbeddingResponse[]> {
    const responses: EmbeddingResponse[] = [];
    const batches: EmbeddingRequest[][] = [];

    // Split into batches
    for (let i = 0; i < requests.length; i += config.batch_size) {
      batches.push(requests.slice(i, i + config.batch_size));
    }

    // Process batches with concurrency limit
    const processBatch = async (batch: EmbeddingRequest[]): Promise<EmbeddingResponse[]> => {
      const startTime = Date.now();
      try {
        const texts = batch.map(r => r.text);
        const result = await this.executePythonCommand('generate_embeddings_batch', { texts });
        
        const embeddings = result.embeddings as number[][];
        const batchResponses: EmbeddingResponse[] = [];

        for (let i = 0; i < batch.length; i++) {
          const request = batch[i];
          const embedding = embeddings[i];

          if (embedding && embedding.length === 384) {
            // Cache the result
            this.cache.set(request.text, request.type, embedding);

            batchResponses.push({
              id: request.id,
              embedding,
              success: true,
              cached: false
            });
          } else {
            batchResponses.push({
              id: request.id,
              embedding: [],
              success: false,
              error: 'Invalid embedding generated',
              cached: false
            });
            this.stats.error_count++;
          }
        }

        // Update batch processing stats
        const processingTime = Date.now() - startTime;
        const rate = batch.length / (processingTime / 1000);
        this.stats.batch_processing_rate = 
          (this.stats.batch_processing_rate + rate) / 2; // Moving average

        return batchResponses;
      } catch (error) {
        // Return error responses for all requests in batch
        return batch.map(request => ({
          id: request.id,
          embedding: [],
          success: false,
          error: (error as Error).message,
          cached: false
        }));
      }
    };

    // Process batches with concurrency control
    const concurrentBatches: Promise<EmbeddingResponse[]>[] = [];
    for (let i = 0; i < batches.length; i += config.max_concurrent_batches) {
      const batchGroup = batches.slice(i, i + config.max_concurrent_batches);
      const batchPromises = batchGroup.map(processBatch);
      
      const batchResults = await Promise.all(batchPromises);
      responses.push(...batchResults.flat());

      // Report progress if callback provided
      if (config.progress_callback) {
        const processed = Math.min((i + config.max_concurrent_batches) * config.batch_size, requests.length);
        config.progress_callback(processed, requests.length);
      }
    }

    return responses;
  }

  /**
   * Get Python command for embedding type
   */
  private getEmbeddingCommand(type: EmbeddingType): string {
    switch (type) {
      case 'ingredient':
        return 'generate_ingredient_embedding';
      case 'product_name':
        return 'generate_product_name_embedding';
      case 'allergen':
        return 'generate_allergen_embedding';
      default:
        throw new EmbeddingServiceError(`Unknown embedding type: ${type}`, 'validation');
    }
  }

  /**
   * Execute Python command and get result
   */
  private async executePythonCommand(command: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonExecutable = this.config.python_executable || 'python';
      const scriptPath = path.resolve(this.config.service_script_path);
      
      const pythonProcess = spawn(pythonExecutable, [scriptPath, command, JSON.stringify(args)], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      const timeout = setTimeout(() => {
        pythonProcess.kill();
        reject(new EmbeddingServiceError('Python command timeout', 'timeout'));
      }, this.config.timeout_seconds * 1000);

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            reject(new EmbeddingServiceError(
              `Failed to parse Python response: ${stdout}`,
              'generation',
              error as Error
            ));
          }
        } else {
          reject(new EmbeddingServiceError(
            `Python process failed with code ${code}: ${stderr}`,
            'generation'
          ));
        }
      });

      pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(new EmbeddingServiceError(
          'Failed to start Python process',
          'model_load',
          error
        ));
      });
    });
  }

  /**
   * Update generation time statistics
   */
  private updateGenerationStats(generationTime: number): void {
    this.stats.total_requests++;
    
    // Update moving average
    const currentAvg = this.stats.average_generation_time;
    const totalRequests = this.stats.total_requests;
    this.stats.average_generation_time = 
      (currentAvg * (totalRequests - 1) + generationTime) / totalRequests;
    
    this.stats.last_updated = new Date();
  }
}

/**
 * Default embedding service instance
 * Can be imported and used directly
 */
export const embeddingService = new HuggingFaceEmbeddingService();

/**
 * Factory function to create embedding service with custom config
 */
export function createEmbeddingService(config?: Partial<HuggingFaceEmbeddingConfig>): IEmbeddingService {
  return new HuggingFaceEmbeddingService(config);
}