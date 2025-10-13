import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView } from '../components/scanner/CameraView';
import { ManualEntryModal } from '../components/scanner/ManualEntryModal';
import { ProductNotFound } from '../components/product/ProductNotFound';
import { ScanOrchestrationService } from '../services/scan/ScanOrchestrationService';
import { NetworkService } from '../services/network/NetworkService';
import { ErrorHandlingService, ErrorType } from '../services/error/ErrorHandlingService';
import { BarcodeResult, DetectionError } from '../types/barcode';

export const ScanScreen: React.FC = () => {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showProductNotFound, setShowProductNotFound] = useState(false);
  const [currentBarcode, setCurrentBarcode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  const navigation = useNavigation();
  const scanService = new ScanOrchestrationService();
  const networkService = new NetworkService();
  const errorService = new ErrorHandlingService();

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = networkService.addListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  const handleBarcodeDetected = async (result: BarcodeResult) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setCurrentBarcode(result.normalized);

    try {
      // Process the scan with retry logic
      const scanResult = await errorService.retryWithExponentialBackoff(
        () => scanService.processScan(result),
        3,
        1000
      );
      
      if (!scanResult.success) {
        if (scanResult.error?.includes('not found')) {
          setShowProductNotFound(true);
        } else {
          const errorInfo = errorService.handleError(
            ErrorType.API_ERROR,
            scanResult.error || 'Failed to process barcode',
            undefined,
            { barcode: result.normalized }
          );

          const recoveryActions = errorService.getRecoveryActions(errorInfo);
          recoveryActions[0].action = () => handleRetryBarcode(result); // Set retry action

          errorService.showErrorDialog(errorInfo, recoveryActions);
        }
        return;
      }

      if (!scanResult.product) {
        const errorInfo = errorService.handleError(
          ErrorType.API_ERROR,
          'No product data received',
          undefined,
          { barcode: result.normalized }
        );
        errorService.showErrorDialog(errorInfo);
        return;
      }

      // Reset retry count on success
      setRetryCount(0);

      // Analyze dietary compliance (mock user restrictions for now)
      const userRestrictions = ['milk', 'gluten', 'vegan']; // This would come from user profile
      const analysisResult = await scanService.analyzeDietaryCompliance(
        scanResult.product,
        userRestrictions
      );

      // Add to scan history
      await scanService.addToScanHistory(scanResult.product, analysisResult);

      // Navigate to appropriate result screen
      const targetScreen = scanService.getNavigationTarget(analysisResult.severity);
      
      navigation.navigate(targetScreen as never, {
        product: scanResult.product,
        analysis: analysisResult,
        fromCache: scanResult.fromCache,
      } as never);

    } catch (error) {
      const errorInfo = errorService.handleError(
        ErrorType.UNKNOWN_ERROR,
        'Failed to process scan',
        error as Error,
        { barcode: result.normalized, retryCount }
      );

      const recoveryActions = errorService.getRecoveryActions(errorInfo);
      recoveryActions[0].action = () => handleRetryBarcode(result);

      errorService.showErrorDialog(errorInfo, recoveryActions);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetryBarcode = async (result: BarcodeResult) => {
    setRetryCount(prev => prev + 1);
    await handleBarcodeDetected(result);
  };

  const handleScanError = (error: DetectionError) => {
    const errorType = error.type === 'CAMERA_ERROR' 
      ? ErrorType.CAMERA_INITIALIZATION_FAILED
      : error.type === 'DETECTION_ERROR'
      ? ErrorType.BARCODE_DETECTION_FAILED
      : ErrorType.VALIDATION_ERROR;

    const errorInfo = errorService.handleError(
      errorType,
      error.message,
      undefined,
      { errorType: error.type }
    );

    const recoveryActions = errorService.getRecoveryActions(errorInfo);
    
    // Set up recovery actions
    recoveryActions.forEach(action => {
      if (action.label === 'Manual Entry') {
        action.action = () => setShowManualEntry(true);
      } else if (action.label === 'Turn on Flash') {
        action.action = () => {
          // This would trigger torch toggle in camera component
        };
      }
    });

    errorService.showErrorDialog(errorInfo, recoveryActions);
  };

  const handleManualBarcodeEntry = async (barcode: string) => {
    setShowManualEntry(false);
    
    // Create a mock barcode result for manual entry
    const mockResult: BarcodeResult = {
      value: barcode,
      format: barcode.length === 13 ? 'EAN_13' as any : 'UPC_A' as any,
      normalized: barcode,
      isValid: true,
    };

    await handleBarcodeDetected(mockResult);
  };

  const handleRetryNotFound = () => {
    setShowProductNotFound(false);
    // Camera will automatically resume scanning
  };

  const handleManualEntryFromNotFound = () => {
    setShowProductNotFound(false);
    setShowManualEntry(true);
  };

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeDetected={handleBarcodeDetected}
        onError={handleScanError}
        onManualEntry={() => setShowManualEntry(true)}
      />

      <ManualEntryModal
        visible={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        onBarcodeEntered={handleManualBarcodeEntry}
      />

      {showProductNotFound && (
        <ProductNotFound
          barcode={currentBarcode}
          onRetry={handleRetryNotFound}
          onManualEntry={handleManualEntryFromNotFound}
        />
      )}

      {!isOnline && (
        <View style={styles.offlineIndicator}>
          <Text style={styles.offlineText}>Offline - Using cached data only</Text>
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
  offlineIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.9)',
    padding: 8,
    borderRadius: 4,
  },
  offlineText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});
