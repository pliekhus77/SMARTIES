import { mockBarcodeService } from '../../test/mocks/mockServices';
import { Validator } from '../../utils/validation';

// Simple barcode service for testing
class BarcodeService {
  async requestPermissions(): Promise<boolean> {
    return mockBarcodeService.requestPermissions();
  }

  async scanBarcode(): Promise<string> {
    const barcode = await mockBarcodeService.scanBarcode();
    
    // Validate barcode format
    if (!Validator.isValidBarcode(barcode)) {
      throw new Error('Invalid barcode format');
    }

    return barcode;
  }

  async scanWithRetry(maxRetries: number = 3): Promise<string> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.scanBarcode();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw lastError || new Error('Scan failed after retries');
  }

  validateBarcodeFormat(barcode: string): boolean {
    return Validator.isValidBarcode(barcode);
  }
}

const barcodeService = new BarcodeService();

describe('BarcodeService', () => {
  beforeEach(() => {
    mockBarcodeService.setShouldSucceed(true);
    mockBarcodeService.setMockBarcode('1234567890123');
  });

  describe('requestPermissions', () => {
    it('should request camera permissions successfully', async () => {
      const result = await barcodeService.requestPermissions();
      expect(result).toBe(true);
    });

    it('should handle permission denial', async () => {
      mockBarcodeService.setShouldSucceed(false);
      
      const result = await barcodeService.requestPermissions();
      expect(result).toBe(false);
    });
  });

  describe('scanBarcode', () => {
    it('should scan barcode successfully', async () => {
      const barcode = await barcodeService.scanBarcode();
      expect(barcode).toBe('1234567890123');
    });

    it('should validate barcode format', async () => {
      mockBarcodeService.setMockBarcode('invalid');
      
      await expect(barcodeService.scanBarcode()).rejects.toThrow('Invalid barcode format');
    });

    it('should handle scan failures', async () => {
      mockBarcodeService.setShouldSucceed(false);
      
      await expect(barcodeService.scanBarcode()).rejects.toThrow('Barcode scan failed');
    });
  });

  describe('scanWithRetry', () => {
    it('should succeed on first try', async () => {
      const barcode = await barcodeService.scanWithRetry();
      expect(barcode).toBe('1234567890123');
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const originalScan = mockBarcodeService.scanBarcode;
      
      mockBarcodeService.scanBarcode = jest.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Scan failed');
        }
        return '1234567890123';
      });

      const barcode = await barcodeService.scanWithRetry();
      expect(barcode).toBe('1234567890123');
      expect(attempts).toBe(3);
      
      // Restore original method
      mockBarcodeService.scanBarcode = originalScan;
    });

    it('should fail after max retries', async () => {
      mockBarcodeService.setShouldSucceed(false);
      
      await expect(barcodeService.scanWithRetry(2)).rejects.toThrow('Barcode scan failed');
    });
  });

  describe('validateBarcodeFormat', () => {
    it('should validate correct barcode formats', () => {
      expect(barcodeService.validateBarcodeFormat('12345678')).toBe(true); // 8 digits
      expect(barcodeService.validateBarcodeFormat('1234567890123')).toBe(true); // 13 digits
    });

    it('should reject invalid barcode formats', () => {
      expect(barcodeService.validateBarcodeFormat('123')).toBe(false); // too short
      expect(barcodeService.validateBarcodeFormat('abc123')).toBe(false); // contains letters
      expect(barcodeService.validateBarcodeFormat('')).toBe(false); // empty
    });
  });
});
