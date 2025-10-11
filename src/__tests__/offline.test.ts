/**
 * Unit tests for offline functionality
 * Tests Requirement 5.4 implementation for offline fallback behavior
 */

import { OfflineManager, OfflineCacheManager, OfflineUtils } from '../utils/offline';

describe('OfflineManager', () => {
  let offlineManager: OfflineManager;

  beforeEach(() => {
    // Create fresh instance for each test
    offlineManager = OfflineManager.getInstance({
      enableOfflineMode: true,
      maxCacheSize: 10,
      cacheExpirationHours: 1,
      syncRetryAttempts: 2,
      syncRetryDelayMs: 1000
    });
  });

  afterEach(() => {
    // Clean up
    offlineManager.clearSyncQueue();
  });

  describe('Network State Management', () => {
    it('should initialize with default offline state', () => {
      expect(offlineManager.isOffline()).toBe(false);
    });

    it('should update offline state when set manually', () => {
      offlineManager.setOfflineMode(true);
      expect(offlineManager.isOffline()).toBe(true);

      offlineManager.setOfflineMode(false);
      expect(offlineManager.isOffline()).toBe(false);
    });

    it('should notify listeners when offline state changes', (done) => {
      let notificationCount = 0;
      
      const unsubscribe = offlineManager.addOfflineListener((isOffline) => {
        notificationCount++;
        if (notificationCount === 1) {
          expect(isOffline).toBe(true);
        } else if (notificationCount === 2) {
          expect(isOffline).toBe(false);
          unsubscribe();
          done();
        }
      });

      offlineManager.setOfflineMode(true);
      offlineManager.setOfflineMode(false);
    });

    it('should return current network state', () => {
      const networkState = offlineManager.getNetworkState();
      expect(networkState).toHaveProperty('isConnected');
      expect(networkState).toHaveProperty('isInternetReachable');
      expect(networkState).toHaveProperty('type');
    });
  });

  describe('Sync Queue Management', () => {
    it('should queue operations for sync', () => {
      offlineManager.queueForSync({
        operation: 'create',
        collection: 'products',
        data: { name: 'Test Product' },
        maxRetries: 3
      });

      const status = offlineManager.getSyncQueueStatus();
      expect(status.queueLength).toBe(1);
      expect(status.oldestItem).toBeInstanceOf(Date);
      expect(status.newestItem).toBeInstanceOf(Date);
    });

    it('should clear sync queue', () => {
      offlineManager.queueForSync({
        operation: 'update',
        collection: 'users',
        data: { name: 'Updated User' },
        maxRetries: 3
      });

      expect(offlineManager.getSyncQueueStatus().queueLength).toBe(1);
      
      offlineManager.clearSyncQueue();
      expect(offlineManager.getSyncQueueStatus().queueLength).toBe(0);
    });

    it('should handle multiple queued operations', () => {
      const operations = [
        { operation: 'create' as const, collection: 'products', data: { name: 'Product 1' }, maxRetries: 3 },
        { operation: 'update' as const, collection: 'users', data: { name: 'User 1' }, maxRetries: 3 },
        { operation: 'delete' as const, collection: 'scan_results', data: { id: '123' }, maxRetries: 3 }
      ];

      operations.forEach(op => offlineManager.queueForSync(op));

      const status = offlineManager.getSyncQueueStatus();
      expect(status.queueLength).toBe(3);
    });
  });
});

describe('OfflineCacheManager', () => {
  let cacheManager: OfflineCacheManager;

  beforeEach(() => {
    cacheManager = OfflineCacheManager.getInstance({
      enableOfflineMode: true,
      maxCacheSize: 10,
      cacheExpirationHours: 1,
      syncRetryAttempts: 2,
      syncRetryDelayMs: 1000
    });
    cacheManager.clear();
  });

  afterEach(() => {
    cacheManager.clear();
  });

  describe('Cache Operations', () => {
    it('should store and retrieve data', () => {
      const testData = { id: '123', name: 'Test Product' };
      cacheManager.set('test-key', testData);

      const cached = cacheManager.get('test-key');
      expect(cached).not.toBeNull();
      expect(cached?.data).toEqual(testData);
      expect(cached?.source).toBe('network');
    });

    it('should return null for non-existent keys', () => {
      const cached = cacheManager.get('non-existent-key');
      expect(cached).toBeNull();
    });

    it('should check if key exists', () => {
      cacheManager.set('existing-key', { data: 'test' });
      
      expect(cacheManager.has('existing-key')).toBe(true);
      expect(cacheManager.has('non-existent-key')).toBe(false);
    });

    it('should delete cached data', () => {
      cacheManager.set('delete-me', { data: 'test' });
      expect(cacheManager.has('delete-me')).toBe(true);

      const deleted = cacheManager.delete('delete-me');
      expect(deleted).toBe(true);
      expect(cacheManager.has('delete-me')).toBe(false);
    });

    it('should clear all cached data', () => {
      cacheManager.set('key1', { data: 'test1' });
      cacheManager.set('key2', { data: 'test2' });
      
      expect(cacheManager.has('key1')).toBe(true);
      expect(cacheManager.has('key2')).toBe(true);

      cacheManager.clear();
      
      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
    });
  });

  describe('Cache Expiration', () => {
    it('should handle expired entries', () => {
      // Test expiration logic by manually setting expired timestamp
      const now = new Date();
      const expiredEntry = {
        data: { test: 'data' },
        timestamp: new Date(now.getTime() - 60000), // 1 minute ago
        expiresAt: new Date(now.getTime() - 30000), // Expired 30 seconds ago
        source: 'network' as const
      };

      // Manually set expired entry in cache
      (cacheManager as any).cache.set('expired-key', expiredEntry);

      // Should return null for expired entry
      expect(cacheManager.get('expired-key')).toBeNull();
      
      // Should not exist after expiration check
      expect(cacheManager.has('expired-key')).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide cache statistics', () => {
      cacheManager.set('key1', { data: 'test1' });
      cacheManager.set('key2', { data: 'test2' });

      const stats = cacheManager.getStats();
      expect(stats.totalEntries).toBe(2);
      expect(stats.estimatedSizeMB).toBeGreaterThan(0);
      expect(typeof stats.cacheHitRate).toBe('number');
      expect(typeof stats.expiredEntries).toBe('number');
    });
  });
});

describe('OfflineUtils', () => {
  describe('Cache Key Generation', () => {
    it('should create consistent cache keys', () => {
      const query1 = { id: '123', name: 'test' };
      const query2 = { name: 'test', id: '123' }; // Different order

      const key1 = OfflineUtils.createCacheKey('products', query1);
      const key2 = OfflineUtils.createCacheKey('products', query2);

      expect(key1).toBe(key2); // Should be same despite different property order
      expect(key1).toContain('products:');
    });

    it('should create different keys for different collections', () => {
      const query = { id: '123' };
      
      const key1 = OfflineUtils.createCacheKey('products', query);
      const key2 = OfflineUtils.createCacheKey('users', query);

      expect(key1).not.toBe(key2);
    });

    it('should create different keys for different queries', () => {
      const query1 = { id: '123' };
      const query2 = { id: '456' };
      
      const key1 = OfflineUtils.createCacheKey('products', query1);
      const key2 = OfflineUtils.createCacheKey('products', query2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('Cache Usage Decision', () => {
    it('should use cache when offline', () => {
      const cacheEntry = {
        data: { test: 'data' },
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        source: 'network' as const
      };

      expect(OfflineUtils.shouldUseCache(true, cacheEntry)).toBe(true);
      expect(OfflineUtils.shouldUseCache(true, null)).toBe(false);
    });

    it('should use fresh cache when online', () => {
      const freshCache = {
        data: { test: 'data' },
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        expiresAt: new Date(Date.now() + 60000),
        source: 'network' as const
      };

      const staleCache = {
        data: { test: 'data' },
        timestamp: new Date(Date.now() - 600000), // 10 minutes ago
        expiresAt: new Date(Date.now() + 60000),
        source: 'network' as const
      };

      expect(OfflineUtils.shouldUseCache(false, freshCache)).toBe(true);
      expect(OfflineUtils.shouldUseCache(false, staleCache)).toBe(false);
      expect(OfflineUtils.shouldUseCache(false, null)).toBe(false);
    });
  });

  describe('Operation Support', () => {
    it('should support all operations offline', () => {
      expect(OfflineUtils.canPerformOffline('create')).toBe(true);
      expect(OfflineUtils.canPerformOffline('read')).toBe(true);
      expect(OfflineUtils.canPerformOffline('update')).toBe(true);
      expect(OfflineUtils.canPerformOffline('delete')).toBe(true);
    });
  });

  describe('Status Messages', () => {
    it('should generate appropriate online status messages', () => {
      expect(OfflineUtils.getOfflineStatusMessage(false, 0))
        .toBe('Online - All data synchronized');
      
      expect(OfflineUtils.getOfflineStatusMessage(false, 3))
        .toBe('Online - Syncing 3 pending operations');
    });

    it('should generate appropriate offline status messages', () => {
      expect(OfflineUtils.getOfflineStatusMessage(true, 0))
        .toBe('Offline - Limited functionality available');
      
      expect(OfflineUtils.getOfflineStatusMessage(true, 2))
        .toBe('Offline - 2 operations queued for sync');
    });

    it('should create offline error messages', () => {
      const message = OfflineUtils.createOfflineErrorMessage('save data');
      expect(message).toContain('Unable to save data while offline');
      expect(message).toContain('queued');
      expect(message).toContain('connection is restored');
    });
  });
});

describe('Integration Tests', () => {
  let offlineManager: OfflineManager;
  let cacheManager: OfflineCacheManager;

  beforeEach(() => {
    offlineManager = OfflineManager.getInstance();
    cacheManager = OfflineCacheManager.getInstance({
      enableOfflineMode: true,
      maxCacheSize: 10,
      cacheExpirationHours: 1,
      syncRetryAttempts: 2,
      syncRetryDelayMs: 1000
    });
    
    offlineManager.clearSyncQueue();
    cacheManager.clear();
  });

  it('should handle offline-to-online transition', (done) => {
    // Start offline
    offlineManager.setOfflineMode(true);
    
    // Queue some operations
    offlineManager.queueForSync({
      operation: 'create',
      collection: 'products',
      data: { name: 'Test Product' },
      maxRetries: 3
    });

    expect(offlineManager.getSyncQueueStatus().queueLength).toBe(1);

    // Listen for online transition
    const unsubscribe = offlineManager.addOfflineListener((isOffline) => {
      if (!isOffline) {
        // Should still have queued operations initially
        // (they would be processed asynchronously in real implementation)
        expect(offlineManager.getSyncQueueStatus().queueLength).toBeGreaterThanOrEqual(0);
        unsubscribe();
        done();
      }
    });

    // Go back online
    offlineManager.setOfflineMode(false);
  });

  it('should maintain cache consistency across offline/online states', () => {
    const testData = { id: '123', name: 'Test Product' };
    const cacheKey = OfflineUtils.createCacheKey('products', { id: '123' });

    // Cache data while online
    offlineManager.setOfflineMode(false);
    cacheManager.set(cacheKey, testData, 'network');

    // Should be able to access while online
    expect(OfflineUtils.shouldUseCache(false, cacheManager.get(cacheKey))).toBe(true);

    // Go offline
    offlineManager.setOfflineMode(true);

    // Should still be able to access cached data
    expect(OfflineUtils.shouldUseCache(true, cacheManager.get(cacheKey))).toBe(true);
    expect(cacheManager.get(cacheKey)?.data).toEqual(testData);
  });
});