import { BarcodeDetectionService } from '../BarcodeDetectionService';
import { BarcodeFormat } from '../../../types/barcode';

jest.mock('@react-native-ml-kit/barcode-scanning');

describe('BarcodeDetectionService', () => {
  let service: BarcodeDetectionService;

  beforeEach(() => {
    service = new BarcodeDetectionService();
  });

  describe('validateBarcode', () => {
    it('validates EAN-13 correctly', () => {
      const result = service.validateBarcode('1234567890128', BarcodeFormat.EAN_13);
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('1234567890128');
    });

    it('validates UPC-A correctly', () => {
      const result = service.validateBarcode('123456789012', BarcodeFormat.UPC_A);
      expect(result.isValid).toBe(true);
      expect(result.normalized).toBe('0123456789012');
    });

    it('rejects invalid check digits', () => {
      const result = service.validateBarcode('1234567890123', BarcodeFormat.EAN_13);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('check digit');
    });

    it('rejects non-numeric values', () => {
      const result = service.validateBarcode('123abc789', BarcodeFormat.EAN_13);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('digits');
    });
  });

  describe('normalizeBarcode', () => {
    it('normalizes UPC-A to EAN-13', () => {
      const normalized = service.normalizeBarcode('123456789012', BarcodeFormat.UPC_A);
      expect(normalized).toBe('0123456789012');
    });

    it('pads short barcodes with zeros', () => {
      const normalized = service.normalizeBarcode('12345', BarcodeFormat.UNKNOWN);
      expect(normalized).toBe('0000000012345');
    });
  });
});
