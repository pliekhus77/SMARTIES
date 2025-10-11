import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarcodeScanner } from '../components/scanner';
import { BarcodeScanner as BarcodeScannerService } from '../services/barcode';

/**
 * Primary barcode scanning interface
 * This screen contains the main barcode scanning functionality
 */
export const ScanScreen: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  
  const barcodeService = new BarcodeScannerService();

  const handleScanPress = () => {
    setIsScanning(true);
  };

  const handleBarcodeScanned = (barcode: string) => {
    try {
      // Process the scanned barcode
      const processedBarcode = barcodeService.processScanResult({
        type: 'upc',
        data: barcode
      });

      if (processedBarcode) {
        setLastScannedBarcode(processedBarcode);
        setIsScanning(false);
        
        // Show success message with scanned barcode
        Alert.alert(
          'Barcode Scanned Successfully!',
          `UPC: ${processedBarcode}\n\nNext: Product lookup and dietary analysis will be implemented in the next phase.`,
          [
            { text: 'Scan Another', onPress: () => setIsScanning(true) },
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        handleScanError('Invalid barcode format');
      }
    } catch (error) {
      console.error('Error processing scanned barcode:', error);
      handleScanError('Failed to process barcode');
    }
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
    Alert.alert('Scan Error', error, [
      { text: 'Try Again', onPress: () => setIsScanning(true) },
      { text: 'Cancel', onPress: () => setIsScanning(false) }
    ]);
  };

  const handleCloseScanner = () => {
    setIsScanning(false);
  };

  if (isScanning) {
    return (
      <BarcodeScanner
        onBarcodeScanned={handleBarcodeScanned}
        onError={handleScanError}
        onClose={handleCloseScanner}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.scanArea}>
          <Text style={styles.title}>Ready to Scan</Text>
          <Text style={styles.subtitle}>
            Point your camera at a product barcode to check for dietary restrictions
          </Text>
          
          {lastScannedBarcode && (
            <View style={styles.lastScanContainer}>
              <Text style={styles.lastScanLabel}>Last scanned:</Text>
              <Text style={styles.lastScanBarcode}>{lastScannedBarcode}</Text>
            </View>
          )}
          
          <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
            <Text style={styles.scanButtonText}>Start Scanning</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>How to use:</Text>
          <Text style={styles.instructionText}>1. Tap "Start Scanning" above</Text>
          <Text style={styles.instructionText}>2. Point camera at product barcode</Text>
          <Text style={styles.instructionText}>3. Get instant dietary compliance results</Text>
        </View>
      </View>
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
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1168bd',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  lastScanContainer: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#1168bd',
  },
  lastScanLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  lastScanBarcode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1168bd',
    fontFamily: 'monospace',
  },
  scanButton: {
    backgroundColor: '#1168bd',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#1168bd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});