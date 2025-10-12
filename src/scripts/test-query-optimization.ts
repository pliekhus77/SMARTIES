#!/usr/bin/env ts-node

/**
 * Script to test and demonstrate Query Optimization and Monitoring Service
 * Implements Task 6.2: Query optimization and monitoring demonstration
 * 
 * Usage:
 *   npm run test-query-optimization
 *   or
 *   npx ts-node src/scripts/test-query-optimization.ts
 */

import { QueryOptimizationService } from '../services/QueryOptimizationService';
import { ConnectionPoolService } from '../services/ConnectionPoolService';

async function main() {
  console.log('🚀 SMARTIES Query Optimization & Monitoring Test');
  console.log('=================================================');
  
  // Initialize services
  const queryOptimizer = new QueryOptimizationService();
  const connectionPool = new ConnectionPoolService({
    minConnections: 2,
    maxConnections: 5,
    acquireTimeoutMs: 5000
  });

  try {
    console.log('\n📊 Testing Query Performance Monitoring...');
    
    // Simulate various query types with different performance characteristics
    await simulateQueries(queryOptimizer);
    
    console.log('\n🔗 Testing Connection Pool...');
    await testConnectionPool(connectionPool);
    
    console.log('\n📈 Generating Performance Analytics...');
    const report = queryOptimizer.generateOptimizationReport();
    displayReport(report);
    
    console.log('\n🔍 Connection Pool Health Check...');
    const poolHealth = connectionPool.getHealthStatus();
    displayPoolHealth(poolHealth);
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await connectionPool.shutdown();
    console.log('\n✅ Test completed successfully');
  }
}

/**
 * Simulate various database queries with different performance characteristics
 */
async function simulateQueries(optimizer: QueryOptimizationService): Promise<void> {
  const queries = [
    // Fast queries
    { type: 'upc_lookup', delay: 50, cacheKey: 'upc_123456' },
    { type: 'upc_lookup', delay: 45, cacheKey: 'upc_123456' }, // Cache hit
    { type: 'user_profile', delay: 30, cacheKey: 'user_profile_abc' },
    
    // Medium queries
    { type: 'allergen_search', delay: 150 },
    { type: 'dietary_filter', delay: 120 },
    { type: 'product_search', delay: 180, cacheKey: 'search_vegan' },
    
    // Slow queries
    { type: 'complex_aggregation', delay: 300 },
    { type: 'full_text_search', delay: 450 },
    { type: 'analytics_query', delay: 600 },
    
    // Error simulation
    { type: 'failing_query', delay: 100, shouldFail: true }
  ];

  for (const query of queries) {
    try {
      await optimizer.monitorQuery(
        query.type,
        () => simulateQueryExecution(query.delay, query.shouldFail),
        query.cacheKey
      );
      
      console.log(`  ✅ ${query.type}: ${query.delay}ms${query.cacheKey ? ' (cached)' : ''}`);
    } catch (error) {
      console.log(`  ❌ ${query.type}: Failed - ${error}`);
    }
    
    // Small delay between queries
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Simulate query execution with configurable delay and failure
 */
async function simulateQueryExecution(delay: number, shouldFail: boolean = false): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, delay));
  
  if (shouldFail) {
    throw new Error('Simulated query failure');
  }
  
  // Return mock result
  return { data: `Mock result after ${delay}ms` };
}

/**
 * Test connection pool functionality
 */
async function testConnectionPool(pool: ConnectionPoolService): Promise<void> {
  const connections: any[] = [];
  
  try {
    // Acquire multiple connections
    console.log('  📝 Acquiring connections...');
    for (let i = 0; i < 3; i++) {
      const conn = await pool.acquireConnection();
      connections.push(conn);
      console.log(`    ✅ Acquired connection: ${conn.id}`);
    }
    
    // Display pool stats
    const stats = pool.getStats();
    console.log(`  📊 Pool stats: ${stats.activeConnections} active, ${stats.idleConnections} idle`);
    
    // Release connections
    console.log('  📝 Releasing connections...');
    connections.forEach(conn => {
      pool.releaseConnection(conn);
      console.log(`    ✅ Released connection: ${conn.id}`);
    });
    
  } catch (error) {
    console.error('  ❌ Connection pool test failed:', error);
  }
}

/**
 * Display optimization report
 */
function displayReport(report: ReturnType<typeof QueryOptimizationService.prototype.generateOptimizationReport>): void {
  console.log('\n📋 PERFORMANCE OPTIMIZATION REPORT');
  console.log('==================================');
  
  // Performance summary
  console.log('\n🎯 Performance Metrics:');
  console.log(`  • Total Queries: ${report.performance.totalQueries}`);
  console.log(`  • Average Execution Time: ${report.performance.avgExecutionTime}ms`);
  console.log(`  • Slow Queries: ${report.performance.slowQueries}`);
  console.log(`  • Cache Hit Rate: ${report.performance.cacheHitRate * 100}%`);
  
  // Top slow queries
  if (report.performance.topSlowQueries.length > 0) {
    console.log('\n🐌 Slowest Queries:');
    report.performance.topSlowQueries.slice(0, 5).forEach((query, index) => {
      console.log(`  ${index + 1}. ${query.queryType}: ${query.executionTime}ms`);
    });
  }
  
  // Cache statistics
  console.log('\n💾 Cache Performance:');
  console.log(`  • Cache Size: ${report.cache.size} entries`);
  console.log(`  • Hit Rate: ${report.cache.hitRate * 100}%`);
  console.log(`  • Total Hits: ${report.cache.totalHits}`);
  
  // Index recommendations
  if (report.indexes.recommendations.length > 0) {
    console.log('\n🔧 Index Optimization Recommendations:');
    report.indexes.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }
  
  // Recent alerts
  if (report.alerts.length > 0) {
    console.log('\n🚨 Recent Performance Alerts:');
    report.alerts.slice(0, 5).forEach(alert => {
      const severity = alert.severity.toUpperCase();
      const icon = alert.severity === 'critical' ? '🔴' : 
                   alert.severity === 'high' ? '🟠' : 
                   alert.severity === 'medium' ? '🟡' : '🔵';
      console.log(`  ${icon} [${severity}] ${alert.message}`);
    });
  }
  
  // Summary
  console.log('\n📝 Summary:');
  report.summary.forEach(item => {
    console.log(`  ${item}`);
  });
}

/**
 * Display connection pool health status
 */
function displayPoolHealth(health: ReturnType<typeof ConnectionPoolService.prototype.getHealthStatus>): void {
  console.log(`\n🏥 Connection Pool Health: ${health.isHealthy ? '✅ HEALTHY' : '⚠️ ISSUES DETECTED'}`);
  
  if (health.issues.length > 0) {
    console.log('\n⚠️ Issues:');
    health.issues.forEach(issue => {
      console.log(`  • ${issue}`);
    });
  }
  
  if (health.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    health.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as testQueryOptimization };
