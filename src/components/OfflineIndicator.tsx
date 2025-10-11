/**
 * Offline Indicator Component for SMARTIES application
 * Implements Requirement 5.4 for offline mode UI feedback
 * 
 * Features:
 * - Real-time offline status display
 * - Sync queue status information
 * - User-friendly offline messaging
 * - Accessibility support
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { offlineManager, OfflineUtils } from '../utils/offline';
import { databaseService } from '../services/DatabaseService';

/**
 * Props for OfflineIndicator component
 */
interface OfflineIndicatorProps {
  style?: any;
  showDetails?: boolean;
  onPress?: () => void;
}

/**
 * Offline status information
 */
interface OfflineStatus {
  isOffline: boolean;
  queueLength: number;
  message: string;
  networkType: string | null;
}

/**
 * OfflineIndicator component displays current offline status and sync information
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  style,
  showDetails = false,
  onPress
}) => {
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus>({
    isOffline: false,
    queueLength: 0,
    message: 'Checking connection...',
    networkType: null
  });

  useEffect(() => {
    // Update initial status
    updateOfflineStatus();

    // Listen for offline state changes
    const unsubscribe = offlineManager.addOfflineListener((isOffline) => {
      updateOfflineStatus();
    });

    // Set up periodic status updates
    const statusInterval = setInterval(updateOfflineStatus, 5000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, []);

  /**
   * Update offline status information
   */
  const updateOfflineStatus = async () => {
    try {
      const dbStatus = databaseService.getOfflineStatus();
      const networkState = offlineManager.getNetworkState();
      const syncStatus = offlineManager.getSyncQueueStatus();

      const status: OfflineStatus = {
        isOffline: dbStatus.isOffline,
        queueLength: syncStatus.queueLength,
        message: OfflineUtils.getOfflineStatusMessage(dbStatus.isOffline, syncStatus.queueLength),
        networkType: networkState.type
      };

      setOfflineStatus(status);
    } catch (error) {
      console.error('Failed to update offline status:', error);
      setOfflineStatus(prev => ({
        ...prev,
        message: 'Status unavailable'
      }));
    }
  };

  /**
   * Handle indicator press
   */
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default action: force sync if online
      if (!offlineStatus.isOffline && offlineStatus.queueLength > 0) {
        databaseService.forceSyncQueuedOperations();
      }
    }
  };

  /**
   * Get indicator color based on status
   */
  const getIndicatorColor = (): string => {
    if (offlineStatus.isOffline) {
      return offlineStatus.queueLength > 0 ? '#FF9500' : '#FF3B30'; // Orange or Red
    }
    return offlineStatus.queueLength > 0 ? '#007AFF' : '#34C759'; // Blue or Green
  };

  /**
   * Get indicator text color for accessibility
   */
  const getTextColor = (): string => {
    return '#FFFFFF'; // White text for all backgrounds
  };

  // Don't render if online and no queue
  if (!offlineStatus.isOffline && offlineStatus.queueLength === 0 && !showDetails) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: getIndicatorColor() },
        style
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Network status: ${offlineStatus.message}`}
      accessibilityHint={
        offlineStatus.isOffline 
          ? "Tap for offline mode details"
          : offlineStatus.queueLength > 0 
            ? "Tap to sync pending operations"
            : "Network connection is stable"
      }
    >
      <View style={styles.content}>
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot,
            { backgroundColor: offlineStatus.isOffline ? '#FFFFFF' : '#FFFFFF' }
          ]} />
          <Text style={[styles.statusText, { color: getTextColor() }]}>
            {offlineStatus.isOffline ? 'Offline' : 'Online'}
          </Text>
        </View>

        <Text style={[styles.messageText, { color: getTextColor() }]}>
          {offlineStatus.message}
        </Text>

        {showDetails && (
          <View style={styles.detailsContainer}>
            {offlineStatus.networkType && (
              <Text style={[styles.detailText, { color: getTextColor() }]}>
                Network: {offlineStatus.networkType.toUpperCase()}
              </Text>
            )}
            {offlineStatus.queueLength > 0 && (
              <Text style={[styles.detailText, { color: getTextColor() }]}>
                Pending: {offlineStatus.queueLength} operations
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/**
 * Compact offline banner for minimal UI impact
 */
export const OfflineBanner: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  return (
    <OfflineIndicator
      style={styles.banner}
      showDetails={false}
      onPress={onPress}
    />
  );
};

/**
 * Detailed offline status card for settings or debug screens
 */
export const OfflineStatusCard: React.FC<{ onPress?: () => void }> = ({ onPress }) => {
  return (
    <OfflineIndicator
      style={styles.card}
      showDetails={true}
      onPress={onPress}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  banner: {
    borderRadius: 0,
    marginHorizontal: 0,
    marginVertical: 0,
    paddingVertical: 12,
  },
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
  },
  content: {
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
  detailsContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  detailText: {
    fontSize: 11,
    opacity: 0.8,
    marginVertical: 1,
  },
});

export default OfflineIndicator;