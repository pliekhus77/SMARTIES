import { PerformanceMonitoringService } from '../PerformanceMonitoringService';

describe('PerformanceMonitoringService', () => {
  let service: PerformanceMonitoringService;

  beforeEach(() => {
    service = new PerformanceMonitoringService();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    service.stopMonitoring();
    jest.useRealTimers();
  });

  describe('scan session tracking', () => {
    it('tracks complete scan session', () => {
      const session = service.startScanSession();
      
      expect(session.startTime).toBeDefined();
      expect(session.success).toBe(false);
      expect(session.fromCache).toBe(false);

      // Simulate scan progression
      jest.advanceTimersByTime(100);
      service.recordDetection(session);
      
      jest.advanceTimersByTime(200);
      service.recordLookup(session, false);
      
      jest.advanceTimersByTime(50);
      service.recordAnalysis(session);
      
      jest.advanceTimersByTime(50);
      service.completeScanSession(session, true);

      expect(session.detectionTime).toBeDefined();
      expect(session.lookupTime).toBeDefined();
      expect(session.analysisTime).toBeDefined();
      expect(session.endTime).toBeDefined();
      expect(session.success).toBe(true);
    });

    it('calculates scan speed metrics', () => {
      // Create multiple successful sessions
      for (let i = 0; i < 5; i++) {
        const session = service.startScanSession();
        jest.advanceTimersByTime(1000 + i * 100); // Varying scan times
        service.completeScanSession(session, true);
      }

      const metrics = service.getMetrics();
      expect(metrics.scanSpeed).toBeGreaterThan(0);
    });

    it('calculates cache hit rate', () => {
      // Create sessions with mixed cache hits
      for (let i = 0; i < 10; i++) {
        const session = service.startScanSession();
        const fromCache = i < 3; // First 3 from cache
        service.recordLookup(session, fromCache);
        service.completeScanSession(session, true);
      }

      const metrics = service.getMetrics();
      expect(metrics.cacheHitRate).toBe(30); // 3 out of 10
    });
  });

  describe('performance monitoring', () => {
    it('starts and stops monitoring', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      service.startMonitoring();
      expect(setIntervalSpy).toHaveBeenCalledTimes(2); // Memory and frame rate

      service.stopMonitoring();
      expect(clearIntervalSpy).toHaveBeenCalledTimes(2);
    });

    it('records frame rate', () => {
      service.startMonitoring();
      
      // Simulate frames
      for (let i = 0; i < 30; i++) {
        service.recordFrame();
      }
      
      jest.advanceTimersByTime(1000);
      
      const metrics = service.getMetrics();
      expect(metrics.frameRate).toBe(30);
    });
  });

  describe('performance report', () => {
    it('generates comprehensive performance report', () => {
      // Create some test data
      const session1 = service.startScanSession();
      service.completeScanSession(session1, true);
      
      const session2 = service.startScanSession();
      service.completeScanSession(session2, false);

      const report = service.getPerformanceReport();

      expect(report.metrics).toBeDefined();
      expect(report.sessionStats.totalSessions).toBe(2);
      expect(report.sessionStats.successRate).toBe(50);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('provides performance recommendations', () => {
      // Simulate poor performance conditions
      const service = new PerformanceMonitoringService();
      (service as any).metrics = {
        scanSpeed: 6000, // Slow
        memoryUsage: 60, // High
        frameRate: 15, // Low
        cacheHitRate: 20, // Low
        apiResponseTime: 4000, // Slow
      };

      const report = service.getPerformanceReport();
      
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(r => r.includes('slow'))).toBe(true);
      expect(report.recommendations.some(r => r.includes('memory'))).toBe(true);
    });
  });

  describe('performance optimization', () => {
    it('triggers optimization when performance is poor', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Set poor performance metrics
      (service as any).metrics = {
        frameRate: 10,
        memoryUsage: 70,
      };

      service.optimizePerformance();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Throttling frame processing')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Reducing memory footprint')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('app lifecycle', () => {
    it('handles app background and foreground', () => {
      const startSpy = jest.spyOn(service, 'startMonitoring');
      const stopSpy = jest.spyOn(service, 'stopMonitoring');

      service.onAppBackground();
      expect(stopSpy).toHaveBeenCalled();

      service.onAppForeground();
      expect(startSpy).toHaveBeenCalled();
    });
  });
});
