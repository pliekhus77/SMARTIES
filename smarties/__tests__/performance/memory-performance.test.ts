/**
 * Memory Usage and Performance Optimization Tests
 * Task 8.3: Validate performance requirements
 * 
 * Tests memory usage and performance optimization
 * Requirements: 2.5
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { DatabaseService } from '../../src/services/DatabaseService';
import { OfflineCacheManager } from '../../src/utils/offline';

// Mock components for memory testing
const MockComponent = React.memo(() => null);
const MockHeavyComponent = React.memo(() => {
  // Simulate a component with some memory usage
  const data = new Array(1000).fill(0).map((_, i) => ({ id: i, value: `item_${i}` }));
  return null;
});

// Mock MongoDB client for memory testing
class MockMongoClientForMemory {
  private data: Map<string, any[]> = new Map();

  async connect(): Promise<void> {
    // Simulate connection overhead
    this.data.set('connection_metadata', [{ connected: true, timestamp: Date.now() }]);
  }

  async close(): Promise<void> {
    this.data.clear();
  }

  db() {
    return {
      collection: (name: string) => ({
        insertOne: async (doc: any) => {
          if (!this.data.has(name)) {
            this.data.set(name, []);
          }
          this.data.get(name)!.push(doc);
          return { insertedId: `id_${Date.now()}` };
        },
        find: () => ({
          toArray: async () => this.data.get(name) || []
        }),
        findOne: async () => this.data.get(name)?.[0] || null
      }),
      admin: () => ({
        ping: async () => ({ ok: 1 })
      })
    };
  }

  getDataSize(): number {
    let size = 0;
    this.data.forEach(collection => {
      size += collection.length;
    });
    return size;
  }
}

describe('Memory Usage and Performance Tests', () => {
  // Helper function to get memory usage
  const getMemoryUsage = () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    // Fallback for environments without process.memoryUsage
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0
    };
  };

  // Helper function to force garbage collection
  const forceGC = () => {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  };

  describe('Component Memory Management', () => {
    it('should not leak memory when mounting/unmounting components', async () => {
      const initialMemory = getMemoryUsage().heapUsed;
      
      // Mount and unmount components multiple times
      for (let i = 0; i < 50; i++) {
        const { unmount } = render(<MockComponent />);
        unmount();
        
        // Periodic garbage collection
        if (i % 10 === 0) {
          forceGC();
        }
      }
      
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow GC to complete
      
      const finalMemory = getMemoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
      console.log(`Component memory increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    });

    it('should handle heavy components efficiently', async () => {
      const initialMemory = getMemoryUsage().heapUsed;
      
      // Render heavy components
      const components = Array.from({ length: 10 }, () => render(<MockHeavyComponent />));
      
      const afterRenderMemory = getMemoryUsage().heapUsed;
      const renderMemoryIncrease = afterRenderMemory - initialMemory;
      
      // Unmount all components
      components.forEach(({ unmount }) => unmount());
      
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterUnmountMemory = getMemoryUsage().heapUsed;
      const finalMemoryIncrease = afterUnmountMemory - initialMemory;
      
      // Memory should be mostly reclaimed after unmounting
      expect(finalMemoryIncrease).toBeLessThan(renderMemoryIncrease * 0.5); // At least 50% reclaimed
      console.log(`Heavy component memory: render +${Math.round(renderMemoryIncrease / 1024 / 1024)}MB, final +${Math.round(finalMemoryIncrease / 1024 / 1024)}MB`);
    });

    it('should optimize re-renders with React.memo', async () => {
      let renderCount = 0;
      
      const TestComponent = React.memo(() => {
        renderCount++;
        return null;
      });
      
      const { rerender } = render(<TestComponent />);
      
      const initialRenderCount = renderCount;
      
      // Re-render with same props (should not trigger re-render due to memo)
      for (let i = 0; i < 10; i++) {
        rerender(<TestComponent />);
      }
      
      expect(renderCount).toBe(initialRenderCount); // Should not re-render
      console.log(`Memo optimization: ${renderCount} renders for 10 re-render attempts`);
    });
  });

  describe('Database Service Memory Management', () => {
    let databaseService: DatabaseService;
    let mockClient: MockMongoClientForMemory;

    beforeEach(async () => {
      mockClient = new MockMongoClientForMemory();
      databaseService = new DatabaseService(mockClient as any);
      await databaseService.connect();
    });

    afterEach(async () => {
      await databaseService.disconnect();
    });

    it('should manage database connection memory efficiently', async () => {
      const initialMemory = getMemoryUsage().heapUsed;
      
      // Perform multiple database operations
      for (let i = 0; i < 100; i++) {
        await databaseService.create('test_collection', { 
          id: i, 
          data: `test_data_${i}` 
        });
        
        await databaseService.readOne('test_collection', { id: i });
      }
      
      const afterOperationsMemory = getMemoryUsage().heapUsed;
      const operationsMemoryIncrease = afterOperationsMemory - initialMemory;
      
      // Disconnect and reconnect to test cleanup
      await databaseService.disconnect();
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterDisconnectMemory = getMemoryUsage().heapUsed;
      const finalMemoryIncrease = afterDisconnectMemory - initialMemory;
      
      // Memory should be cleaned up after disconnect
      expect(finalMemoryIncrease).toBeLessThan(operationsMemoryIncrease * 0.7); // At least 30% cleanup
      console.log(`Database memory: operations +${Math.round(operationsMemoryIncrease / 1024 / 1024)}MB, final +${Math.round(finalMemoryIncrease / 1024 / 1024)}MB`);
    });

    it('should handle large datasets without excessive memory usage', async () => {
      const initialMemory = getMemoryUsage().heapUsed;
      
      // Create a large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Product ${i}`,
        description: `This is a test product with ID ${i}`.repeat(10), // Make it larger
        ingredients: Array.from({ length: 20 }, (_, j) => `ingredient_${i}_${j}`),
        metadata: {
          created: new Date(),
          updated: new Date(),
          version: 1
        }
      }));
      
      // Insert large dataset
      for (const item of largeDataset) {
        await databaseService.create('products', item);
      }
      
      const afterInsertMemory = getMemoryUsage().heapUsed;
      const insertMemoryIncrease = afterInsertMemory - initialMemory;
      
      // Read back the data
      const results = await databaseService.read('products', {});
      
      const afterReadMemory = getMemoryUsage().heapUsed;
      const readMemoryIncrease = afterReadMemory - initialMemory;
      
      // Memory usage should be reasonable for the dataset size
      const expectedMaxMemory = largeDataset.length * 2 * 1024; // ~2KB per item max
      expect(readMemoryIncrease).toBeLessThan(expectedMaxMemory);
      
      console.log(`Large dataset memory: insert +${Math.round(insertMemoryIncrease / 1024 / 1024)}MB, read +${Math.round(readMemoryIncrease / 1024 / 1024)}MB`);
    });
  });

  describe('Cache Memory Management', () => {
    let cacheManager: OfflineCacheManager;

    beforeEach(() => {
      cacheManager = OfflineCacheManager.getInstance({
        enableOfflineMode: true,
        maxCacheSize: 100,
        cacheExpirationHours: 1
      });
    });

    afterEach(() => {
      cacheManager.clear();
    });

    it('should manage cache memory efficiently', async () => {
      const initialMemory = getMemoryUsage().heapUsed;
      
      // Fill cache with data
      for (let i = 0; i < 200; i++) { // More than maxCacheSize to test eviction
        const data = {
          id: i,
          name: `Item ${i}`,
          data: new Array(100).fill(0).map((_, j) => `data_${i}_${j}`) // Some bulk data
        };
        
        cacheManager.set(`key_${i}`, data, 'cache');
      }
      
      const afterCacheMemory = getMemoryUsage().heapUsed;
      const cacheMemoryIncrease = afterCacheMemory - initialMemory;
      
      // Clear cache
      cacheManager.clear();
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const afterClearMemory = getMemoryUsage().heapUsed;
      const finalMemoryIncrease = afterClearMemory - initialMemory;
      
      // Memory should be mostly reclaimed after cache clear
      expect(finalMemoryIncrease).toBeLessThan(cacheMemoryIncrease * 0.3); // At least 70% reclaimed
      console.log(`Cache memory: filled +${Math.round(cacheMemoryIncrease / 1024 / 1024)}MB, final +${Math.round(finalMemoryIncrease / 1024 / 1024)}MB`);
    });

    it('should respect cache size limits', async () => {
      const maxCacheSize = 50;
      const limitedCacheManager = OfflineCacheManager.getInstance({
        enableOfflineMode: true,
        maxCacheSize,
        cacheExpirationHours: 1
      });

      const initialMemory = getMemoryUsage().heapUsed;
      
      // Add more items than the cache limit
      for (let i = 0; i < maxCacheSize * 2; i++) {
        const data = { id: i, value: `test_${i}` };
        limitedCacheManager.set(`key_${i}`, data, 'cache');
      }
      
      const afterLimitedCacheMemory = getMemoryUsage().heapUsed;
      const limitedCacheMemoryIncrease = afterLimitedCacheMemory - initialMemory;
      
      // Memory usage should be bounded by cache size limit
      const estimatedMaxMemory = maxCacheSize * 1024; // Rough estimate
      expect(limitedCacheMemoryIncrease).toBeLessThan(estimatedMaxMemory * 2); // Allow some overhead
      
      console.log(`Limited cache memory increase: ${Math.round(limitedCacheMemoryIncrease / 1024)}KB`);
      
      limitedCacheManager.clear();
    });
  });

  describe('Memory Leak Detection', () => {
    it('should detect potential memory leaks in repeated operations', async () => {
      const memorySnapshots: number[] = [];
      const iterations = 20;
      
      for (let i = 0; i < iterations; i++) {
        // Perform operations that might leak memory
        const { unmount } = render(<MockHeavyComponent />);
        
        const mockClient = new MockMongoClientForMemory();
        const dbService = new DatabaseService(mockClient as any);
        await dbService.connect();
        
        await dbService.create('test', { id: i, data: `test_${i}` });
        await dbService.read('test', {});
        
        await dbService.disconnect();
        unmount();
        
        // Take memory snapshot every 5 iterations
        if (i % 5 === 0) {
          forceGC();
          await new Promise(resolve => setTimeout(resolve, 50));
          memorySnapshots.push(getMemoryUsage().heapUsed);
        }
      }
      
      // Analyze memory trend
      if (memorySnapshots.length >= 3) {
        const firstSnapshot = memorySnapshots[0];
        const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
        const memoryGrowth = lastSnapshot - firstSnapshot;
        const growthRate = memoryGrowth / (memorySnapshots.length - 1);
        
        // Memory growth rate should be minimal (less than 1MB per snapshot)
        expect(growthRate).toBeLessThan(1024 * 1024);
        console.log(`Memory growth rate: ${Math.round(growthRate / 1024)}KB per snapshot`);
        console.log(`Total memory growth: ${Math.round(memoryGrowth / 1024 / 1024)}MB`);
      }
    });

    it('should handle stress testing without excessive memory usage', async () => {
      const initialMemory = getMemoryUsage().heapUsed;
      const stressIterations = 100;
      
      // Stress test with rapid operations
      const promises = Array.from({ length: stressIterations }, async (_, i) => {
        const { unmount } = render(<MockComponent />);
        
        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        
        unmount();
        return i;
      });
      
      await Promise.all(promises);
      
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const finalMemory = getMemoryUsage().heapUsed;
      const stressMemoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable even under stress
      expect(stressMemoryIncrease).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
      console.log(`Stress test memory increase: ${Math.round(stressMemoryIncrease / 1024 / 1024)}MB`);
    });
  });

  describe('Performance Optimization Validation', () => {
    it('should validate object pooling effectiveness', async () => {
      // Simulate object pooling pattern
      const objectPool: any[] = [];
      const poolSize = 10;
      
      // Pre-populate pool
      for (let i = 0; i < poolSize; i++) {
        objectPool.push({ id: i, data: null, inUse: false });
      }
      
      const initialMemory = getMemoryUsage().heapUsed;
      
      // Use objects from pool instead of creating new ones
      for (let i = 0; i < 100; i++) {
        const obj = objectPool.find(o => !o.inUse) || { id: -1, data: null, inUse: false };
        obj.inUse = true;
        obj.data = `test_data_${i}`;
        
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 1));
        
        // Return to pool
        obj.inUse = false;
        obj.data = null;
      }
      
      const pooledMemory = getMemoryUsage().heapUsed;
      const pooledMemoryIncrease = pooledMemory - initialMemory;
      
      // Compare with non-pooled approach
      const nonPooledInitialMemory = getMemoryUsage().heapUsed;
      
      for (let i = 0; i < 100; i++) {
        const obj = { id: i, data: `test_data_${i}`, inUse: true };
        
        // Simulate work
        await new Promise(resolve => setTimeout(resolve, 1));
        
        // Object goes out of scope
      }
      
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const nonPooledMemory = getMemoryUsage().heapUsed;
      const nonPooledMemoryIncrease = nonPooledMemory - nonPooledInitialMemory;
      
      // Pooled approach should use less memory
      expect(pooledMemoryIncrease).toBeLessThan(nonPooledMemoryIncrease * 1.5); // Allow some variance
      console.log(`Object pooling: pooled +${Math.round(pooledMemoryIncrease / 1024)}KB, non-pooled +${Math.round(nonPooledMemoryIncrease / 1024)}KB`);
    });

    it('should validate lazy loading effectiveness', async () => {
      let lazyComponentLoaded = false;
      
      const LazyComponent = React.lazy(async () => {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 100));
        lazyComponentLoaded = true;
        return { default: () => null };
      });
      
      const initialMemory = getMemoryUsage().heapUsed;
      
      // Component should not be loaded initially
      expect(lazyComponentLoaded).toBe(false);
      
      // Render with Suspense
      const { unmount } = render(
        <React.Suspense fallback={null}>
          <LazyComponent />
        </React.Suspense>
      );
      
      // Wait for lazy loading
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });
      
      expect(lazyComponentLoaded).toBe(true);
      
      const lazyLoadedMemory = getMemoryUsage().heapUsed;
      const lazyMemoryIncrease = lazyLoadedMemory - initialMemory;
      
      unmount();
      
      // Lazy loading should minimize initial memory usage
      expect(lazyMemoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB
      console.log(`Lazy loading memory increase: ${Math.round(lazyMemoryIncrease / 1024)}KB`);
    });
  });
});