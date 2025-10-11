import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    try {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        const errorMsg = 'Camera permission is required to scan barcodes';
        onError?.(errorMsg);
        Alert.alert('Permission Required', errorMsg);
      }
    } catch (error) {
      const errorMsg = 'Failed to request camera permissions';
      console.error('Camera permission error:', error);
      onError?.(errorMsg);
      Alert.alert('Error', errorMsg);
    }
  };

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    try {
      // Validate UPC format
      if (isValidUPC(data)) {
        onBarcodeScanned(data);
      } else {
        const errorMsg = 'Invalid barcode format. Please try scanning a UPC barcode.';
        onError?.(errorMsg);
        Alert.alert('Invalid Barcode', errorMsg, [
          { text: 'Try Again', onPress: () => setScanned(false) }
        ]);
      }
    } catch (error) {
      const errorMsg = 'Error processing barcode scan';
      console.error('Barcode processing error:', error);
      onError?.(errorMsg);
      Alert.alert('Scan Error', errorMsg, [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    }
  };

  const isValidUPC = (barcode: string): boolean => {
    // UPC-A: 12 digits, UPC-E: 8 digits, EAN-13: 13 digits
    const upcPattern = /^(\d{8}|\d{12}|\d{13})$/;
    return upcPattern.test(barcode);
  };



  const resetScanner = () => {
    setScanned(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={getCameraPermissions}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.scanner}
        barCodeTypes={[
          BarCodeScanner.Constants.BarCodeType.upc_a,
          BarCodeScanner.Constants.BarCodeType.upc_e,
          BarCodeScanner.Constants.BarCodeType.ean13,
          BarCodeScanner.Constants.BarCodeType.ean8,
        ]}
      />
      
      {/* Scanning overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={styles.scanFrame} />
        </View>
        
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {scanned ? 'Barcode scanned!' : 'Point camera at barcode'}
          </Text>
        </View>
        
        <View style={styles.controls}>
          {scanned && (
            <TouchableOpacity style={styles.controlButton} onPress={resetScanner}>
              <Text style={styles.controlButtonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
          
          {onClose && (
            <TouchableOpacity style={styles.controlButton} onPress={onClose}>
              <Text style={styles.controlButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanner: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 50,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#1168bd',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  instructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(17, 104, 189, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1168bd',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});