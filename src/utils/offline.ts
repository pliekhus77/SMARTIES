/**
 * Offline handling utilities for SMARTIES application
 * Implements Requirement 5.4 for offline fallback behavior
 * 
 * Features:
 * - Network connectivity detection
 * - Offline mode state management
 * - Data synchronization preparation
 * - Graceful degradation utilities
 */

// NetworkInfo type definition (avoiding React Native dependency in tests)
interface NetworkInfo {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
  details: any;
}

/**
 * Network connectivity state
 */
export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  details: any;
}

/**
 * Offline mode configuration
 */
export interface OfflineConfig {
  enableOfflineMode: boolean;
  maxCacheSize: number; // in MB
  cacheExpirationHours: number;
  syncRetryAttempts: number;
  syncRetryDelayMs: number;
}

/**
 * Sync queue item for offline operations
 */
export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

/**
 * Offline data cache entry
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
  source: 'network' | 'cache';
}

/**
 * Offline mode manager for handling network state and data synchronization
 */
export class OfflineManager {
  private static instance: OfflineManager;
  private networkState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: null,
    details: null
  };
  private offlineMode: boolean = false;
  private listeners: Array<(isOffline: boolean) => void> = [];
  private syncQueue: SyncQueueItem[] = [];
  private config: OfflineConfig;

  private constructor(config?: Partial<OfflineConfig>) {
    this.config = {
      enableOfflineMode: true,
      maxCacheSize: 50, // 50MB
      cacheExpirationHours: 24,
      syncRetryAttempts: 3,
      syncRetryDelayMs: 5000,
      ...config
    };
  }

  /**
   * Get singleton instance of OfflineManager
   */
  static getInstance(config?: Partial<OfflineConfig>): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager(config);
    }
    return OfflineManager.instance;
  }

  /**
   * Initialize offline manager with network monitoring
   */
  async initialize(): Promise<void> {
    try {
      // Check initial network state
      await this.checkNetworkState();
      
      // Set up network state monitoring
      this.startNetworkMonitoring();
      
      console.log('OfflineManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OfflineManager:', error);
      // Assume offline mode if initialization fails
      this.setOfflineMode(true);
    }
  }

  /**
   * Check current network connectivity state
   */
  async checkNetworkState(): Promise<NetworkState> {
    try {
      // In a real React Native app, this would use @react-native-community/netinfo
      // For now, we'll simulate network detection
      const isConnected = await this.simulateNetworkCheck();
      
      this.networkState = {
        isConnected,
        isInternetReachable: isConnected,
        type: isConnected ? 'wifi' : null,
        details: null
      };

      const wasOffline = this.offlineMode;
      this.offlineMode = !isConnected;

      // Notify listeners if offline state changed
      if (wasOffline !== this.offlineMode) {
        this.notifyListeners(this.offlineMode);
      }

      return this.networkState;
    } catch (error) {
      console.error('Network state check failed:', error);
      this.setOfflineMode(true);
      return this.networkState;
    }
  }

  /**
   * Simulate network connectivity check
   * In production, this would use actual network detection
   */
  private async simulateNetworkCheck(): Promise<boolean> {
    try {
      // Simulate a simple connectivity test
      // In real implementation, this would ping a reliable endpoint
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simulate 90% connectivity success rate
          resolve(Math.random() > 0.1);
        }, 100);
      });
    } catch {
      return false;
    }
  }

  /**
   * Start monitoring network state changes
   */
  private startNetworkMonitoring(): void {
    // In a real React Native app, this would use NetInfo.addEventListener
    // For now, we'll simulate periodic checks
    setInterval(async () => {
      await this.checkNetworkState();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Set offline mode manually
   */
  setOfflineMode(isOffline: boolean): void {
    const wasOffline = this.offlineMode;
    this.offlineMode = isOffline;
    
    if (wasOffline !== isOffline) {
      console.log(`Offline mode ${isOffline ? 'enabled' : 'disabled'}`);
      this.notifyListeners(isOffline);
      
      // If coming back online, attempt to sync queued operations
      if (!isOffline && wasOffline) {
        this.processSyncQueue();
      }
    }
  }

  /**
   * Get current offline mode state
   */
  isOffline(): boolean {
    return this.offlineMode;
  }

  /**
   * Get current network state
   */
  getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * Add listener for offline mode changes
   */
  addOfflineListener(listener: (isOffline: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of offline state change
   */
  private notifyListeners(isOffline: boolean): void {
    this.listeners.forEach(listener => {
      try {
        listener(isOffline);
      } catch (error) {
        console.error('Error in offline listener:', error);
      }
    });
  }

  /**
   * Queue operation for later synchronization when online
   */
  queueForSync(operation: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): void {
    const queueItem: SyncQueueItem = {
      id: this.generateSyncId(),
      timestamp: new Date(),
      retryCount: 0,
      ...operation
    };

    this.syncQueue.push(queueItem);
    console.log(`Queued ${operation.operation} operation for ${operation.collection}`);
  }

  /**
   * Process sync queue when coming back online
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.syncQueue.length} queued operations`);

    const itemsToProcess = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of itemsToProcess) {
      try {
        await this.processSyncItem(item);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        
        // Retry if under max attempts
        if (item.retryCount < item.maxRetries) {
          item.retryCount++;
          this.syncQueue.push(item);
        } else {
          console.error(`Max retries exceeded for sync item ${item.id}`);
        }
      }
    }
  }

  /**
   * Process individual sync queue item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    // This would integrate with the DatabaseService to perform the actual sync
    console.log(`Syncing ${item.operation} for ${item.collection}:`, item.id);
    
    // Simulate sync operation (shorter delay for tests)
    await new Promise(resolve => setTimeout(resolve, 10));
    
    console.log(`Successfully synced item ${item.id}`);
  }

  /**
   * Generate unique ID for sync queue items
   */
  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get sync queue status
   */
  getSyncQueueStatus(): {
    queueLength: number;
    oldestItem: Date | null;
    newestItem: Date | null;
  } {
    if (this.syncQueue.length === 0) {
      return {
        queueLength: 0,
        oldestItem: null,
        newestItem: null
      };
    }

    const timestamps = this.syncQueue.map(item => item.timestamp);
    return {
      queueLength: this.syncQueue.length,
      oldestItem: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      newestItem: new Date(Math.max(...timestamps.map(t => t.getTime())))
    };
  }

  /**
   * Clear sync queue (use with caution)
   */
  clearSyncQueue(): void {
    const clearedCount = this.syncQueue.length;
    this.syncQueue = [];
    console.log(`Cleared ${clearedCount} items from sync queue`);
  }
}

/**
 * Cache manager for offline data storage
 */
export class OfflineCacheManager {
  private static instance: OfflineCacheManager;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: OfflineConfig;

  private constructor(config: OfflineConfig) {
    this.config = config;
  }

  /**
   * Get singleton instance of OfflineCacheManager
   */
  static getInstance(config: OfflineConfig): OfflineCacheManager {
    if (!OfflineCacheManager.instance) {
      OfflineCacheManager.instance = new OfflineCacheManager(config);
    }
    return OfflineCacheManager.instance;
  }

  /**
   * Store data in cache with expiration
   */
  set<T>(key: string, data: T, source: 'network' | 'cache' = 'network'): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (this.config.cacheExpirationHours * 60 * 60 * 1000));

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
      source
    };

    this.cache.set(key, entry);
    this.cleanupExpiredEntries();
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry as CacheEntry<T>;
  }

  /**
   * Check if data exists in cache and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove data from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    expiredEntries: number;
    cacheHitRate: number;
    estimatedSizeMB: number;
  } {
    const totalEntries = this.cache.size;
    let expiredEntries = 0;
    let estimatedSize = 0;

    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      }
      
      // Rough estimation of memory usage
      estimatedSize += JSON.stringify(entry).length;
    }

    return {
      totalEntries,
      expiredEntries,
      cacheHitRate: 0, // Would need to track hits/misses for accurate calculation
      estimatedSizeMB: estimatedSize / (1024 * 1024)
    };
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredEntries(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }
}

/**
 * Utility functions for offline behavior
 */
export class OfflineUtils {
  /**
   * Create cache key for database operations
   */
  static createCacheKey(collection: string, query: Record<string, any>): string {
    const queryString = JSON.stringify(query, Object.keys(query).sort());
    return `${collection}:${Buffer.from(queryString).toString('base64')}`;
  }

  /**
   * Check if operation should use cache based on offline state
   */
  static shouldUseCache(isOffline: boolean, cacheEntry: CacheEntry<any> | null): boolean {
    if (isOffline) {
      return cacheEntry !== null;
    }
    
    // When online, use cache if it's fresh (less than 5 minutes old)
    if (cacheEntry) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return cacheEntry.timestamp > fiveMinutesAgo;
    }
    
    return false;
  }

  /**
   * Create offline-friendly error message
   */
  static createOfflineErrorMessage(operation: string): string {
    return `Unable to ${operation} while offline. The operation has been queued and will be processed when connection is restored.`;
  }

  /**
   * Determine if operation can be performed offline
   */
  static canPerformOffline(operation: 'create' | 'read' | 'update' | 'delete'): boolean {
    // Read operations can always be performed offline (from cache)
    // Write operations can be queued for later sync
    return true;
  }

  /**
   * Get user-friendly offline status message
   */
  static getOfflineStatusMessage(isOffline: boolean, queueLength: number): string {
    if (!isOffline) {
      return queueLength > 0 
        ? `Online - Syncing ${queueLength} pending operations`
        : 'Online - All data synchronized';
    }
    
    return queueLength > 0
      ? `Offline - ${queueLength} operations queued for sync`
      : 'Offline - Limited functionality available';
  }
}

// Export singleton instances for easy access
export const offlineManager = OfflineManager.getInstance();
export const offlineCacheManager = OfflineCacheManager.getInstance({
  enableOfflineMode: true,
  maxCacheSize: 50,
  cacheExpirationHours: 24,
  syncRetryAttempts: 3,
  syncRetryDelayMs: 5000
});