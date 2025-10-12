/**
 * Scan Screen with Product Search Integration
 * Implements Requirements 1.1, 1.3, 1.4, 2.5, 3.1, 4.1, 5.1 from SMARTIES API integration specification
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import { ProductService } from '../services/api/ProductService';
import { AllergenService } from '../services/AllergenService';
import { HistoryService } from '../services/HistoryService';
import { SmartiesAPIClient } from '../services/api/SmartiesAPIClient';
import { UserProfile } from '../types/core';

interface Props {
  userProfile: UserProfile;
}

export const ScanScreen: React.FC<Props> = ({ userProfile }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation();

  // Initialize services
  const apiClient = new SmartiesAPIClient();
  const productService = new ProductService(apiClient);
  const allergenService = new AllergenService();
  const historyService = new HistoryService();

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned || isLoading) return;

    setScanned(true);
    setIsLoading(true);

    try {
      // Search for product
      const product = await productService.searchByUPC(data);
      
      if (!product) {
        Alert.alert(
          'Product Not Found',
          'This product is not in our database. Would you like to try again?',
          [
            { text: 'Try Again', onPress: () => setScanned(false) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        setIsLoading(false);
        return;
      }

      // Analyze for allergens
      const analysis = allergenService.analyzeProduct(product, userProfile);

      // Save to history
      await historyService.saveScanResult(product, analysis, userProfile.id);

      // Navigate to appropriate result screen
      navigateToResultScreen(product, analysis);

    } catch (error) {
      console.error('Scan processing failed:', error);
      Alert.alert(
        'Error',
        'Failed to process the scanned product. Please try again.',
        [
          { text: 'Retry', onPress: () => setScanned(false) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToResultScreen = (product: any, analysis: any) => {
    const screenParams = { product, analysis };

    switch (analysis.severity) {
      case 'severe':
        navigation.navigate('SevereAllergy', {
          ...screenParams,
          onSaveToHistory: () => console.log('Already saved'),
          onReportIssue: () => navigation.navigate('ReportIssue', screenParams),
          onGoBack: () => {
            setScanned(false);
            navigation.goBack();
          }
        });
        break;
      case 'mild':
        navigation.navigate('MildWarning', {
          ...screenParams,
          onSaveToHistory: () => console.log('Already saved'),
          onReportIssue: () => navigation.navigate('ReportIssue', screenParams),
          onGoBack: () => {
            setScanned(false);
            navigation.goBack();
          }
        });
        break;
      case 'safe':
      default:
        navigation.navigate('AllClear', {
          ...screenParams,
          onDone: () => {
            setScanned(false);
            navigation.goBack();
          },
          onSaveToHistory: () => console.log('Already saved')
        });
        break;
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No access to camera</Text>
        <Text style={styles.helpText}>Please enable camera permissions in settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarcodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instructionText}>
          Point camera at barcode to scan
        </Text>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Analyzing product...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  helpText: {
    color: 'gray',
    fontSize: 14,
    textAlign: 'center',
  },
});
