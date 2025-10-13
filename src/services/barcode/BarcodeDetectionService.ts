import { BarcodeScanner, BarcodeFormat as MLKitFormat } from '@react-native-ml-kit/barcode-scanning';
import { BarcodeResult, BarcodeFormat, BarcodeValidationResult, DetectionError } from '../../types/barcode';

export class BarcodeDetectionService {
  private scanner: BarcodeScanner;

  constructor() {
    this.scanner = new BarcodeScanner();
  }

  async detectBarcode(imagePath: string): Promise<BarcodeResult | DetectionError> {
    try {
      const barcodes = await this.scanner.scan(imagePath);
      
      if (barcodes.length === 0) {
        return { type: 'DETECTION_ERROR', message: 'No barcode detected' };
      }

      const barcode = barcodes[0];
      const format = this.mapMLKitFormat(barcode.format);
      const validation = this.validateBarcode(barcode.value, format);

      if (!validation.isValid) {
        return { type: 'VALIDATION_ERROR', message: validation.error || 'Invalid barcode' };
      }

      return {
        value: barcode.value,
        format,
        normalized: validation.normalized || barcode.value,
        isValid: true
      };
    } catch (error) {
      return { type: 'DETECTION_ERROR', message: `Detection failed: ${error}` };
    }
  }

  private mapMLKitFormat(mlkitFormat: MLKitFormat): BarcodeFormat {
    switch (mlkitFormat) {
      case MLKitFormat.EAN_8: return BarcodeFormat.EAN_8;
      case MLKitFormat.EAN_13: return BarcodeFormat.EAN_13;
      case MLKitFormat.UPC_A: return BarcodeFormat.UPC_A;
      case MLKitFormat.UPC_E: return BarcodeFormat.UPC_E;
      default: return BarcodeFormat.UNKNOWN;
    }
  }

  validateBarcode(value: string, format: BarcodeFormat): BarcodeValidationResult {
    if (!value || !/^\d+$/.test(value)) {
      return { isValid: false, error: 'Barcode must contain only digits' };
    }

    switch (format) {
      case BarcodeFormat.EAN_8:
        return this.validateEAN8(value);
      case BarcodeFormat.EAN_13:
        return this.validateEAN13(value);
      case BarcodeFormat.UPC_A:
        return this.validateUPCA(value);
      case BarcodeFormat.UPC_E:
        return this.validateUPCE(value);
      default:
        return { isValid: false, error: 'Unsupported barcode format' };
    }
  }

  private validateEAN8(value: string): BarcodeValidationResult {
    if (value.length !== 8) {
      return { isValid: false, error: 'EAN-8 must be 8 digits' };
    }
    
    const checkDigit = this.calculateEAN8CheckDigit(value.slice(0, 7));
    const isValid = checkDigit === parseInt(value[7]);
    
    return {
      isValid,
      normalized: value.padStart(13, '0'),
      error: isValid ? undefined : 'Invalid EAN-8 check digit'
    };
  }

  private validateEAN13(value: string): BarcodeValidationResult {
    if (value.length !== 13) {
      return { isValid: false, error: 'EAN-13 must be 13 digits' };
    }
    
    const checkDigit = this.calculateEAN13CheckDigit(value.slice(0, 12));
    const isValid = checkDigit === parseInt(value[12]);
    
    return {
      isValid,
      normalized: value,
      error: isValid ? undefined : 'Invalid EAN-13 check digit'
    };
  }

  private validateUPCA(value: string): BarcodeValidationResult {
    if (value.length !== 12) {
      return { isValid: false, error: 'UPC-A must be 12 digits' };
    }
    
    const checkDigit = this.calculateUPCACheckDigit(value.slice(0, 11));
    const isValid = checkDigit === parseInt(value[11]);
    
    return {
      isValid,
      normalized: '0' + value,
      error: isValid ? undefined : 'Invalid UPC-A check digit'
    };
  }

  private validateUPCE(value: string): BarcodeValidationResult {
    if (value.length !== 8) {
      return { isValid: false, error: 'UPC-E must be 8 digits' };
    }
    
    const expanded = this.expandUPCE(value);
    if (!expanded) {
      return { isValid: false, error: 'Invalid UPC-E format' };
    }
    
    return {
      isValid: true,
      normalized: '0' + expanded,
      error: undefined
    };
  }

  private calculateEAN8CheckDigit(digits: string): number {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      sum += parseInt(digits[i]) * (i % 2 === 0 ? 3 : 1);
    }
    return (10 - (sum % 10)) % 10;
  }

  private calculateEAN13CheckDigit(digits: string): number {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
    }
    return (10 - (sum % 10)) % 10;
  }

  private calculateUPCACheckDigit(digits: string): number {
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += parseInt(digits[i]) * (i % 2 === 0 ? 3 : 1);
    }
    return (10 - (sum % 10)) % 10;
  }

  private expandUPCE(upce: string): string | null {
    const patterns = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 2, 0, 0, 0],
      [0, 0, 0, 0, 0, 3],
      [0, 1, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0],
      [0, 3, 0, 0, 0, 0],
      [0, 4, 0, 0, 0, 0],
      [0, 5, 0, 0, 0, 0],
      [0, 6, 0, 0, 0, 0]
    ];
    
    const lastDigit = parseInt(upce[7]);
    if (lastDigit >= patterns.length) return null;
    
    const manufacturer = upce.slice(1, 3);
    const product = upce.slice(3, 6);
    const checkDigit = upce[7];
    
    let expanded = manufacturer;
    
    if (lastDigit <= 2) {
      expanded += lastDigit + '0000' + product;
    } else if (lastDigit === 3) {
      expanded += product.slice(0, 1) + '00000' + product.slice(1);
    } else if (lastDigit === 4) {
      expanded += product.slice(0, 2) + '00000' + product[2];
    } else {
      expanded += product + '0000' + lastDigit;
    }
    
    return expanded + checkDigit;
  }

  normalizeBarcode(value: string, format: BarcodeFormat): string {
    const validation = this.validateBarcode(value, format);
    return validation.normalized || value.padStart(13, '0');
  }
}
