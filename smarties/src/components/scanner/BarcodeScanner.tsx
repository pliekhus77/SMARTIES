import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';

export interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeScanned,
  onError,
  onClose,
}) => {
  const [manualBarcode, setManualBarcode] = useState('');

  const handleManualScan = () => {
    if (manualBarcode.trim()) {
      onBarcodeScanned(manualBarcode.trim());
    } else {
      onError?.('Please enter a barcode');
    }
  };

  const handleTestScan = (testBarcode: string) => {
    onBarcodeScanned(testBarcode);
  };

  return (
    <View style={styles.container}>
      {/* Mock camera view */}
      <View style={styles.cameraView}>
        <View style={styles.scanFrame}>
          <Text style={styles.scanFrameText}>📷 Mock Camera View</Text>
          <Text style={styles.instructionText}>
            Development Mode - Use buttons below to simulate scanning
          </Text>
        </View>
      </View>
      
      {/* Manual barcode input */}
      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Enter Barcode Manually:</Text>
        <TextInput
          style={styles.input}
          value={manualBarcode}
          onChangeText={setManualBarcode}
          placeholder="Enter UPC barcode (e.g., 123456789012)"
          placeholderTextColor="#999"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.scanButton} onPress={handleManualScan}>
          <Text style={styles.scanButtonText}>Scan Manual Code</Text>
        </TouchableOpacity>
      </View>

      {/* Test barcodes */}
      <View style={styles.testSection}>
        <Text style={styles.testLabel}>Test Barcodes:</Text>
        <View style={styles.testButtons}>
          <TouchableOpacity 
            style={[styles.testButton, styles.safeButton]} 
            onPress={() => handleTestScan('123456789012')}
          >
            <Text style={styles.testButtonText}>Safe Product</Text>
            <Text style={styles.testButtonSubtext}>123456789012</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.testButton, styles.warningButton]} 
            onPress={() => handleTestScan('987654321098')}
          >
            <Text style={styles.testButtonText}>Contains Allergens</Text>
            <Text style={styles.testButtonSubtext}>987654321098</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.testButton, styles.dangerButton]} 
            onPress={() => handleTestScan('555666777888')}
          >
            <Text style={styles.testButtonText}>Multiple Violations</Text>
            <Text style={styles.testButtonSubtext}>555666777888</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close Scanner</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  scanFrame: {
    width: 280,
    height: 180,
    borderWidth: 3,
    borderColor: '#1168bd',
    borderRadius: 15,
    backgroundColor: 'rgba(17, 104, 189, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanFrameText: {
    color: '#1168bd',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    margin: 15,
    borderRadius: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  scanButton: {
    backgroundColor: '#1168bd',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    margin: 15,
    marginTop: 0,
    borderRadius: 15,
  },
  testLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  testButtons: {
    gap: 10,
  },
  testButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  safeButton: {
    backgroundColor: '#2ECC40',
  },
  warningButton: {
    backgroundColor: '#FFDC00',
  },
  dangerButton: {
    backgroundColor: '#FF4136',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  testButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  controls: {
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});