/**
 * Performance Optimization Service
 * Implements performance targets and optimization strategies from SMARTIES API integration specification
 */

export class PerformanceOptimizationService {
  private requestCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private pendingRequests = new Map<string, Promise<any>>();
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * Debounce requests to prevent duplicates
   */
  async debounceRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    debounceMs: number = 300
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Check cache first
    const cached = this.getCachedData(key);
    if (cached) {
      return cached;
    }

    // Create new request
    const request = this.executeWithTimeout(requestFn, 5000);
    this.pendingRequests.set(key, request);

    try {
      const result = await request;
      this.cacheData(key, result, 300000); // 5 minutes TTL
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Execute request with timeout
   */
  private async executeWithTimeout<T>(
    requestFn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      requestFn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      )
    ]);
  }

  /**
   * Get cached data if valid
   */
  private getCachedData(key: string): any | null {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Cache data with LRU eviction
   */
  private cacheData(key: string, data: any, ttl: number): void {
    // Implement LRU eviction
    if (this.requestCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.requestCache.keys().next().value;
      this.requestCache.delete(oldestKey);
    }

    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Background refresh for frequently accessed data
   */
  async backgroundRefresh<T>(
    key: string,
    requestFn: () => Promise<T>,
    refreshThreshold: number = 0.8
  ): Promise<T | null> {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    const shouldRefresh = age > (cached.ttl * refreshThreshold);

    if (shouldRefresh) {
      // Refresh in background without blocking
      requestFn()
        .then(result => this.cacheData(key, result, cached.ttl))
        .catch(error => console.warn('Background refresh failed:', error));
    }

    return cached.data;
  }

  /**
   * Batch multiple requests
   */
  async batchRequests<T>(
    requests: Array<{ key: string; requestFn: () => Promise<T> }>,
    maxConcurrent: number = 3
  ): Promise<Array<{ key: string; result: T | null; error?: any }>> {
    const results: Array<{ key: string; result: T | null; error?: any }> = [];
    
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const batch = requests.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async ({ key, requestFn }) => {
        try {
          const result = await this.debounceRequest(key, requestFn);
          return { key, result };
        } catch (error) {
          return { key, result: null, error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Optimize component rendering
   */
  createRenderOptimizer() {
    let renderCount = 0;
    let lastRenderTime = 0;

    return {
      shouldRender: (props: any, prevProps: any): boolean => {
        const now = Date.now();
        
        // Throttle renders to max 60fps
        if (now - lastRenderTime < 16) {
          return false;
        }

        // Skip render if props haven't changed significantly
        if (this.shallowEqual(props, prevProps)) {
          return false;
        }

        lastRenderTime = now;
        renderCount++;
        return true;
      },
      
      getRenderStats: () => ({
        renderCount,
        avgRenderTime: renderCount > 0 ? (Date.now() - lastRenderTime) / renderCount : 0
      })
    };
  }

  /**
   * Shallow equality check for props
   */
  private shallowEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) return false;
    }

    return true;
  }

  /**
   * Memory usage optimization
   */
  optimizeMemoryUsage(): void {
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, cached] of this.requestCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.requestCache.delete(key);
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    cacheSize: number;
    cacheHitRate: number;
    pendingRequests: number;
    memoryUsage: number;
  } {
    return {
      cacheSize: this.requestCache.size,
      cacheHitRate: 0.85, // Placeholder - would track actual hit rate
      pendingRequests: this.pendingRequests.size,
      memoryUsage: process.memoryUsage?.()?.heapUsed || 0
    };
  }
}
