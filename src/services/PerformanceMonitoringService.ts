/**
 * Performance Monitoring and Optimization Service
 * Implements Requirements 8.4, 8.5, 9.5 from vector search specification
 */

export interface PerformanceMetrics {
  responseTime: number;
  apiCalls: number;
  tokenUsage: number;
  cacheHitRate: number;
  errorRate: number;
  userSatisfaction?: number;
}

export interface CostMetrics {
  totalTokens: number;
  estimatedCost: number;
  apiCallCount: number;
  cacheEfficiency: number;
}

export interface UserFeedback {
  analysisId: string;
  upc: string;
  isCorrect: boolean;
  userCorrection?: string;
  confidence: number;
  timestamp: Date;
}

export class PerformanceMonitoringService {
  private metrics: PerformanceMetrics[] = [];
  private costTracking: CostMetrics = {
    totalTokens: 0,
    estimatedCost: 0,
    apiCallCount: 0,
    cacheEfficiency: 0
  };
  private userFeedback: UserFeedback[] = [];

  /**
   * Track operation performance
   */
  trackOperation(operation: string, duration: number, metadata?: any): void {
    const metric: PerformanceMetrics = {
      responseTime: duration,
      apiCalls: metadata?.apiCalls || 0,
      tokenUsage: metadata?.tokenUsage || 0,
      cacheHitRate: metadata?.cacheHit ? 1 : 0,
      errorRate: metadata?.error ? 1 : 0
    };

    this.metrics.push(metric);
    this.updateCostTracking(metric);

    // Log performance alerts
    if (duration > 3000) {
      console.warn(`Slow operation detected: ${operation} took ${duration}ms`);
    }
  }

  /**
   * Update cost tracking metrics
   */
  private updateCostTracking(metric: PerformanceMetrics): void {
    this.costTracking.totalTokens += metric.tokenUsage;
    this.costTracking.apiCallCount += metric.apiCalls;
    this.costTracking.estimatedCost += this.calculateTokenCost(metric.tokenUsage);
    
    // Update cache efficiency
    const totalOps = this.metrics.length;
    const cacheHits = this.metrics.filter(m => m.cacheHitRate > 0).length;
    this.costTracking.cacheEfficiency = totalOps > 0 ? cacheHits / totalOps : 0;
  }

  /**
   * Calculate estimated cost for token usage
   */
  private calculateTokenCost(tokens: number): number {
    // GPT-4 pricing: ~$0.03 per 1K tokens (input) + $0.06 per 1K tokens (output)
    // Simplified calculation assuming 50/50 split
    return (tokens / 1000) * 0.045;
  }

  /**
   * Record user feedback for analysis accuracy
   */
  recordUserFeedback(feedback: UserFeedback): void {
    this.userFeedback.push(feedback);
    
    // Update user satisfaction metrics
    const recentFeedback = this.userFeedback.slice(-100);
    const correctAnalyses = recentFeedback.filter(f => f.isCorrect).length;
    const satisfaction = recentFeedback.length > 0 ? correctAnalyses / recentFeedback.length : 0;
    
    // Update latest metric with satisfaction score
    if (this.metrics.length > 0) {
      this.metrics[this.metrics.length - 1].userSatisfaction = satisfaction;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    avgResponseTime: number;
    totalOperations: number;
    errorRate: number;
    cacheHitRate: number;
    userSatisfaction: number;
  } {
    if (this.metrics.length === 0) {
      return {
        avgResponseTime: 0,
        totalOperations: 0,
        errorRate: 0,
        cacheHitRate: 0,
        userSatisfaction: 0
      };
    }

    const avgResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / this.metrics.length;
    const errorRate = this.metrics.reduce((sum, m) => sum + m.errorRate, 0) / this.metrics.length;
    const cacheHitRate = this.metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / this.metrics.length;
    
    const satisfactionMetrics = this.metrics.filter(m => m.userSatisfaction !== undefined);
    const userSatisfaction = satisfactionMetrics.length > 0 
      ? satisfactionMetrics.reduce((sum, m) => sum + (m.userSatisfaction || 0), 0) / satisfactionMetrics.length
      : 0;

    return {
      avgResponseTime,
      totalOperations: this.metrics.length,
      errorRate,
      cacheHitRate,
      userSatisfaction
    };
  }

  /**
   * Get cost optimization recommendations
   */
  getCostOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.costTracking.cacheEfficiency < 0.7) {
      recommendations.push('Improve caching strategy to reduce API calls');
    }
    
    if (this.costTracking.estimatedCost > 10) {
      recommendations.push('Consider prompt optimization to reduce token usage');
    }
    
    const avgTokensPerCall = this.costTracking.apiCallCount > 0 
      ? this.costTracking.totalTokens / this.costTracking.apiCallCount 
      : 0;
    
    if (avgTokensPerCall > 1000) {
      recommendations.push('Optimize prompts to reduce average token usage per call');
    }

    return recommendations;
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    performance: PerformanceMetrics[];
    cost: CostMetrics;
    feedback: UserFeedback[];
  } {
    return {
      performance: [...this.metrics],
      cost: { ...this.costTracking },
      feedback: [...this.userFeedback]
    };
  }
}
