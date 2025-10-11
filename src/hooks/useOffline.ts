/**
 * useOffline hook for SMARTIES application
 * Implements Requirement 5.4 for offline state management in React components
 * 
 * Features:
 * - Real-time offline state tracking
 * - Network state information
 * - Sync queue status
 * - Cache statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineManager, OfflineUtils } from '../utils/offline';
import { databaseService } from '../services/DatabaseService';

/**
 * Offline hook state interface
 */
export interface UseOfflineState {
  isOffline: boolean;
  networkState: {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    type: string | null;
  };
  syncQueue: {
    length: number;
    oldestItem: Date | null;
    newestItem: Date | null;
  };
  cache: {
    totalEntries: number;
    estimatedSizeMB: number;
  };
  lastUpdated: Date;
}

/**
 * Offline hook return interface
 */
export interface UseOfflineReturn extends UseOfflineState {
  // Actions
  checkNetworkState: () => Promise<void>;
  forceSyncQueue: () => Promise<void>;
  clearCache: () => void;
  
  // Utilities
  getStatusMessage: () => string;
  canPerformOperation: (operation: 'create' | 'read' | 'update' | 'delete') => boolean;
  shouldShowOfflineIndicator: () => boolean;
}

/**
 * Custom hook for managing offline state and operations
 */
export const useOffline = (): UseOfflineReturn => {
  const [state, setState] = useState<UseOfflineState>({
    isOffline: false,
    networkState: {
      isConnected: false,
      isInternetReachable: null,
      type: null,
    },
    syncQueue: {
      length: 0,
      oldestItem: null,
      newestItem: null,
    },
    cache: {
      totalEntries: 0,
      estimatedSizeMB: 0,
    },
    lastUpdated: new Date(),
  });

  /**
   * Update offline state from managers
   */
  const updateState = useCallback(async () => {
    try {
      const dbStatus = databaseService.getOfflineStatus();
      const networkState = offlineManager.getNetworkState();
      const syncStatus = offlineManager.getSyncQueueStatus();

      setState({
        isOffline: dbStatus.isOffline,
        networkState: {
          isConnected: networkState.isConnected,
          isInternetReachable: networkState.isInternetReachable,
          type: networkState.type,
        },
        syncQueue: {
          length: syncStatus.queueLength,
          oldestItem: syncStatus.oldestItem,
          newestItem: syncStatus.newestItem,
        },
        cache: {
          totalEntries: dbStatus.cacheStats.totalEntries,
          estimatedSizeMB: dbStatus.cacheStats.estimatedSizeMB,
        },
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Failed to update offline state:', error);
    }
  }, []);

  /**
   * Check network state manually
   */
  const checkNetworkState = useCallback(async () => {
    try {
      await offlineManager.checkNetworkState();
      await updateState();
    } catch (error) {
      console.error('Failed to check network state:', error);
    }
  }, [updateState]);

  /**
   * Force sync of queued operations
   */
  const forceSyncQueue = useCallback(async () => {
    try {
      await databaseService.forceSyncQueuedOperations();
      await updateState();
    } catch (error) {
      console.error('Failed to force sync queue:', error);
    }
  }, [updateState]);

  /**
   * Clear offline cache
   */
  const clearCache = useCallback(() => {
    try {
      databaseService.clearOfflineCache();
      updateState();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }, [updateState]);

  /**
   * Get user-friendly status message
   */
  const getStatusMessage = useCallback((): string => {
    return OfflineUtils.getOfflineStatusMessage(state.isOffline, state.syncQueue.length);
  }, [state.isOffline, state.syncQueue.length]);

  /**
   * Check if operation can be performed in current state
   */
  const canPerformOperation = useCallback((operation: 'create' | 'read' | 'update' | 'delete'): boolean => {
    return OfflineUtils.canPerformOffline(operation);
  }, []);

  /**
   * Determine if offline indicator should be shown
   */
  const shouldShowOfflineIndicator = useCallback((): boolean => {
    return state.isOffline || state.syncQueue.length > 0;
  }, [state.isOffline, state.syncQueue.length]);

  // Set up offline state monitoring
  useEffect(() => {
    // Initial state update
    updateState();

    // Listen for offline state changes
    const unsubscribe = offlineManager.addOfflineListener(() => {
      updateState();
    });

    // Periodic state updates
    const interval = setInterval(updateState, 10000); // Update every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [updateState]);

  return {
    ...state,
    checkNetworkState,
    forceSyncQueue,
    clearCache,
    getStatusMessage,
    canPerformOperation,
    shouldShowOfflineIndicator,
  };
};

/**
 * Simplified hook for basic offline state
 */
export const useOfflineState = (): {
  isOffline: boolean;
  hasQueuedOperations: boolean;
  statusMessage: string;
} => {
  const { isOffline, syncQueue, getStatusMessage } = useOffline();

  return {
    isOffline,
    hasQueuedOperations: syncQueue.length > 0,
    statusMessage: getStatusMessage(),
  };
};

/**
 * Hook for network state only
 */
export const useNetworkState = (): {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  networkType: string | null;
  checkConnection: () => Promise<void>;
} => {
  const { networkState, checkNetworkState } = useOffline();

  return {
    isConnected: networkState.isConnected,
    isInternetReachable: networkState.isInternetReachable,
    networkType: networkState.type,
    checkConnection: checkNetworkState,
  };
};

export default useOffline;