import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BarcodeScanner as BarcodeScannerService } from '../services/barcode';
import { ProductSearchService } from '../services/ProductSearchService';

// Conditional import for expo-barcode-scanner with fallback
let BarCodeScanner: any = null;
try {
  BarCodeScanner = require('expo-barcode-scanner').BarCodeScanner;
} catch (error) {
  console.log('expo-barcode-scanner not available, using mock scanner');
}

/**
 * Primary barcode scanning interface
 * This screen contains the main barcode scanning functionality with camera viewfinder
 */
export const ScanScreen: React.FC = () => {
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isNativeAvailable, setIsNativeAvailable] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const navigation = useNavigation();

  const barcodeService = new BarcodeScannerService();
  const productSearchService = new ProductSearchService();

  useEffect(() => {
    const checkNativeModule = async () => {
      if (BarCodeScanner) {
        try {
          const { status } = await BarCodeScanner.requestPermissionsAsync();
          setHasPermission(status === 'granted');
          setIsNativeAvailable(true);
        } catch (error) {
          console.log('Native barcode scanner not available, using mock');
          setIsNativeAvailable(false);
          setHasPermission(true); // Allow mock scanner to work
        }
      } else {
        setIsNativeAvailable(false);
        setHasPermission(true); // Allow mock scanner to work
      }
    };

    checkNativeModule();
  }, []);

  const handleCapturePress = () => {
    if (isNativeAvailable) {
      // Reset scanned state to allow new scans
      setScanned(false);
    } else {
      // Mock barcode scanning for development
      const mockBarcode = '6111037000599';
      handleBarcodeScanned(mockBarcode);
    }
  };

  const handleBarCodeScanned = ({ data }: { type: string; data: string }) => {
    setScanned(true);
    handleBarcodeScanned(data);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      // Process the scanned barcode
      const processedBarcode = barcodeService.processScanResult({
        type: 'upc',
        data: barcode
      });

      if (processedBarcode) {
        setLastScannedBarcode(processedBarcode);
        setIsSearching(true);

        // Perform product search and allergen analysis
        const searchResult = await productSearchService.searchAndAnalyze(processedBarcode);

        setIsSearching(false);

        if (searchResult.success && searchResult.product && searchResult.analysisResult) {
          // Navigate to appropriate result screen based on severity
          const { product, analysisResult } = searchResult;
          
          switch (analysisResult.severity) {
            case 'severe':
              navigation.navigate('SevereAllergyResultScreen' as never, {
                product: {
                  upc: product.upc,
                  name: product.name,
                  brand: product.brand
                },
                violation: {
                  allergen: analysisResult.violations[0]?.allergen || 'Unknown',
                  riskLevel: analysisResult.riskLevel
                }
              });
              break;
              
            case 'mild':
              navigation.navigate('MildWarningResultScreen' as never, {
                product: {
                  upc: product.upc,
                  name: product.name,
                  brand: product.brand
                },
                violations: analysisResult.violations.map((v: any) => ({
                  allergen: v.allergen,
                  type: v.type
                }))
              });
              break;
              
            case 'safe':
            default:
              navigation.navigate('AllClearResultScreen' as never, {
                product: {
                  upc: product.upc,
                  name: product.name,
                  brand: product.brand
                }
              });
              break;
          }
        } else {
          // Show error message
          Alert.alert(
            'Product Not Found',
            searchResult.error || 'Unable to find product information for this barcode.',
            [
              { text: 'Try Again', style: 'default' },
              { text: 'Manual Entry', style: 'default' }
            ]
          );
        }
      } else {
        handleScanError('Invalid barcode format');
      }
    } catch (error) {
      console.error('Error processing scanned barcode:', error);
      setIsSearching(false);
      handleScanError('Failed to process barcode');
    }
  };

  const handleScanError = (error: string) => {
    console.error('Scan error:', error);
    Alert.alert('Scan Error', error, [
      { text: 'Try Again', style: 'default' },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleCancelPress = () => {
    // Navigate back to home screen
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/smarties-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>SCAN BARCODE</Text>
        </View>

        {/* Camera Viewfinder Area */}
        <View style={styles.cameraContainer}>
        {hasPermission === null ? (
          <View style={styles.cameraView}>
            <Text style={styles.permissionText}>Requesting camera permission...</Text>
          </View>
        ) : hasPermission === false && isNativeAvailable ? (
          <View style={styles.cameraView}>
            <Text style={styles.permissionText}>No access to camera</Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={() => BarCodeScanner?.requestPermissionsAsync()}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraView}>
            {isNativeAvailable && BarCodeScanner ? (
              <BarCodeScanner
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={styles.camera}
              />
            ) : null}
            {/* Viewfinder overlay */}
            <View style={styles.viewfinderOverlay}>
              <View style={styles.viewfinderContainer}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {/* Barcode target area */}
                <View style={styles.barcodeTarget}>
                  {!isNativeAvailable && (
                    <View style={styles.barcodeLines}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <View key={i} style={[styles.barcodeLine, { width: i % 3 === 0 ? 4 : 2 }]} />
                      ))}
                    </View>
                  )}
                  <Text style={styles.scanInstructions}>
                    {isNativeAvailable
                      ? (scanned ? 'Barcode Scanned!' : 'Position barcode in frame')
                      : 'Development Mode - Tap button to simulate scan'
                    }
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Capture Buttons */}
      <View style={styles.captureContainer}>
        <TouchableOpacity
          style={[styles.captureButton, scanned && styles.captureButtonScanned]}
          onPress={handleCapturePress}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="large" color="#1E88E5" />
          ) : (
            <Ionicons name={scanned ? "refresh" : "camera"} size={32} color="#1E88E5" />
          )}
          <Text style={styles.captureButtonText}>
            {isSearching
              ? 'Searching...'
              : isNativeAvailable
              ? (scanned ? 'Scan Another' : 'Ready to Scan')
              : 'Simulate Scan'
            }
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelPress}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        {/* Test UPC Buttons */}
        <View style={styles.testUpcContainer}>
          <Text style={styles.testUpcTitle}>Test Products</Text>
          <View style={styles.testUpcGrid}>
            <TouchableOpacity 
              style={[styles.testUpcButton, isSearching && styles.testUpcButtonDisabled]} 
              onPress={() => handleBarcodeScanned('123456789012')}
              disabled={isSearching}
            >
              <Text style={[styles.testUpcButtonText, isSearching && styles.testUpcButtonTextDisabled]}>Organic Milk</Text>
              <Text style={[styles.testUpcSubText, isSearching && styles.testUpcButtonTextDisabled]}>123456789012</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.testUpcButton, isSearching && styles.testUpcButtonDisabled]} 
              onPress={() => handleBarcodeScanned('987654321098')}
              disabled={isSearching}
            >
              <Text style={[styles.testUpcButtonText, isSearching && styles.testUpcButtonTextDisabled]}>Peanut Cookies</Text>
              <Text style={[styles.testUpcSubText, isSearching && styles.testUpcButtonTextDisabled]}>987654321098</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

        {/* Last scanned result */}
        {lastScannedBarcode && (
          <View style={styles.lastScanContainer}>
            <Text style={styles.lastScanLabel}>Last scanned:</Text>
            <Text style={styles.lastScanBarcode}>{lastScannedBarcode}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E88E5', // Changed to match home screen blue
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%', // Ensure content takes at least full screen height
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 15,
  },
  logo: {
    width: 120, // Smaller than home screen for scan interface
    height: 120,
  },
  title: {
    fontSize: 28, // Slightly smaller to accommodate logo
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  cameraContainer: {
    minHeight: 400, // Fixed height instead of flex to ensure proper scrolling
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  cameraView: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  viewfinderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinderContainer: {
    width: '80%',
    aspectRatio: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  barcodeTarget: {
    width: 200,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  scanInstructions: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 10,
  },
  barcodeLine: {
    height: 40,
    backgroundColor: '#fff',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  captureContainer: {
    paddingVertical: 20, // Reduced from 40 to 20
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 280,
    marginBottom: 15,
  },
  captureButtonScanned: {
    backgroundColor: '#2ECC40', // Green when scanned
  },
  captureButtonText: {
    color: '#1E88E5', // Use blue color to match theme
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Match home screen recent scans background
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 280,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastScanContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Match home screen recent scans
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 20, // Match home screen border radius
    borderLeftWidth: 4,
    borderLeftColor: '#fff',
  },
  lastScanLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  lastScanBarcode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  testUpcContainer: {
    marginTop: 20,
    width: '100%',
    paddingBottom: 40, // Extra padding at bottom for better scrolling experience
  },
  testUpcTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.8,
  },
  testUpcGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  testUpcButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '48%', // Two columns with gap
    minHeight: 70,
  },
  testUpcButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  testUpcSubText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  testUpcButtonDisabled: {
    opacity: 0.5,
  },
  testUpcButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
});