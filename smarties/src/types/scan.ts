/**
 * Scan-related type definitions
 */

import { Product } from './product';
import { AllergenAnalysisResult } from '../services/AllergenService';

// Barcode scan result from camera
export interface ScanResult {
  type: string;
  data: string;
}

// Scan history entry
export interface ScanHistory {
  id?: string;
  user_id: string;
  product_upc: string;
  product_name: string;
  scan_timestamp: Date;
  allergen_violations: string[];
  severity_level: 'safe' | 'mild' | 'severe';
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

// Complete scan result with product and analysis
export interface CompleteScanResult {
  product: Product;
  analysis: AllergenAnalysisResult;
  scanTimestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Scan session state
export interface ScanSession {
  isScanning: boolean;
  isProcessing: boolean;
  lastScanResult?: CompleteScanResult;
  error?: string;
}