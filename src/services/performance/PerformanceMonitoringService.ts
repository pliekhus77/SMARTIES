export interface PerformanceMetrics {
  scanSpeed: number; // milliseconds from detection to result
  memoryUsage: number; // MB
  batteryImpact: number; // percentage per hour
  cacheHitRate: number; // percentage
  apiResponseTime: number; // milliseconds
  frameRate: number; // FPS during scanning
}

export interface ScanPerformanceData {
  startTime: number;
  detectionTime?: number;
  lookupTime?: number;
  analysisTime?: number;
  endTime?: number;
  fromCache: boolean;
  success: boolean;
}

export class PerformanceMonitoringService {
  private metrics: PerformanceMetrics = {
    scanSpeed: 0,
    memoryUsage: 0,
    batteryImpact: 0,
    cacheHitRate: 0,
    apiResponseTime: 0,
    frameRate: 30,
  };

  private scanSessions: ScanPerformanceData[] = [];
  private memoryCheckInterval?: NodeJS.Timeout;
  private frameRateMonitor?: NodeJS.Timeout;
  private currentFrameCount = 0;
  private lastFrameTime = Date.now();

  startMonitoring(): void {
    // Monitor memory usage every 5 seconds
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 5000);

    // Monitor frame rate
    this.startFrameRateMonitoring();
  }

  stopMonitoring(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    if (this.frameRateMonitor) {
      clearInterval(this.frameRateMonitor);
    }
  }

  startScanSession(): ScanPerformanceData {
    const session: ScanPerformanceData = {
      startTime: Date.now(),
      fromCache: false,
      success: false,
    };

    this.scanSessions.push(session);
    return session;
  }

  recordDetection(session: ScanPerformanceData): void {
    session.detectionTime = Date.now();
  }

  recordLookup(session: ScanPerformanceData, fromCache: boolean): void {
    session.lookupTime = Date.now();
    session.fromCache = fromCache;
  }

  recordAnalysis(session: ScanPerformanceData): void {
    session.analysisTime = Date.now();
  }

  completeScanSession(session: ScanPerformanceData, success: boolean): void {
    session.endTime = Date.now();
    session.success = success;

    // Calculate scan speed
    if (session.endTime && session.startTime) {
      const scanSpeed = session.endTime - session.startTime;
      this.updateScanSpeedMetric(scanSpeed);
    }

    // Update cache hit rate
    this.updateCacheHitRate();

    // Update API response time if not from cache
    if (!session.fromCache && session.lookupTime && session.detectionTime) {
      const apiTime = session.lookupTime - session.detectionTime;
      this.updateApiResponseTime(apiTime);
    }

    // Keep only last 100 sessions
    if (this.scanSessions.length > 100) {
      this.scanSessions = this.scanSessions.slice(-100);
    }
  }

  private updateScanSpeedMetric(scanSpeed: number): void {
    // Calculate rolling average
    const recentSessions = this.scanSessions.slice(-10);
    const validSessions = recentSessions.filter(s => s.endTime && s.success);
    
    if (validSessions.length > 0) {
      const totalTime = validSessions.reduce((sum, session) => {
        return sum + (session.endTime! - session.startTime);
      }, 0);
      
      this.metrics.scanSpeed = totalTime / validSessions.length;
    }
  }

  private updateCacheHitRate(): void {
    const recentSessions = this.scanSessions.slice(-20);
    const cacheHits = recentSessions.filter(s => s.fromCache).length;
    
    if (recentSessions.length > 0) {
      this.metrics.cacheHitRate = (cacheHits / recentSessions.length) * 100;
    }
  }

  private updateApiResponseTime(responseTime: number): void {
    // Calculate rolling average of API response times
    const recentApiCalls = this.scanSessions
      .slice(-10)
      .filter(s => !s.fromCache && s.lookupTime && s.detectionTime)
      .map(s => s.lookupTime! - s.detectionTime!);

    if (recentApiCalls.length > 0) {
      const avgTime = recentApiCalls.reduce((sum, time) => sum + time, 0) / recentApiCalls.length;
      this.metrics.apiResponseTime = avgTime;
    }
  }

  private async checkMemoryUsage(): Promise<void> {
    try {
      // This would use a native module to get actual memory usage
      // For now, we'll simulate it
      const mockMemoryUsage = Math.random() * 50 + 20; // 20-70 MB
      this.metrics.memoryUsage = mockMemoryUsage;
      
      // Log warning if memory usage is high
      if (mockMemoryUsage > 60) {
        console.warn('High memory usage detected:', mockMemoryUsage, 'MB');
      }
    } catch (error) {
      console.error('Failed to check memory usage:', error);
    }
  }

  private startFrameRateMonitoring(): void {
    this.frameRateMonitor = setInterval(() => {
      const now = Date.now();
      const timeDiff = now - this.lastFrameTime;
      
      if (timeDiff > 0) {
        this.metrics.frameRate = Math.round((this.currentFrameCount * 1000) / timeDiff);
        this.currentFrameCount = 0;
        this.lastFrameTime = now;
      }
    }, 1000);
  }

  recordFrame(): void {
    this.currentFrameCount++;
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    sessionStats: {
      totalSessions: number;
      successRate: number;
      averageScanTime: number;
      cacheHitRate: number;
    };
    recommendations: string[];
  } {
    const successfulSessions = this.scanSessions.filter(s => s.success);
    const successRate = this.scanSessions.length > 0 
      ? (successfulSessions.length / this.scanSessions.length) * 100 
      : 0;

    const recommendations = this.generateRecommendations();

    return {
      metrics: this.getMetrics(),
      sessionStats: {
        totalSessions: this.scanSessions.length,
        successRate,
        averageScanTime: this.metrics.scanSpeed,
        cacheHitRate: this.metrics.cacheHitRate,
      },
      recommendations,
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.scanSpeed > 5000) {
      recommendations.push('Scan speed is slow. Consider optimizing network connection or clearing cache.');
    }

    if (this.metrics.memoryUsage > 50) {
      recommendations.push('High memory usage detected. Consider restarting the app.');
    }

    if (this.metrics.frameRate < 20) {
      recommendations.push('Low frame rate detected. Close other apps to improve performance.');
    }

    if (this.metrics.cacheHitRate < 30) {
      recommendations.push('Low cache hit rate. Frequently scanned products will load faster over time.');
    }

    if (this.metrics.apiResponseTime > 3000) {
      recommendations.push('Slow API responses. Check your internet connection.');
    }

    return recommendations;
  }

  optimizePerformance(): void {
    // Implement performance optimizations
    this.throttleFrameProcessing();
    this.optimizeCacheUsage();
    this.reduceMemoryFootprint();
  }

  private throttleFrameProcessing(): void {
    // Reduce frame processing rate if performance is poor
    if (this.metrics.frameRate < 15 || this.metrics.memoryUsage > 60) {
      console.log('Throttling frame processing for better performance');
      // This would be implemented in the camera component
    }
  }

  private optimizeCacheUsage(): void {
    // Optimize cache based on usage patterns
    if (this.metrics.memoryUsage > 50) {
      console.log('Optimizing cache usage');
      // This would trigger cache cleanup
    }
  }

  private reduceMemoryFootprint(): void {
    // Implement memory optimization strategies
    if (this.metrics.memoryUsage > 60) {
      console.log('Reducing memory footprint');
      // Clear unnecessary data, optimize images, etc.
    }
  }

  // Method to be called when app goes to background
  onAppBackground(): void {
    this.stopMonitoring();
  }

  // Method to be called when app comes to foreground
  onAppForeground(): void {
    this.startMonitoring();
  }
}
