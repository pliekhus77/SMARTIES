export interface PerformanceMetrics {
  operation: string;
  responseTime: number;
  timestamp: Date;
  success: boolean;
  cacheHit?: boolean;
}

export interface PerformanceStats {
  averageResponseTime: number;
  p95ResponseTime: number;
  successRate: number;
  throughput: number;
  cacheHitRate?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000;

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  getStats(operation?: string, timeWindow?: number): PerformanceStats {
    let filteredMetrics = this.metrics;

    // Filter by operation
    if (operation) {
      filteredMetrics = filteredMetrics.filter(m => m.operation === operation);
    }

    // Filter by time window (minutes)
    if (timeWindow) {
      const cutoff = new Date(Date.now() - timeWindow * 60 * 1000);
      filteredMetrics = filteredMetrics.filter(m => m.timestamp > cutoff);
    }

    if (filteredMetrics.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        successRate: 0,
        throughput: 0
      };
    }

    const responseTimes = filteredMetrics.map(m => m.responseTime);
    const successCount = filteredMetrics.filter(m => m.success).length;
    const cacheHits = filteredMetrics.filter(m => m.cacheHit === true).length;
    const cacheTotal = filteredMetrics.filter(m => m.cacheHit !== undefined).length;

    // Calculate time span for throughput
    const timestamps = filteredMetrics.map(m => m.timestamp.getTime());
    const timeSpan = (Math.max(...timestamps) - Math.min(...timestamps)) / 1000; // seconds

    return {
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      successRate: (successCount / filteredMetrics.length) * 100,
      throughput: timeSpan > 0 ? filteredMetrics.length / timeSpan : 0,
      cacheHitRate: cacheTotal > 0 ? (cacheHits / cacheTotal) * 100 : undefined
    };
  }

  checkPerformanceThresholds(): { [key: string]: boolean } {
    const upcStats = this.getStats('upc_lookup', 5); // Last 5 minutes
    const vectorStats = this.getStats('vector_search', 5);

    return {
      upc_performance: upcStats.averageResponseTime < 100 && upcStats.p95ResponseTime < 150,
      vector_performance: vectorStats.averageResponseTime < 500 && vectorStats.p95ResponseTime < 750,
      upc_success_rate: upcStats.successRate > 95,
      vector_success_rate: vectorStats.successRate > 90,
      overall_throughput: (upcStats.throughput + vectorStats.throughput) > 10
    };
  }

  getAlerts(): string[] {
    const thresholds = this.checkPerformanceThresholds();
    const alerts: string[] = [];

    if (!thresholds.upc_performance) {
      const stats = this.getStats('upc_lookup', 5);
      alerts.push(`UPC lookup performance degraded: ${stats.averageResponseTime.toFixed(1)}ms avg (target: <100ms)`);
    }

    if (!thresholds.vector_performance) {
      const stats = this.getStats('vector_search', 5);
      alerts.push(`Vector search performance degraded: ${stats.averageResponseTime.toFixed(1)}ms avg (target: <500ms)`);
    }

    if (!thresholds.upc_success_rate) {
      const stats = this.getStats('upc_lookup', 5);
      alerts.push(`UPC lookup success rate low: ${stats.successRate.toFixed(1)}% (target: >95%)`);
    }

    if (!thresholds.vector_success_rate) {
      const stats = this.getStats('vector_search', 5);
      alerts.push(`Vector search success rate low: ${stats.successRate.toFixed(1)}% (target: >90%)`);
    }

    return alerts;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  reset(): void {
    this.metrics = [];
  }

  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}

// Singleton instance for global use
export const performanceMonitor = new PerformanceMonitor();
