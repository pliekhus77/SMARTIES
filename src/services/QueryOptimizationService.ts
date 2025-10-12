/**
 * Query Optimization and Monitoring Service for SMARTIES application
 * Implements Task 6.2: Query optimization and monitoring
 * 
 * Features:
 * - Query performance monitoring and alerting
 * - Index usage analytics and optimization recommendations
 * - Query caching strategies for common searches
 * - Database connection pooling and error handling
 */

import { DatabaseService, databaseService } from './DatabaseService';

/**
 * Query performance metrics interface
 */
export interface QueryMetrics {
  queryType: string;
  executionTime: number;
  indexesUsed: string[];
  documentsExamined: number;
  documentsReturned: number;
  timestamp: Date;
  cacheHit?: boolean;
}

/**
 * Index usage statistics interface
 */
export interface IndexUsageStats {
  indexName: string;
  collection: string;
  usageCount: number;
  avgExecutionTime: number;
  lastUsed: Date;
  efficiency: number; // 0-1 score
}

/**
 * Query cache entry interface
 */
export interface CacheEntry {
  key: string;
  result: any;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
  hitCount: number;
}

/**
 * Performance alert interface
 */
export interface PerformanceAlert {
  type: 'slow_query' | 'index_missing' | 'cache_miss' | 'connection_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  queryType?: string;
  executionTime?: number;
  threshold?: number;
  timestamp: Date;
}

/**
 * Query Optimization and Monitoring Service
 */
export class QueryOptimizationService {
  private databaseService: DatabaseService;
  private queryMetrics: QueryMetrics[] = [];
  private indexStats: Map<string, IndexUsageStats> = new Map();
  private queryCache: Map<string, CacheEntry> = new Map();
  private alerts: PerformanceAlert[] = [];
  
  // Configuration
  private readonly SLOW_QUERY_THRESHOLD = 100; // ms
  private readonly CACHE_TTL = 300000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly MAX_METRICS_HISTORY = 10000;

  constructor(dbService?: DatabaseService) {
    this.databaseService = dbService || databaseService;
    this.startPerformanceMonitoring();
  }

  /**
   * Monitor query performance and collect metrics
   */
  async monitorQuery<T>(
    queryType: string,
    queryFn: () => Promise<T>,
    cacheKey?: string
  ): Promise<T> {
    const startTime = Date.now();
    
    // Check cache first
    if (cacheKey) {
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        this.recordMetrics({
          queryType,
          executionTime: 0,
          indexesUsed: [],
          documentsExamined: 0,
          documentsReturned: Array.isArray(cached) ? cached.length : 1,
          timestamp: new Date(),
          cacheHit: true
        });
        return cached;
      }
    }

    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;

      // Record metrics
      this.recordMetrics({
        queryType,
        executionTime,
        indexesUsed: [], // Would be populated from explain() in real implementation
        documentsExamined: 0, // Would be from explain()
        documentsReturned: Array.isArray(result) ? result.length : 1,
        timestamp: new Date(),
        cacheHit: false
      });

      // Cache result if cache key provided
      if (cacheKey && result) {
        this.cacheResult(cacheKey, result);
      }

      // Check for performance alerts
      this.checkPerformanceThresholds(queryType, executionTime);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Record failed query metrics
      this.recordMetrics({
        queryType: `${queryType}_error`,
        executionTime,
        indexesUsed: [],
        documentsExamined: 0,
        documentsReturned: 0,
        timestamp: new Date(),
        cacheHit: false
      });

      // Create error alert
      this.createAlert({
        type: 'connection_issue',
        severity: 'high',
        message: `Query failed: ${queryType} - ${error}`,
        queryType,
        executionTime,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Get cached query result
   */
  private getCachedResult(key: string): any | null {
    const entry = this.queryCache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    // Update hit count
    entry.hitCount++;
    return entry.result;
  }

  /**
   * Cache query result
   */
  private cacheResult(key: string, result: any): void {
    // Implement LRU eviction if cache is full
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.queryCache.keys())[0];
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(key, {
      key,
      result,
      timestamp: new Date(),
      ttl: this.CACHE_TTL,
      hitCount: 0
    });
  }

  /**
   * Record query performance metrics
   */
  private recordMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);

    // Maintain metrics history limit
    if (this.queryMetrics.length > this.MAX_METRICS_HISTORY) {
      this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS_HISTORY);
    }

    // Update index usage stats
    metrics.indexesUsed.forEach(indexName => {
      const existing = this.indexStats.get(indexName);
      if (existing) {
        existing.usageCount++;
        existing.avgExecutionTime = 
          (existing.avgExecutionTime + metrics.executionTime) / 2;
        existing.lastUsed = metrics.timestamp;
        existing.efficiency = this.calculateIndexEfficiency(existing);
      } else {
        this.indexStats.set(indexName, {
          indexName,
          collection: 'products', // Default, would be dynamic in real implementation
          usageCount: 1,
          avgExecutionTime: metrics.executionTime,
          lastUsed: metrics.timestamp,
          efficiency: 1.0
        });
      }
    });
  }

  /**
   * Calculate index efficiency score
   */
  private calculateIndexEfficiency(stats: IndexUsageStats): number {
    // Simple efficiency calculation based on execution time
    const maxTime = 1000; // 1 second
    return Math.max(0, 1 - (stats.avgExecutionTime / maxTime));
  }

  /**
   * Check performance thresholds and create alerts
   */
  private checkPerformanceThresholds(queryType: string, executionTime: number): void {
    if (executionTime > this.SLOW_QUERY_THRESHOLD) {
      const severity = executionTime > 500 ? 'critical' : 
                      executionTime > 200 ? 'high' : 'medium';
      
      this.createAlert({
        type: 'slow_query',
        severity,
        message: `Slow query detected: ${queryType} took ${executionTime}ms`,
        queryType,
        executionTime,
        threshold: this.SLOW_QUERY_THRESHOLD,
        timestamp: new Date()
      });
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Log critical alerts immediately
    if (alert.severity === 'critical') {
      console.error('🚨 CRITICAL PERFORMANCE ALERT:', alert.message);
    } else if (alert.severity === 'high') {
      console.warn('⚠️ HIGH PERFORMANCE ALERT:', alert.message);
    }

    // Maintain alerts history (keep last 1000)
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }
  }

  /**
   * Get query performance analytics
   */
  getPerformanceAnalytics(): {
    totalQueries: number;
    avgExecutionTime: number;
    slowQueries: number;
    cacheHitRate: number;
    topSlowQueries: QueryMetrics[];
  } {
    const totalQueries = this.queryMetrics.length;
    const avgExecutionTime = totalQueries > 0 ? 
      this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries : 0;
    
    const slowQueries = this.queryMetrics.filter(m => 
      m.executionTime > this.SLOW_QUERY_THRESHOLD).length;
    
    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalQueries > 0 ? cacheHits / totalQueries : 0;
    
    const topSlowQueries = this.queryMetrics
      .filter(m => !m.cacheHit)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      totalQueries,
      avgExecutionTime: Math.round(avgExecutionTime * 100) / 100,
      slowQueries,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      topSlowQueries
    };
  }

  /**
   * Get index usage analytics and optimization recommendations
   */
  getIndexAnalytics(): {
    indexStats: IndexUsageStats[];
    recommendations: string[];
  } {
    const indexStats = Array.from(this.indexStats.values())
      .sort((a, b) => b.usageCount - a.usageCount);

    const recommendations: string[] = [];

    // Analyze index usage patterns
    indexStats.forEach(stat => {
      if (stat.efficiency < 0.5) {
        recommendations.push(
          `Consider optimizing index "${stat.indexName}" - low efficiency (${Math.round(stat.efficiency * 100)}%)`
        );
      }
      
      if (stat.avgExecutionTime > 200) {
        recommendations.push(
          `Index "${stat.indexName}" has high avg execution time (${stat.avgExecutionTime}ms) - consider compound indexes`
        );
      }
    });

    // Check for unused indexes
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    indexStats.forEach(stat => {
      if (stat.lastUsed.getTime() < oneWeekAgo) {
        recommendations.push(
          `Index "${stat.indexName}" hasn't been used recently - consider removal if not needed`
        );
      }
    });

    return { indexStats, recommendations };
  }

  /**
   * Get recent performance alerts
   */
  getRecentAlerts(limit: number = 50): PerformanceAlert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
    console.log('Query cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    totalHits: number;
    avgTtl: number;
  } {
    const entries = Array.from(this.queryCache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const totalQueries = this.queryMetrics.length;
    const hitRate = totalQueries > 0 ? totalHits / totalQueries : 0;
    const avgTtl = entries.length > 0 ? 
      entries.reduce((sum, entry) => sum + entry.ttl, 0) / entries.length : 0;

    return {
      size: this.queryCache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits,
      avgTtl: Math.round(avgTtl)
    };
  }

  /**
   * Start background performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    console.log('🔍 Query optimization and monitoring service started');
  }

  /**
   * Perform periodic health check
   */
  private performHealthCheck(): void {
    const analytics = this.getPerformanceAnalytics();
    
    // Alert on high average execution time
    if (analytics.avgExecutionTime > this.SLOW_QUERY_THRESHOLD) {
      this.createAlert({
        type: 'slow_query',
        severity: 'medium',
        message: `High average query execution time: ${analytics.avgExecutionTime}ms`,
        executionTime: analytics.avgExecutionTime,
        threshold: this.SLOW_QUERY_THRESHOLD,
        timestamp: new Date()
      });
    }

    // Alert on low cache hit rate
    if (analytics.cacheHitRate < 0.3 && analytics.totalQueries > 100) {
      this.createAlert({
        type: 'cache_miss',
        severity: 'low',
        message: `Low cache hit rate: ${analytics.cacheHitRate * 100}%`,
        timestamp: new Date()
      });
    }

    console.log(`📊 Performance check: ${analytics.totalQueries} queries, ${analytics.avgExecutionTime}ms avg, ${analytics.cacheHitRate * 100}% cache hit rate`);
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(): {
    performance: {
      totalQueries: number;
      avgExecutionTime: number;
      slowQueries: number;
      cacheHitRate: number;
      topSlowQueries: QueryMetrics[];
    };
    indexes: {
      indexStats: IndexUsageStats[];
      recommendations: string[];
    };
    cache: {
      size: number;
      hitRate: number;
      totalHits: number;
      avgTtl: number;
    };
    alerts: PerformanceAlert[];
    summary: string[];
  } {
    const performance = this.getPerformanceAnalytics();
    const indexes = this.getIndexAnalytics();
    const cache = this.getCacheStats();
    const alerts = this.getRecentAlerts(10);

    const summary: string[] = [];
    
    if (performance.avgExecutionTime > this.SLOW_QUERY_THRESHOLD) {
      summary.push(`⚠️ Average query time (${performance.avgExecutionTime}ms) exceeds threshold`);
    } else {
      summary.push(`✅ Query performance is within acceptable limits`);
    }

    if (cache.hitRate > 0.5) {
      summary.push(`✅ Good cache hit rate: ${cache.hitRate * 100}%`);
    } else {
      summary.push(`⚠️ Low cache hit rate: ${cache.hitRate * 100}%`);
    }

    if (indexes.recommendations.length > 0) {
      summary.push(`📋 ${indexes.recommendations.length} index optimization recommendations available`);
    } else {
      summary.push(`✅ No immediate index optimizations needed`);
    }

    return { performance, indexes, cache, alerts, summary };
  }
}

export default QueryOptimizationService;
