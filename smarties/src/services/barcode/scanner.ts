/**
 * Barcode scanning service
 * Handles UPC barcode detection and extraction
 */

export interface ScanResult {
  type: string;
  data: string;
  bounds?: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
}

export interface ScannerConfig {
  torchMode?: 'on' | 'off' | 'auto';
  focusMode?: 'on' | 'off' | 'auto';
  autoFocus?: boolean;
}

export class BarcodeScanner {
  private config: ScannerConfig;

  constructor(config: ScannerConfig = {}) {
    this.config = {
      torchMode: 'off',
      focusMode: 'auto',
      autoFocus: true,
      ...config
    };
  }

  /**
   * Process scanned barcode data
   */
  processScanResult(scanResult: ScanResult): string | null {
    try {
      // Validate UPC format
      if (this.isValidUPC(scanResult.data)) {
        return scanResult.data;
      }
      
      console.warn('Invalid UPC format:', scanResult.data);
      return null;
    } catch (error) {
      console.error('Error processing scan result:', error);
      return null;
    }
  }

  /**
   * Validate UPC barcode format
   */
  private isValidUPC(upc: string): boolean {
    // UPC-A: 12 digits
    // UPC-E: 8 digits
    // EAN-13: 13 digits
    const upcPattern = /^(\d{8}|\d{12}|\d{13})$/;
    return upcPattern.test(upc);
  }

  /**
   * Update scanner configuration
   */
  updateConfig(newConfig: Partial<ScannerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current scanner configuration
   */
  getConfig(): ScannerConfig {
    return { ...this.config };
  }
}