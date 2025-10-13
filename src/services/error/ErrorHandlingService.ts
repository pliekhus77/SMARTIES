import { Alert } from 'react-native';
import { AccessibilityService } from '../accessibility/AccessibilityService';

export enum ErrorType {
  CAMERA_PERMISSION_DENIED = 'CAMERA_PERMISSION_DENIED',
  CAMERA_INITIALIZATION_FAILED = 'CAMERA_INITIALIZATION_FAILED',
  BARCODE_DETECTION_FAILED = 'BARCODE_DETECTION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: any;
  timestamp: Date;
  recoverable: boolean;
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  primary?: boolean;
}

export class ErrorHandlingService {
  private accessibilityService: AccessibilityService;
  private errorLog: ErrorInfo[] = [];

  constructor() {
    this.accessibilityService = new AccessibilityService();
  }

  handleError(
    type: ErrorType,
    message: string,
    originalError?: Error,
    context?: any
  ): ErrorInfo {
    const errorInfo: ErrorInfo = {
      type,
      message,
      originalError,
      context,
      timestamp: new Date(),
      recoverable: this.isRecoverable(type),
    };

    // Log the error
    this.logError(errorInfo);

    // Announce for accessibility
    this.accessibilityService.announceValidationError(message);

    return errorInfo;
  }

  showErrorDialog(
    errorInfo: ErrorInfo,
    recoveryActions?: RecoveryAction[]
  ): void {
    const userMessage = this.getUserFriendlyMessage(errorInfo);
    const title = this.getErrorTitle(errorInfo.type);

    if (recoveryActions && recoveryActions.length > 0) {
      // Show alert with recovery options
      const buttons = recoveryActions.map(action => ({
        text: action.label,
        onPress: action.action,
        style: action.primary ? 'default' : 'cancel',
      }));

      Alert.alert(title, userMessage, buttons);
    } else {
      // Simple error alert
      Alert.alert(title, userMessage, [{ text: 'OK' }]);
    }
  }

  getRecoveryActions(errorInfo: ErrorInfo): RecoveryAction[] {
    switch (errorInfo.type) {
      case ErrorType.CAMERA_PERMISSION_DENIED:
        return [
          {
            label: 'Open Settings',
            action: this.openAppSettings,
            primary: true,
          },
          {
            label: 'Use Manual Entry',
            action: () => {}, // This would be provided by the calling component
          },
        ];

      case ErrorType.CAMERA_INITIALIZATION_FAILED:
        return [
          {
            label: 'Retry',
            action: () => {}, // This would be provided by the calling component
            primary: true,
          },
          {
            label: 'Use Manual Entry',
            action: () => {},
          },
        ];

      case ErrorType.NETWORK_ERROR:
        return [
          {
            label: 'Retry',
            action: () => {},
            primary: true,
          },
          {
            label: 'Check Connection',
            action: this.openNetworkSettings,
          },
        ];

      case ErrorType.API_ERROR:
        return [
          {
            label: 'Retry',
            action: () => {},
            primary: true,
          },
        ];

      case ErrorType.BARCODE_DETECTION_FAILED:
        return [
          {
            label: 'Try Again',
            action: () => {},
            primary: true,
          },
          {
            label: 'Manual Entry',
            action: () => {},
          },
          {
            label: 'Turn on Flash',
            action: () => {},
          },
        ];

      default:
        return [
          {
            label: 'Retry',
            action: () => {},
            primary: true,
          },
        ];
    }
  }

  private isRecoverable(type: ErrorType): boolean {
    const recoverableTypes = [
      ErrorType.NETWORK_ERROR,
      ErrorType.API_ERROR,
      ErrorType.BARCODE_DETECTION_FAILED,
      ErrorType.CACHE_ERROR,
    ];

    return recoverableTypes.includes(type);
  }

  private getUserFriendlyMessage(errorInfo: ErrorInfo): string {
    switch (errorInfo.type) {
      case ErrorType.CAMERA_PERMISSION_DENIED:
        return 'SMARTIES needs camera access to scan barcodes. Please enable camera permissions in your device settings.';

      case ErrorType.CAMERA_INITIALIZATION_FAILED:
        return 'Unable to start the camera. Please try again or use manual barcode entry.';

      case ErrorType.BARCODE_DETECTION_FAILED:
        return 'Could not detect a barcode. Make sure the barcode is clearly visible and try again.';

      case ErrorType.NETWORK_ERROR:
        return 'Network connection error. Please check your internet connection and try again.';

      case ErrorType.API_ERROR:
        return 'Unable to look up product information. The service may be temporarily unavailable.';

      case ErrorType.CACHE_ERROR:
        return 'Error accessing cached data. Some features may not work properly.';

      case ErrorType.VALIDATION_ERROR:
        return errorInfo.message || 'The barcode format is not valid. Please check and try again.';

      default:
        return errorInfo.message || 'An unexpected error occurred. Please try again.';
    }
  }

  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.CAMERA_PERMISSION_DENIED:
        return 'Camera Permission Required';
      case ErrorType.CAMERA_INITIALIZATION_FAILED:
        return 'Camera Error';
      case ErrorType.BARCODE_DETECTION_FAILED:
        return 'Scan Error';
      case ErrorType.NETWORK_ERROR:
        return 'Connection Error';
      case ErrorType.API_ERROR:
        return 'Service Error';
      case ErrorType.VALIDATION_ERROR:
        return 'Invalid Barcode';
      default:
        return 'Error';
    }
  }

  private logError(errorInfo: ErrorInfo): void {
    // Add to error log
    this.errorLog.push(errorInfo);

    // Keep only last 50 errors
    if (this.errorLog.length > 50) {
      this.errorLog = this.errorLog.slice(-50);
    }

    // Log to console for debugging
    console.error('SMARTIES Error:', {
      type: errorInfo.type,
      message: errorInfo.message,
      timestamp: errorInfo.timestamp,
      context: errorInfo.context,
      originalError: errorInfo.originalError,
    });

    // In production, this would also send to analytics/crash reporting
  }

  private async openAppSettings(): Promise<void> {
    try {
      const { Linking } = await import('react-native');
      await Linking.openSettings();
    } catch (error) {
      console.error('Failed to open app settings:', error);
    }
  }

  private async openNetworkSettings(): Promise<void> {
    try {
      const { Linking } = await import('react-native');
      // This is platform-specific and may not work on all devices
      await Linking.sendIntent('android.settings.WIFI_SETTINGS');
    } catch (error) {
      console.error('Failed to open network settings:', error);
    }
  }

  getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  async retryWithExponentialBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * delay;
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }

    throw lastError!;
  }
}
