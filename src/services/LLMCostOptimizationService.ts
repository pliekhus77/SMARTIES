/**
 * LLM Cost Optimization Service
 * Implements Requirements 9.3 from vector search specification
 */

export interface OptimizedPrompt {
  original: string;
  optimized: string;
  tokenReduction: number;
  compressionRatio: number;
}

export interface BatchRequest {
  id: string;
  prompt: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface CacheEntry {
  promptHash: string;
  response: string;
  tokens: number;
  timestamp: Date;
  hitCount: number;
}

export class LLMCostOptimizationService {
  private responseCache = new Map<string, CacheEntry>();
  private batchQueue: BatchRequest[] = [];
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly BATCH_SIZE = 5;

  /**
   * Optimize prompt to reduce token usage
   */
  optimizePrompt(prompt: string): OptimizedPrompt {
    const original = prompt;
    let optimized = prompt;

    // Remove redundant whitespace
    optimized = optimized.replace(/\s+/g, ' ').trim();

    // Compress common phrases
    const compressions = [
      { from: 'Please analyze the following', to: 'Analyze:' },
      { from: 'Based on the information provided', to: 'Given:' },
      { from: 'dietary restrictions and requirements', to: 'dietary needs' },
      { from: 'ingredients list includes', to: 'ingredients:' },
      { from: 'allergen information', to: 'allergens' },
      { from: 'nutritional information', to: 'nutrition' }
    ];

    for (const compression of compressions) {
      optimized = optimized.replace(new RegExp(compression.from, 'gi'), compression.to);
    }

    // Use structured format for better parsing
    optimized = this.structurePrompt(optimized);

    const tokenReduction = this.estimateTokens(original) - this.estimateTokens(optimized);
    const compressionRatio = this.estimateTokens(optimized) / this.estimateTokens(original);

    return {
      original,
      optimized,
      tokenReduction,
      compressionRatio
    };
  }

  /**
   * Check cache for existing response
   */
  getCachedResponse(prompt: string): string | null {
    const hash = this.hashPrompt(prompt);
    const entry = this.responseCache.get(hash);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp.getTime() > this.CACHE_TTL) {
      this.responseCache.delete(hash);
      return null;
    }

    // Update hit count
    entry.hitCount++;
    return entry.response;
  }

  /**
   * Cache response for future use
   */
  cacheResponse(prompt: string, response: string, tokens: number): void {
    const hash = this.hashPrompt(prompt);
    
    const entry: CacheEntry = {
      promptHash: hash,
      response,
      tokens,
      timestamp: new Date(),
      hitCount: 0
    };

    this.responseCache.set(hash, entry);

    // Cleanup old entries if cache is too large
    if (this.responseCache.size > 1000) {
      this.cleanupCache();
    }
  }

  /**
   * Add request to batch processing queue
   */
  addToBatch(request: BatchRequest): void {
    this.batchQueue.push(request);
    
    // Process batch if it's full or has high priority items
    if (this.shouldProcessBatch()) {
      this.processBatch();
    }
  }

  /**
   * Process batch of requests
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    // Sort by priority
    this.batchQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const batch = this.batchQueue.splice(0, this.BATCH_SIZE);
    
    // Combine prompts for batch processing
    const combinedPrompt = this.combineBatchPrompts(batch);
    
    console.log(`Processing batch of ${batch.length} requests`);
    // Actual batch processing would happen here
  }

  /**
   * Combine multiple prompts for batch processing
   */
  private combineBatchPrompts(requests: BatchRequest[]): string {
    const header = 'Analyze the following products for dietary compliance:\n\n';
    const prompts = requests.map((req, index) => 
      `Product ${index + 1}:\n${req.prompt}\n`
    ).join('\n');
    
    return header + prompts + '\nProvide analysis for each product in JSON array format.';
  }

  /**
   * Determine if batch should be processed
   */
  private shouldProcessBatch(): boolean {
    if (this.batchQueue.length >= this.BATCH_SIZE) return true;
    
    // Process if there are high priority items waiting too long
    const highPriorityOld = this.batchQueue.find(req => 
      req.priority === 'high' && 
      Date.now() - req.timestamp.getTime() > 5000 // 5 seconds
    );
    
    return !!highPriorityOld;
  }

  /**
   * Structure prompt for better LLM parsing
   */
  private structurePrompt(prompt: string): string {
    // Convert to structured format
    const sections = [
      'PRODUCT:',
      'USER_RESTRICTIONS:',
      'ANALYSIS_REQUIRED:',
      'OUTPUT_FORMAT:'
    ];

    let structured = prompt;
    
    // Add clear section headers if not present
    if (!sections.some(section => structured.includes(section))) {
      structured = `ANALYSIS_REQUEST:\n${structured}\n\nOUTPUT_FORMAT: JSON with safetyLevel, violations, explanation`;
    }

    return structured;
  }

  /**
   * Estimate token count for prompt
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Hash prompt for caching
   */
  private hashPrompt(prompt: string): string {
    // Simple hash function for demonstration
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const entries = Array.from(this.responseCache.entries());
    
    // Sort by hit count and age
    entries.sort((a, b) => {
      const ageA = now - a[1].timestamp.getTime();
      const ageB = now - b[1].timestamp.getTime();
      const scoreA = a[1].hitCount - (ageA / 3600000); // Reduce score by age in hours
      const scoreB = b[1].hitCount - (ageB / 3600000);
      return scoreB - scoreA;
    });

    // Keep top 500 entries
    this.responseCache.clear();
    for (const [key, value] of entries.slice(0, 500)) {
      this.responseCache.set(key, value);
    }
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    cacheSize: number;
    cacheHitRate: number;
    avgTokenSavings: number;
    batchQueueSize: number;
  } {
    const entries = Array.from(this.responseCache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const totalRequests = entries.length + totalHits;
    
    return {
      cacheSize: this.responseCache.size,
      cacheHitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      avgTokenSavings: 150, // Placeholder - would calculate actual savings
      batchQueueSize: this.batchQueue.length
    };
  }
}
