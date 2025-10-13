import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Vibration } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { BarcodeDetectionService } from '../../services/barcode/BarcodeDetectionService';
import { BarcodeResult, DetectionError } from '../../types/barcode';
import { AccessibilityService } from '../../services/accessibility/AccessibilityService';
import HapticFeedback from 'react-native-haptic-feedback';

interface CameraViewProps {
  onBarcodeDetected: (result: BarcodeResult) => void;
  onError: (error: DetectionError) => void;
  onManualEntry: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onBarcodeDetected, onError, onManualEntry }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const devices = useCameraDevices();
  const device = devices.back;
  const detectionService = useRef(new BarcodeDetectionService()).current;
  const accessibilityService = useRef(new AccessibilityService()).current;

  useEffect(() => {
    requestCameraPermission();
    accessibilityService.announceBarcodeScanningStatus('ready');
    
    return () => {
      accessibilityService.cleanup();
    };
  }, []);

  const requestCameraPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    const granted = permission === 'authorized';
    setHasPermission(granted);
    
    if (!granted) {
      accessibilityService.announceForAccessibility('Camera permission denied. Please enable camera access in settings to scan barcodes.');
    }
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (isProcessing) return;
    
    // Process frame for barcode detection
    // Note: This is a simplified version - actual implementation would use ML Kit frame processing
  }, [isProcessing]);

  const handleBarcodeDetected = async (imagePath: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    accessibilityService.announceBarcodeScanningStatus('detected');
    
    try {
      const result = await detectionService.detectBarcode(imagePath);
      
      if ('type' in result) {
        accessibilityService.announceBarcodeScanningStatus('error');
        onError(result);
      } else {
        // Success feedback
        HapticFeedback.trigger('impactMedium');
        Vibration.vibrate(100);
        accessibilityService.announceBarcodeScanningStatus('processing');
        onBarcodeDetected(result);
      }
    } catch (error) {
      accessibilityService.announceBarcodeScanningStatus('error');
      onError({ type: 'DETECTION_ERROR', message: `Processing failed: ${error}` });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTorch = () => {
    const newState = !torchEnabled;
    setTorchEnabled(newState);
    accessibilityService.announceTorchStatus(newState);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={isActive}
        torch={torchEnabled ? 'on' : 'off'}
        frameProcessor={frameProcessor}
      />
      
      {/* Viewfinder overlay */}
      <View style={styles.overlay}>
        <View style={styles.viewfinder} />
        <Text style={styles.instructionText}>
          Position barcode within the frame
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.manualEntryButton}
          onPress={() => {
            accessibilityService.announceManualEntryMode();
            onManualEntry();
          }}
          accessibilityLabel="Enter barcode manually"
          accessibilityHint={accessibilityService.getAccessibilityHints().manualEntryButton}
        >
          <Text style={styles.buttonText}>⌨️</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.torchButton}
          onPress={toggleTorch}
          accessibilityLabel={torchEnabled ? 'Turn off flashlight' : 'Turn on flashlight'}
          accessibilityHint={accessibilityService.getAccessibilityHints().torchButton}
        >
          <Text style={styles.buttonText}>
            {torchEnabled ? '🔦' : '💡'}
          </Text>
        </TouchableOpacity>
      </View>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <Text style={styles.processingText}>Processing...</Text>
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
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 50,
    right: 20,
    flexDirection: 'column',
  },
  torchButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  manualEntryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 24,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 18,
  },
});
