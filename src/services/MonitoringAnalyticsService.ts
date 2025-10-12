/**
 * Monitoring and Analytics Service
 * Implements monitoring and observability requirements from SMARTIES API integration specification
 */

export interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  timestamp: Date;
  metadata?: any;
}

export interface ErrorMetric {
  error: string;
  context: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  stackTrace?: string;
}

export interface UsageMetric {
  feature: string;
  action: string;
  userId?: string;
  timestamp: Date;
  metadata?: any;
}

export class MonitoringAnalyticsService {
  private performanceMetrics: PerformanceMetric[] = [];
  private errorMetrics: ErrorMetric[] = [];
  private usageMetrics: UsageMetric[] = [];
  private readonly MAX_METRICS = 1000;

  /**
   * Track performance metrics
   */
  trackPerformance(
    operation: string,
    startTime: number,
    success: boolean,
    metadata?: any
  ): void {
    const metric: PerformanceMetric = {
      operation,
      duration: Date.now() - startTime,
      success,
      timestamp: new Date(),
      metadata
    };

    this.performanceMetrics.push(metric);
    this.trimMetrics(this.performanceMetrics);

    // Log slow operations
    if (metric.duration > 3000) {
      console.warn(`Slow operation detected: ${operation} took ${metric.duration}ms`);
    }
  }

  /**
   * Track errors
   */
  trackError(error: any, context: string, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    const metric: ErrorMetric = {
      error: error.message || error.toString(),
      context,
      severity,
      timestamp: new Date(),
      stackTrace: error.stack
    };

    this.errorMetrics.push(metric);
    this.trimMetrics(this.errorMetrics);

    // Alert for high severity errors
    if (severity === 'high') {
      this.alertHighSeverityError(metric);
    }
  }

  /**
   * Track usage analytics
   */
  trackUsage(feature: string, action: string, userId?: string, metadata?: any): void {
    const metric: UsageMetric = {
      feature,
      action,
      userId,
      timestamp: new Date(),
      metadata
    };

    this.usageMetrics.push(metric);
    this.trimMetrics(this.usageMetrics);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    avgResponseTime: number;
    successRate: number;
    slowOperations: number;
    totalOperations: number;
  } {
    if (this.performanceMetrics.length === 0) {
      return {
        avgResponseTime: 0,
        successRate: 0,
        slowOperations: 0,
        totalOperations: 0
      };
    }

    const totalDuration = this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0);
    const successfulOps = this.performanceMetrics.filter(m => m.success).length;
    const slowOps = this.performanceMetrics.filter(m => m.duration > 3000).length;

    return {
      avgResponseTime: totalDuration / this.performanceMetrics.length,
      successRate: successfulOps / this.performanceMetrics.length,
      slowOperations: slowOps,
      totalOperations: this.performanceMetrics.length
    };
  }

  /**
   * Get error summary
   */
  getErrorSummary(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: ErrorMetric[];
  } {
    const errorsByType = this.errorMetrics.reduce((acc, error) => {
      const errorType = error.error.split(':')[0] || 'Unknown';
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsBySeverity = this.errorMetrics.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentErrors = this.errorMetrics
      .filter(e => Date.now() - e.timestamp.getTime() < 3600000) // Last hour
      .slice(-10);

    return {
      totalErrors: this.errorMetrics.length,
      errorsByType,
      errorsBySeverity,
      recentErrors
    };
  }

  /**
   * Get usage analytics
   */
  getUsageAnalytics(): {
    totalActions: number;
    uniqueUsers: number;
    topFeatures: Array<{ feature: string; count: number }>;
    userActivity: Record<string, number>;
  } {
    const uniqueUsers = new Set(
      this.usageMetrics
        .filter(m => m.userId)
        .map(m => m.userId!)
    ).size;

    const featureCounts = this.usageMetrics.reduce((acc, metric) => {
      acc[metric.feature] = (acc[metric.feature] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topFeatures = Object.entries(featureCounts)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const userActivity = this.usageMetrics.reduce((acc, metric) => {
      if (metric.userId) {
        acc[metric.userId] = (acc[metric.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalActions: this.usageMetrics.length,
      uniqueUsers,
      topFeatures,
      userActivity
    };
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): {
    performance: PerformanceMetric[];
    errors: ErrorMetric[];
    usage: UsageMetric[];
    summary: any;
  } {
    return {
      performance: [...this.performanceMetrics],
      errors: [...this.errorMetrics],
      usage: [...this.usageMetrics],
      summary: {
        performance: this.getPerformanceSummary(),
        errors: this.getErrorSummary(),
        usage: this.getUsageAnalytics()
      }
    };
  }

  /**
   * Create performance tracker for operations
   */
  createPerformanceTracker(operation: string) {
    const startTime = Date.now();
    
    return {
      success: (metadata?: any) => {
        this.trackPerformance(operation, startTime, true, metadata);
      },
      failure: (error: any, metadata?: any) => {
        this.trackPerformance(operation, startTime, false, metadata);
        this.trackError(error, operation, 'medium');
      }
    };
  }

  /**
   * Alert for high severity errors
   */
  private alertHighSeverityError(error: ErrorMetric): void {
    console.error('HIGH SEVERITY ERROR:', {
      error: error.error,
      context: error.context,
      timestamp: error.timestamp
    });

    // In production, this would send alerts to monitoring services
  }

  /**
   * Trim metrics arrays to prevent memory issues
   */
  private trimMetrics(metrics: any[]): void {
    if (metrics.length > this.MAX_METRICS) {
      metrics.splice(0, metrics.length - this.MAX_METRICS);
    }
  }

  /**
   * Start periodic cleanup
   */
  startPeriodicCleanup(): void {
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;
      
      // Remove old metrics
      this.performanceMetrics = this.performanceMetrics.filter(
        m => m.timestamp.getTime() > oneHourAgo
      );
      this.errorMetrics = this.errorMetrics.filter(
        m => m.timestamp.getTime() > oneHourAgo
      );
      this.usageMetrics = this.usageMetrics.filter(
        m => m.timestamp.getTime() > oneHourAgo
      );
    }, 300000); // Every 5 minutes
  }
}
