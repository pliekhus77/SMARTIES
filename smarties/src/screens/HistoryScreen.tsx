import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDatabase } from '../hooks/useDatabase';
import { ScanResult } from '../../../src/types/ScanResult';

/**
 * Scan history and analytics screen
 * Task 7.3: Database service integration
 * This screen displays user's scan history with database operations
 */
export const HistoryScreen: React.FC = () => {
  const { isLoading: dbLoading, error: dbError, executeOperation } = useDatabase();
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [stats, setStats] = useState({
    totalScans: 0,
    safeProducts: 0,
    warnings: 0,
  });

  useEffect(() => {
    loadScanHistory();
  }, []);

  const loadScanHistory = async () => {
    setIsLoadingHistory(true);
    const result = await executeOperation(async (db) => {
      return await db.read<ScanResult>('scan_results', {});
    });

    if (result.success && result.data) {
      setScanHistory(result.data);
      calculateStats(result.data);
    }
    setIsLoadingHistory(false);
  };

  const calculateStats = (scans: ScanResult[]) => {
    const totalScans = scans.length;
    const safeProducts = scans.filter(scan => scan.complianceStatus === 'safe').length;
    const warnings = scans.filter(scan => scan.complianceStatus === 'caution').length;
    
    setStats({ totalScans, safeProducts, warnings });
  };

  const handleViewDetails = (scanId: string) => {
    console.log('View details for scan:', scanId);
  };

  const handleClearHistory = async () => {
    const result = await executeOperation(async (db) => {
      return await db.delete('scan_results', {});
    });

    if (result.success) {
      setScanHistory([]);
      setStats({ totalScans: 0, safeProducts: 0, warnings: 0 });
    }
  };

  const renderScanItem = ({ item }: { item: ScanResult }) => (
    <View style={styles.scanItem}>
      <View style={styles.scanHeader}>
        <Text style={styles.scanDate}>
          {new Date(item.scanTimestamp).toLocaleDateString()}
        </Text>
        <View style={[
          styles.statusBadge,
          item.complianceStatus === 'safe' && styles.safeBadge,
          item.complianceStatus === 'violation' && styles.violationBadge,
          item.complianceStatus === 'caution' && styles.warningBadge,
        ]}>
          <Text style={styles.statusText}>{item.complianceStatus.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.scanInfo}>Product ID: {item.productId}</Text>
      <Text style={styles.scanInfo}>Status: {item.complianceStatus}</Text>
      {item.violations.length > 0 && (
        <Text style={styles.violationText}>
          {item.violations.length} violation(s) detected
        </Text>
      )}
      <TouchableOpacity 
        style={styles.detailsButton} 
        onPress={() => handleViewDetails(item._id || '')}
      >
        <Text style={styles.detailsButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  if (dbLoading || isLoadingHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1168bd" />
          <Text style={styles.loadingText}>Loading scan history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (dbError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Database Error: {dbError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadScanHistory}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <Text style={styles.title}>Scan Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalScans}</Text>
              <Text style={styles.statLabel}>Total Scans</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.safeProducts}</Text>
              <Text style={styles.statLabel}>Safe Products</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.warnings}</Text>
              <Text style={styles.statLabel}>Warnings</Text>
            </View>
          </View>
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Recent Scans</Text>
            {scanHistory.length > 0 && (
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={styles.clearButton}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {scanHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No scans yet</Text>
              <Text style={styles.emptySubtext}>Start scanning products to see your history here</Text>
            </View>
          ) : (
            <FlatList
              data={scanHistory}
              renderItem={renderScanItem}
              keyExtractor={(item) => item._id || item.upc + item.scanTimestamp.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1168bd',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1168bd',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  scanItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 15,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scanDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  safeBadge: {
    backgroundColor: '#4caf50',
  },
  violationBadge: {
    backgroundColor: '#f44336',
  },
  warningBadge: {
    backgroundColor: '#ff9800',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  scanInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  violationText: {
    fontSize: 12,
    color: '#f44336',
    marginBottom: 8,
  },
  detailsButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1168bd',
    borderRadius: 6,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
