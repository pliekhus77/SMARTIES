import { AccessibilityInfo, Alert } from 'react-native';

export class AccessibilityService {
  private isScreenReaderEnabled = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      
      // Listen for screen reader changes
      AccessibilityInfo.addEventListener('screenReaderChanged', this.handleScreenReaderChange);
    } catch (error) {
      console.error('Accessibility initialization error:', error);
    }
  }

  private handleScreenReaderChange = (enabled: boolean) => {
    this.isScreenReaderEnabled = enabled;
  };

  isScreenReaderActive(): boolean {
    return this.isScreenReaderEnabled;
  }

  announceForAccessibility(message: string): void {
    if (this.isScreenReaderEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }

  announceBarcodeScanningStatus(status: 'ready' | 'scanning' | 'detected' | 'processing' | 'error'): void {
    const messages = {
      ready: 'Camera ready. Position barcode within the viewfinder to scan.',
      scanning: 'Scanning for barcode. Hold steady.',
      detected: 'Barcode detected. Processing product information.',
      processing: 'Looking up product information. Please wait.',
      error: 'Scanning error occurred. Try repositioning the barcode or use manual entry.',
    };

    this.announceForAccessibility(messages[status]);
  }

  announceProductResult(productName: string, hasAllergens: boolean): void {
    const allergenStatus = hasAllergens ? 'Contains allergens' : 'No known allergens';
    const message = `Product found: ${productName}. ${allergenStatus}. Tap for detailed analysis.`;
    this.announceForAccessibility(message);
  }

  announceNetworkStatus(isOnline: boolean): void {
    const message = isOnline 
      ? 'Network connection restored. Full product lookup available.'
      : 'No network connection. Using cached data only.';
    
    this.announceForAccessibility(message);
  }

  announceCacheStatus(isCached: boolean): void {
    if (isCached) {
      this.announceForAccessibility('Product loaded from cache.');
    }
  }

  announceManualEntryMode(): void {
    this.announceForAccessibility('Manual entry mode. Enter barcode digits using the numeric keypad.');
  }

  announceTorchStatus(enabled: boolean): void {
    const message = enabled ? 'Flashlight turned on' : 'Flashlight turned off';
    this.announceForAccessibility(message);
  }

  announceValidationError(error: string): void {
    this.announceForAccessibility(`Validation error: ${error}`);
  }

  provideHapticFeedback(type: 'success' | 'warning' | 'error'): void {
    // This would integrate with haptic feedback service
    // For now, we'll use audio announcements for accessibility
    const messages = {
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
    };

    this.announceForAccessibility(messages[type]);
  }

  getAccessibilityHints() {
    return {
      cameraView: 'Double tap to focus camera. Swipe up for manual entry options.',
      torchButton: 'Double tap to toggle flashlight for better barcode visibility.',
      manualEntryButton: 'Double tap to enter barcode numbers manually.',
      barcodeInput: 'Enter product barcode numbers. Use numeric keypad.',
      submitButton: 'Double tap to submit barcode for product lookup.',
      retryButton: 'Double tap to try scanning again.',
    };
  }

  cleanup(): void {
    AccessibilityInfo.removeEventListener('screenReaderChanged', this.handleScreenReaderChange);
  }
}
