/**
 * Tests for QueryOptimizationService
 * Validates Task 6.2: Query optimization and monitoring functionality
 */

import { QueryOptimizationService } from '../QueryOptimizationService';

describe('QueryOptimizationService', () => {
  let service: QueryOptimizationService;

  beforeEach(() => {
    service = new QueryOptimizationService();
  });

  describe('Query Performance Monitoring', () => {
    test('should monitor query execution time', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ data: 'test' });
      
      const result = await service.monitorQuery('test_query', mockQuery);
      
      expect(result).toEqual({ data: 'test' });
      expect(mockQuery).toHaveBeenCalledTimes(1);
      
      const analytics = service.getPerformanceAnalytics();
      expect(analytics.totalQueries).toBe(1);
      expect(analytics.avgExecutionTime).toBeGreaterThanOrEqual(0);
    });

    test('should detect slow queries and create alerts', async () => {
      const slowQuery = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'slow' }), 150)
      );
      
      await service.monitorQuery('slow_query', slowQuery);
      
      const alerts = service.getRecentAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('slow_query');
      expect(alerts[0].queryType).toBe('slow_query');
    });

    test('should handle query errors and create alerts', async () => {
      const failingQuery = () => Promise.reject(new Error('Query failed'));
      
      await expect(service.monitorQuery('failing_query', failingQuery))
        .rejects.toThrow('Query failed');
      
      const alerts = service.getRecentAlerts();
      expect(alerts.some(alert => alert.type === 'connection_issue')).toBe(true);
    });
  });

  describe('Query Caching', () => {
    test('should cache query results', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ data: 'cached' });
      const cacheKey = 'test_cache_key';
      
      // First call - should execute query
      const result1 = await service.monitorQuery('cached_query', mockQuery, cacheKey);
      expect(result1).toEqual({ data: 'cached' });
      expect(mockQuery).toHaveBeenCalledTimes(1);
      
      // Second call - should use cache
      const result2 = await service.monitorQuery('cached_query', mockQuery, cacheKey);
      expect(result2).toEqual({ data: 'cached' });
      expect(mockQuery).toHaveBeenCalledTimes(1); // Not called again
      
      const analytics = service.getPerformanceAnalytics();
      expect(analytics.cacheHitRate).toBe(0.5); // 1 hit out of 2 queries
    });

    test('should provide cache statistics', async () => {
      const mockQuery = () => Promise.resolve({ data: 'test' });
      
      await service.monitorQuery('query1', mockQuery, 'key1');
      await service.monitorQuery('query2', mockQuery, 'key1'); // Cache hit
      
      const cacheStats = service.getCacheStats();
      expect(cacheStats.size).toBe(1);
      expect(cacheStats.totalHits).toBe(1);
      expect(cacheStats.hitRate).toBeGreaterThan(0);
    });

    test('should clear cache when requested', async () => {
      const mockQuery = () => Promise.resolve({ data: 'test' });
      
      await service.monitorQuery('query', mockQuery, 'key');
      expect(service.getCacheStats().size).toBe(1);
      
      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    });
  });

  describe('Performance Analytics', () => {
    test('should calculate performance metrics correctly', async () => {
      const fastQuery = () => Promise.resolve({ data: 'fast' });
      const slowQuery = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'slow' }), 150)
      );
      
      await service.monitorQuery('fast_query', fastQuery);
      await service.monitorQuery('slow_query', slowQuery);
      
      const analytics = service.getPerformanceAnalytics();
      expect(analytics.totalQueries).toBe(2);
      expect(analytics.slowQueries).toBe(1);
      expect(analytics.avgExecutionTime).toBeGreaterThan(0);
      expect(analytics.topSlowQueries.length).toBeGreaterThan(0);
    });

    test('should track query types and patterns', async () => {
      const mockQuery = () => Promise.resolve({ data: 'test' });
      
      await service.monitorQuery('upc_lookup', mockQuery);
      await service.monitorQuery('allergen_search', mockQuery);
      await service.monitorQuery('upc_lookup', mockQuery);
      
      const analytics = service.getPerformanceAnalytics();
      expect(analytics.totalQueries).toBe(3);
    });
  });

  describe('Index Analytics', () => {
    test('should provide index usage statistics', () => {
      const indexAnalytics = service.getIndexAnalytics();
      
      expect(indexAnalytics).toHaveProperty('indexStats');
      expect(indexAnalytics).toHaveProperty('recommendations');
      expect(Array.isArray(indexAnalytics.indexStats)).toBe(true);
      expect(Array.isArray(indexAnalytics.recommendations)).toBe(true);
    });
  });

  describe('Alert System', () => {
    test('should create and retrieve alerts', async () => {
      const slowQuery = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'slow' }), 200)
      );
      
      await service.monitorQuery('slow_query', slowQuery);
      
      const alerts = service.getRecentAlerts(10);
      expect(alerts.length).toBeGreaterThan(0);
      
      const slowQueryAlert = alerts.find(alert => alert.type === 'slow_query');
      expect(slowQueryAlert).toBeDefined();
      expect(slowQueryAlert?.severity).toBeDefined();
      expect(slowQueryAlert?.message).toContain('slow');
    });

    test('should limit alert history', async () => {
      // Create many alerts
      for (let i = 0; i < 5; i++) {
        const slowQuery = () => new Promise(resolve => 
          setTimeout(() => resolve({ data: 'slow' }), 150)
        );
        await service.monitorQuery(`slow_query_${i}`, slowQuery);
      }
      
      const alerts = service.getRecentAlerts(3);
      expect(alerts.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Optimization Report', () => {
    test('should generate comprehensive optimization report', async () => {
      const fastQuery = () => Promise.resolve({ data: 'fast' });
      const slowQuery = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'slow' }), 150)
      );
      
      await service.monitorQuery('fast_query', fastQuery, 'cache_key');
      await service.monitorQuery('slow_query', slowQuery);
      await service.monitorQuery('cached_query', fastQuery, 'cache_key'); // Cache hit
      
      const report = service.generateOptimizationReport();
      
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('indexes');
      expect(report).toHaveProperty('cache');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('summary');
      
      expect(report.performance.totalQueries).toBe(3);
      expect(report.cache.hitRate).toBeGreaterThan(0);
      expect(Array.isArray(report.summary)).toBe(true);
      expect(report.summary.length).toBeGreaterThan(0);
    });

    test('should provide actionable recommendations', async () => {
      // Create scenario with poor performance
      const verySlowQuery = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'very_slow' }), 300)
      );
      
      await service.monitorQuery('very_slow_query', verySlowQuery);
      
      const report = service.generateOptimizationReport();
      
      expect(report.summary.some(item => 
        item.includes('exceeds threshold') || item.includes('performance')
      )).toBe(true);
    });
  });

  describe('Task 6.2 Requirements Validation', () => {
    test('should implement query performance monitoring and alerting', async () => {
      const slowQuery = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'monitored' }), 150)
      );
      
      await service.monitorQuery('monitored_query', slowQuery);
      
      // Verify monitoring
      const analytics = service.getPerformanceAnalytics();
      expect(analytics.totalQueries).toBeGreaterThan(0);
      
      // Verify alerting
      const alerts = service.getRecentAlerts();
      expect(alerts.length).toBeGreaterThan(0);
    });

    test('should create index usage analytics and optimization recommendations', () => {
      const indexAnalytics = service.getIndexAnalytics();
      
      expect(indexAnalytics.indexStats).toBeDefined();
      expect(indexAnalytics.recommendations).toBeDefined();
      expect(Array.isArray(indexAnalytics.recommendations)).toBe(true);
    });

    test('should implement query caching strategies for common searches', async () => {
      const commonQuery = () => Promise.resolve({ data: 'common' });
      const cacheKey = 'common_search';
      
      // First execution
      await service.monitorQuery('common_search', commonQuery, cacheKey);
      
      // Second execution should use cache
      const mockQuery = jest.fn().mockResolvedValue({ data: 'common' });
      await service.monitorQuery('common_search', mockQuery, cacheKey);
      
      expect(mockQuery).not.toHaveBeenCalled(); // Should use cache
      
      const cacheStats = service.getCacheStats();
      expect(cacheStats.size).toBeGreaterThan(0);
    });

    test('should provide database error handling', async () => {
      const errorQuery = () => Promise.reject(new Error('Database connection failed'));
      
      await expect(service.monitorQuery('error_query', errorQuery))
        .rejects.toThrow('Database connection failed');
      
      // Verify error was tracked
      const alerts = service.getRecentAlerts();
      expect(alerts.some(alert => alert.type === 'connection_issue')).toBe(true);
      
      const analytics = service.getPerformanceAnalytics();
      expect(analytics.totalQueries).toBeGreaterThan(0);
    });
  });
});
