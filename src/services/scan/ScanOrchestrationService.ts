import { BarcodeResult } from '../../types/barcode';
import { Product, ProductLookupResult } from '../../types/product';
import { ProductLookupService } from '../api/ProductLookupService';
import { ProductCacheService } from '../cache/ProductCacheService';
import { NetworkService } from '../network/NetworkService';
import { AccessibilityService } from '../accessibility/AccessibilityService';
import { PerformanceMonitoringService, ScanPerformanceData } from '../performance/PerformanceMonitoringService';

export interface ScanResult {
  success: boolean;
  product?: Product;
  error?: string;
  fromCache?: boolean;
}

export interface DietaryAnalysisResult {
  severity: 'severe' | 'warning' | 'clear';
  violations: string[];
  warnings: string[];
  product: Product;
}

export class ScanOrchestrationService {
  private productLookupService: ProductLookupService;
  private cacheService: ProductCacheService;
  private networkService: NetworkService;
  private accessibilityService: AccessibilityService;
  private performanceService: PerformanceMonitoringService;

  constructor() {
    this.productLookupService = new ProductLookupService();
    this.cacheService = new ProductCacheService();
    this.networkService = new NetworkService();
    this.accessibilityService = new AccessibilityService();
    this.performanceService = new PerformanceMonitoringService();
    
    // Start performance monitoring
    this.performanceService.startMonitoring();
  }

  async processScan(barcodeResult: BarcodeResult): Promise<ScanResult> {
    const session = this.performanceService.startScanSession();
    
    try {
      this.performanceService.recordDetection(session);
      
      // First, check cache
      const cachedProduct = await this.cacheService.getProduct(barcodeResult.normalized);
      
      if (cachedProduct) {
        this.performanceService.recordLookup(session, true);
        this.accessibilityService.announceCacheStatus(true);
        
        const result = {
          success: true,
          product: cachedProduct,
          fromCache: true,
        };
        
        this.performanceService.completeScanSession(session, true);
        return result;
      }

      // Check network connectivity
      const isOnline = this.networkService.isOnline();
      
      if (!isOnline) {
        this.accessibilityService.announceNetworkStatus(false);
        const result = {
          success: false,
          error: 'No network connection and product not in cache. Please connect to the internet to look up this product.',
        };
        
        this.performanceService.completeScanSession(session, false);
        return result;
      }

      // Lookup product online
      const lookupResult = await this.productLookupService.retryLookup(barcodeResult.normalized);
      this.performanceService.recordLookup(session, false);
      
      if (!lookupResult.success) {
        const result = {
          success: false,
          error: lookupResult.error,
        };
        
        this.performanceService.completeScanSession(session, false);
        return result;
      }

      // Cache the product for future use
      if (lookupResult.product) {
        await this.cacheService.setProduct(barcodeResult.normalized, lookupResult.product);
      }

      const result = {
        success: true,
        product: lookupResult.product,
        fromCache: false,
      };
      
      this.performanceService.completeScanSession(session, true);
      return result;

    } catch (error) {
      this.performanceService.completeScanSession(session, false);
      return {
        success: false,
        error: `Scan processing failed: ${error}`,
      };
    }
  }

  async analyzeDietaryCompliance(product: Product, userRestrictions: string[]): Promise<DietaryAnalysisResult> {
    const startTime = Date.now();
    
    const violations: string[] = [];
    const warnings: string[] = [];

    // Analyze allergens
    if (product.allergens) {
      for (const allergen of product.allergens) {
        if (userRestrictions.includes(allergen.toLowerCase())) {
          violations.push(`Contains ${allergen}`);
        }
      }
    }

    // Analyze ingredients for potential issues
    if (product.ingredients) {
      const ingredients = product.ingredients.toLowerCase();
      
      // Check for common dietary restrictions
      const restrictionChecks = {
        'gluten': ['wheat', 'barley', 'rye', 'gluten'],
        'dairy': ['milk', 'cheese', 'butter', 'cream', 'lactose'],
        'vegan': ['milk', 'egg', 'honey', 'gelatin', 'meat', 'fish'],
        'vegetarian': ['meat', 'fish', 'chicken', 'beef', 'pork'],
        'halal': ['pork', 'alcohol', 'wine'],
        'kosher': ['pork', 'shellfish', 'mixing meat and dairy'],
      };

      for (const restriction of userRestrictions) {
        const checkTerms = restrictionChecks[restriction as keyof typeof restrictionChecks];
        if (checkTerms) {
          for (const term of checkTerms) {
            if (ingredients.includes(term)) {
              if (restriction === 'gluten' || restriction === 'dairy') {
                violations.push(`May contain ${restriction} (${term} detected)`);
              } else {
                warnings.push(`May not be suitable for ${restriction} diet (${term} detected)`);
              }
            }
          }
        }
      }
    }

    // Determine severity
    let severity: 'severe' | 'warning' | 'clear' = 'clear';
    
    if (violations.length > 0) {
      severity = 'severe';
    } else if (warnings.length > 0) {
      severity = 'warning';
    }

    // Announce result for accessibility
    this.accessibilityService.announceProductResult(
      product.name,
      violations.length > 0 || warnings.length > 0
    );

    // Log analysis performance
    const analysisTime = Date.now() - startTime;
    console.log(`Dietary analysis completed in ${analysisTime}ms`);

    return {
      severity,
      violations,
      warnings,
      product,
    };
  }

  getPerformanceMetrics() {
    return this.performanceService.getMetrics();
  }

  getPerformanceReport() {
    return this.performanceService.getPerformanceReport();
  }

  optimizePerformance() {
    this.performanceService.optimizePerformance();
  }

  onAppBackground() {
    this.performanceService.onAppBackground();
  }

  onAppForeground() {
    this.performanceService.onAppForeground();
  }

  async addToScanHistory(product: Product, analysisResult: DietaryAnalysisResult): Promise<void> {
    try {
      // This would integrate with existing scan history service
      const historyEntry = {
        timestamp: new Date().toISOString(),
        product,
        severity: analysisResult.severity,
        violations: analysisResult.violations,
        warnings: analysisResult.warnings,
      };

      // Store in scan history (implementation would depend on existing service)
      console.log('Adding to scan history:', historyEntry);
      
    } catch (error) {
      console.error('Failed to add to scan history:', error);
    }
  }

  getNavigationTarget(severity: 'severe' | 'warning' | 'clear'): string {
    // Return the appropriate screen name based on severity
    switch (severity) {
      case 'severe':
        return 'SevereAlertScreen';
      case 'warning':
        return 'WarningScreen';
      case 'clear':
        return 'AllClearScreen';
      default:
        return 'ScanScreen';
    }
  }

  async refreshProductData(barcode: string): Promise<ScanResult> {
    try {
      // Force refresh from API
      const lookupResult = await this.productLookupService.lookupProduct(barcode);
      
      if (lookupResult.success && lookupResult.product) {
        // Update cache with fresh data
        await this.cacheService.refreshProduct(barcode, lookupResult.product);
        
        return {
          success: true,
          product: lookupResult.product,
          fromCache: false,
        };
      }

      return {
        success: false,
        error: lookupResult.error,
      };

    } catch (error) {
      return {
        success: false,
        error: `Refresh failed: ${error}`,
      };
    }
  }
}
