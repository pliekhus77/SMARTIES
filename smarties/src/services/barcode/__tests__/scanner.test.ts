import { BarcodeScanner } from '../scanner';

describe('BarcodeScanner Service', () => {
  let scanner: BarcodeScanner;

  beforeEach(() => {
    scanner = new BarcodeScanner();
  });

  describe('processScanResult', () => {
    it('should process valid UPC-A barcode (12 digits)', () => {
      const scanResult = {
        type: 'upc_a',
        data: '123456789012'
      };

      const result = scanner.processScanResult(scanResult);
      expect(result).toBe('123456789012');
    });

    it('should process valid UPC-E barcode (8 digits)', () => {
      const scanResult = {
        type: 'upc_e',
        data: '12345678'
      };

      const result = scanner.processScanResult(scanResult);
      expect(result).toBe('12345678');
    });

    it('should process valid EAN-13 barcode (13 digits)', () => {
      const scanResult = {
        type: 'ean13',
        data: '1234567890123'
      };

      const result = scanner.processScanResult(scanResult);
      expect(result).toBe('1234567890123');
    });

    it('should reject invalid barcode formats', () => {
      const invalidBarcodes = [
        '123',           // Too short
        '12345678901234', // Too long
        '12345678a012',  // Contains letters
        '',              // Empty
        '123-456-789',   // Contains dashes
      ];

      invalidBarcodes.forEach(data => {
        const scanResult = { type: 'upc_a', data };
        const result = scanner.processScanResult(scanResult);
        expect(result).toBeNull();
      });
    });

    it('should handle scan result processing errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Create a malformed scan result that might cause an error
      const malformedResult = null as any;
      
      const result = scanner.processScanResult(malformedResult);
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('configuration', () => {
    it('should have default configuration', () => {
      const config = scanner.getConfig();
      
      expect(config).toEqual({
        torchMode: 'off',
        focusMode: 'auto',
        autoFocus: true
      });
    });

    it('should allow configuration updates', () => {
      scanner.updateConfig({ torchMode: 'on', autoFocus: false });
      
      const config = scanner.getConfig();
      expect(config.torchMode).toBe('on');
      expect(config.autoFocus).toBe(false);
      expect(config.focusMode).toBe('auto'); // Should remain unchanged
    });

    it('should create scanner with custom configuration', () => {
      const customScanner = new BarcodeScanner({
        torchMode: 'on',
        focusMode: 'off'
      });
      
      const config = customScanner.getConfig();
      expect(config.torchMode).toBe('on');
      expect(config.focusMode).toBe('off');
      expect(config.autoFocus).toBe(true); // Should use default
    });
  });
});