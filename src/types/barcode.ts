export interface BarcodeResult {
  value: string;
  format: BarcodeFormat;
  normalized: string;
  isValid: boolean;
}

export interface BarcodeValidationResult {
  isValid: boolean;
  error?: string;
  normalized?: string;
}

export enum BarcodeFormat {
  EAN_8 = 'EAN_8',
  EAN_13 = 'EAN_13',
  UPC_A = 'UPC_A',
  UPC_E = 'UPC_E',
  UNKNOWN = 'UNKNOWN'
}

export interface DetectionError {
  type: 'CAMERA_ERROR' | 'DETECTION_ERROR' | 'VALIDATION_ERROR';
  message: string;
}
