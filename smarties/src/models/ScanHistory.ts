/**
 * Scan history data model
 * Represents individual product scan results and analytics
 */

export interface ComplianceResult {
  safe: boolean;
  violations: string[];
  warnings: string[];
  confidence: number;
}

export interface ScanLocation {
  latitude: number;
  longitude: number;
  address?: string;
  store_name?: string;
}

export interface ScanHistory {
  _id?: string;
  user_id: string;
  product_upc: string;
  product_name?: string;
  product_brand?: string;
  scan_timestamp: Date;
  compliance_result: ComplianceResult;
  location?: ScanLocation;
  scan_duration?: number; // milliseconds
  scan_method?: 'barcode' | 'manual' | 'image';
}

export class ScanHistoryModel implements ScanHistory {
  _id?: string;
  user_id: string;
  product_upc: string;
  product_name?: string;
  product_brand?: string;
  scan_timestamp: Date;
  compliance_result: ComplianceResult;
  location?: ScanLocation;
  scan_duration?: number;
  scan_method?: 'barcode' | 'manual' | 'image';

  constructor(data: ScanHistory) {
    this._id = data._id;
    this.user_id = data.user_id;
    this.product_upc = data.product_upc;
    this.product_name = data.product_name;
    this.product_brand = data.product_brand;
    this.scan_timestamp = data.scan_timestamp;
    this.compliance_result = data.compliance_result;
    this.location = data.location;
    this.scan_duration = data.scan_duration;
    this.scan_method = data.scan_method || 'barcode';
  }

  /**
   * Check if scan result was safe
   */
  isSafe(): boolean {
    return this.compliance_result.safe;
  }

  /**
   * Get total number of issues (violations + warnings)
   */
  getTotalIssues(): number {
    return this.compliance_result.violations.length + this.compliance_result.warnings.length;
  }

  /**
   * Get scan result summary
   */
  getSummary(): string {
    if (this.isSafe()) {
      return 'Safe to consume';
    }
    
    const violations = this.compliance_result.violations.length;
    const warnings = this.compliance_result.warnings.length;
    
    if (violations > 0) {
      return `${violations} violation${violations > 1 ? 's' : ''} found`;
    }
    
    if (warnings > 0) {
      return `${warnings} warning${warnings > 1 ? 's' : ''} found`;
    }
    
    return 'Unknown status';
  }

  /**
   * Get formatted scan time
   */
  getFormattedScanTime(): string {
    return this.scan_timestamp.toLocaleString();
  }

  /**
   * Get time since scan in human-readable format
   */
  getTimeSinceScan(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.scan_timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  }

  /**
   * Get scan performance rating
   */
  getScanPerformance(): 'fast' | 'normal' | 'slow' {
    if (!this.scan_duration) return 'normal';
    
    if (this.scan_duration < 2000) return 'fast';
    if (this.scan_duration > 5000) return 'slow';
    return 'normal';
  }

  /**
   * Check if scan has location data
   */
  hasLocation(): boolean {
    return this.location !== undefined;
  }

  /**
   * Get formatted location string
   */
  getFormattedLocation(): string {
    if (!this.location) return 'Unknown location';
    
    if (this.location.store_name) {
      return this.location.store_name;
    }
    
    if (this.location.address) {
      return this.location.address;
    }
    
    return `${this.location.latitude.toFixed(4)}, ${this.location.longitude.toFixed(4)}`;
  }

  /**
   * Get confidence level description
   */
  getConfidenceLevel(): 'high' | 'medium' | 'low' {
    const confidence = this.compliance_result.confidence;
    
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Check if this is a recent scan (within last hour)
   */
  isRecentScan(): boolean {
    const now = new Date();
    const diffMs = now.getTime() - this.scan_timestamp.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 1;
  }

  /**
   * Get product display name
   */
  getProductDisplayName(): string {
    if (this.product_name && this.product_brand) {
      return `${this.product_brand} ${this.product_name}`;
    }
    
    if (this.product_name) {
      return this.product_name;
    }
    
    return `Product ${this.product_upc}`;
  }
}