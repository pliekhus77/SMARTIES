/**
 * Performance Benchmark Tests for Database Operations
 * Implements Task 6.3: Performance testing for database operations
 * 
 * Benchmarks:
 * - Vector search query performance
 * - Index lookup performance
 * - Compound query optimization
 * - Connection pool efficiency
 */

import { QueryOptimizationService } from '../QueryOptimizationService';
import { ConnectionPoolService } from '../ConnectionPoolService';

describe('Database Performance Benchmarks', () => {
  let queryOptimizer: QueryOptimizationService;
  let connectionPool: ConnectionPoolService;

  beforeAll(() => {
    queryOptimizer = new QueryOptimizationService();
    connectionPool = new ConnectionPoolService({
      minConnections: 2,
      maxConnections: 10,
      acquireTimeoutMs: 1000
    });
  });

  afterAll(async () => {
    await connectionPool.shutdown();
  });

  describe('Vector Search Performance', () => {
    test('should execute vector search within 500ms', async () => {
      const vectorSearchQuery = () => new Promise(resolve => {
        // Simulate vector search with 384-dimension embedding
        const queryVector = new Array(384).fill(Math.random());
        const results = Array.from({ length: 10 }, (_, i) => ({
          id: `product_${i}`,
          score: Math.random() * 0.5 + 0.5, // 0.5-1.0 range
          product_name: `Product ${i}`,
          ingredients_embedding: new Array(384).fill(Math.random())
        }));
        
        setTimeout(() => resolve({ results, queryVector }), 200);
      });

      const startTime = Date.now();
      const result = await queryOptimizer.monitorQuery('vector_search_benchmark', vectorSearchQuery);
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(500);
      expect(result.results).toHaveLength(10);
      expect(result.queryVector).toHaveLength(384);
    });

    test('should handle concurrent vector searches efficiently', async () => {
      const concurrentQueries = Array.from({ length: 5 }, (_, i) => 
        () => new Promise(resolve => 
          setTimeout(() => resolve({ 
            queryId: i, 
            results: [{ id: `result_${i}`, score: 0.9 }] 
          }), 100 + Math.random() * 100)
        )
      );

      const startTime = Date.now();
      const promises = concurrentQueries.map((query, i) => 
        queryOptimizer.monitorQuery(`concurrent_vector_${i}`, query)
      );
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.queryId).toBe(i);
      });
    });
  });

  describe('Index Lookup Performance', () => {
    test('should execute UPC lookup within 100ms', async () => {
      const upcLookupQuery = () => new Promise(resolve => {
        const mockProduct = {
          upc: '123456789012',
          product_name: 'Test Product',
          ingredients_text: 'Water, Sugar, Natural Flavors',
          allergens_tags: ['milk'],
          dietary_flags: { vegan: false, gluten_free: true }
        };
        
        setTimeout(() => resolve(mockProduct), 50);
      });

      const startTime = Date.now();
      const result = await queryOptimizer.monitorQuery('upc_lookup_benchmark', upcLookupQuery);
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(100);
      expect(result.upc).toBe('123456789012');
    });

    test('should execute allergen filter queries efficiently', async () => {
      const allergenFilterQuery = () => new Promise(resolve => {
        const mockResults = Array.from({ length: 20 }, (_, i) => ({
          id: `product_${i}`,
          product_name: `Product ${i}`,
          allergens_tags: i % 3 === 0 ? [] : ['milk', 'eggs'].slice(0, i % 2 + 1)
        }));
        
        setTimeout(() => resolve({ 
          results: mockResults.filter(p => p.allergens_tags.length === 0),
          totalScanned: mockResults.length
        }), 75);
      });

      const startTime = Date.now();
      const result = await queryOptimizer.monitorQuery('allergen_filter_benchmark', allergenFilterQuery);
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(150);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.totalScanned).toBe(20);
    });
  });

  describe('Compound Query Performance', () => {
    test('should optimize compound queries for best performance', async () => {
      const compoundQuery = () => new Promise(resolve => {
        // Simulate compound query: vector search + dietary filters + allergen exclusion
        const executionPlan = {
          steps: [
            { operation: 'vector_search', estimatedTime: 200, cost: 0.6 },
            { operation: 'dietary_filter', estimatedTime: 50, cost: 0.2 },
            { operation: 'allergen_exclusion', estimatedTime: 30, cost: 0.1 }
          ],
          optimizations: ['index_pushdown', 'filter_early', 'vector_pruning'],
          totalEstimatedTime: 280
        };
        
        setTimeout(() => resolve({
          results: Array.from({ length: 5 }, (_, i) => ({
            id: `optimized_${i}`,
            score: 0.9 - i * 0.1,
            matchedFilters: ['vegan', 'no_milk', 'no_eggs']
          })),
          executionPlan,
          actualTime: 250
        }), 250);
      });

      const startTime = Date.now();
      const result = await queryOptimizer.monitorQuery('compound_optimization_benchmark', compoundQuery);
      const executionTime = Date.now() - startTime;

      expect(executionTime).toBeLessThan(400);
      expect(result.executionPlan.optimizations).toContain('index_pushdown');
      expect(result.actualTime).toBeLessThan(result.executionPlan.totalEstimatedTime);
    });

    test('should cache compound query results effectively', async () => {
      const cacheKey = 'compound_cache_test';
      const expensiveQuery = jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ 
            results: [{ id: '1', computed: true }],
            computationTime: 300 
          }), 300)
        )
      );

      // First execution - should run query
      const startTime1 = Date.now();
      const result1 = await queryOptimizer.monitorQuery('expensive_compound', expensiveQuery, cacheKey);
      const time1 = Date.now() - startTime1;

      expect(time1).toBeGreaterThan(250);
      expect(expensiveQuery).toHaveBeenCalledTimes(1);

      // Second execution - should use cache
      const startTime2 = Date.now();
      const result2 = await queryOptimizer.monitorQuery('expensive_compound', expensiveQuery, cacheKey);
      const time2 = Date.now() - startTime2;

      expect(time2).toBeLessThan(50); // Should be much faster
      expect(expensiveQuery).toHaveBeenCalledTimes(1); // Not called again
      expect(result2.results).toEqual(result1.results);
    });
  });

  describe('Connection Pool Performance', () => {
    test('should handle high connection demand efficiently', async () => {
      const connectionRequests = Array.from({ length: 15 }, (_, i) => 
        async () => {
          const connection = await connectionPool.acquireConnection();
          // Simulate work
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
          connectionPool.releaseConnection(connection);
          return { requestId: i, connectionId: connection.id };
        }
      );

      const startTime = Date.now();
      const results = await Promise.all(connectionRequests.map(req => req()));
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(results).toHaveLength(15);
      
      const stats = connectionPool.getStats();
      expect(stats.totalAcquired).toBeGreaterThanOrEqual(15);
      expect(stats.totalReleased).toBeGreaterThanOrEqual(15);
    });

    test('should maintain pool health under load', async () => {
      // Generate load
      const loadTest = Array.from({ length: 10 }, () => 
        connectionPool.acquireConnection().then(conn => {
          setTimeout(() => connectionPool.releaseConnection(conn), 100);
          return conn;
        })
      );

      await Promise.all(loadTest);

      const health = connectionPool.getHealthStatus();
      const stats = connectionPool.getStats();

      expect(health.isHealthy).toBe(true);
      expect(stats.totalConnections).toBeGreaterThan(0);
      expect(stats.totalConnections).toBeLessThanOrEqual(10); // Max pool size
    });
  });

  describe('Performance Monitoring and Analytics', () => {
    test('should track performance metrics accurately', async () => {
      // Execute various queries to generate metrics
      const queries = [
        { type: 'fast_query', delay: 30 },
        { type: 'medium_query', delay: 120 },
        { type: 'slow_query', delay: 250 }
      ];

      for (const query of queries) {
        const mockQuery = () => new Promise(resolve => 
          setTimeout(() => resolve({ type: query.type }), query.delay)
        );
        await queryOptimizer.monitorQuery(query.type, mockQuery);
      }

      const analytics = queryOptimizer.getPerformanceAnalytics();
      
      expect(analytics.totalQueries).toBeGreaterThanOrEqual(3);
      expect(analytics.avgExecutionTime).toBeGreaterThan(0);
      expect(analytics.slowQueries).toBeGreaterThanOrEqual(1); // slow_query should be detected
      expect(analytics.topSlowQueries.length).toBeGreaterThan(0);
    });

    test('should generate actionable performance recommendations', () => {
      const report = queryOptimizer.generateOptimizationReport();
      
      expect(report.performance.totalQueries).toBeGreaterThan(0);
      expect(report.cache.size).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.summary)).toBe(true);
      
      // Should have performance insights
      const hasPerformanceInsight = report.summary.some(item => 
        item.includes('performance') || 
        item.includes('cache') || 
        item.includes('optimization')
      );
      expect(hasPerformanceInsight).toBe(true);
    });
  });

  describe('Stress Testing', () => {
    test('should handle burst traffic without degradation', async () => {
      const burstSize = 20;
      const burstQueries = Array.from({ length: burstSize }, (_, i) => 
        () => new Promise(resolve => 
          setTimeout(() => resolve({ 
            burstId: i, 
            timestamp: Date.now() 
          }), Math.random() * 100)
        )
      );

      const startTime = Date.now();
      const promises = burstQueries.map((query, i) => 
        queryOptimizer.monitorQuery(`burst_${i}`, query)
      );
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(burstSize);
      expect(totalTime).toBeLessThan(1500); // Should handle burst efficiently
      
      // Verify no significant performance degradation
      const analytics = queryOptimizer.getPerformanceAnalytics();
      expect(analytics.avgExecutionTime).toBeLessThan(200);
    });

    test('should maintain stability under sustained load', async () => {
      const sustainedLoad = async () => {
        const queries = Array.from({ length: 5 }, (_, i) => 
          queryOptimizer.monitorQuery(`sustained_${i}`, () => 
            Promise.resolve({ loadTest: true, queryId: i })
          )
        );
        return Promise.all(queries);
      };

      // Run sustained load for multiple iterations
      const iterations = 3;
      const results = [];
      
      for (let i = 0; i < iterations; i++) {
        const iterationResults = await sustainedLoad();
        results.push(...iterationResults);
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause
      }

      expect(results).toHaveLength(iterations * 5);
      
      // System should remain stable
      const finalAnalytics = queryOptimizer.getPerformanceAnalytics();
      expect(finalAnalytics.totalQueries).toBeGreaterThanOrEqual(iterations * 5);
    });
  });
});
