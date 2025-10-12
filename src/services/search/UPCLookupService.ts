import { DatabaseService } from '../database/DatabaseService';
import { Product } from '../../models/Product';

interface UPCLookupCache {
  [upc: string]: {
    product: Product | null;
    timestamp: number;
  };
}

export class UPCLookupService {
  private cache: UPCLookupCache = {};
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private databaseService: DatabaseService) {}

  async lookupByUPC(upc: string): Promise<Product | null> {
    const normalizedUPC = this.normalizeUPC(upc);
    
    // Check cache first
    const cached = this.getCachedProduct(normalizedUPC);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const startTime = Date.now();
      const product = await this.databaseService.findProductByUPC(normalizedUPC);
      const responseTime = Date.now() - startTime;

      // Log performance warning if over 100ms
      if (responseTime > 100) {
        console.warn(`UPC lookup exceeded 100ms: ${responseTime}ms for UPC ${normalizedUPC}`);
      }

      // Cache the result
      this.cacheProduct(normalizedUPC, product);
      
      return product;
    } catch (error) {
      console.error('UPC lookup failed:', error);
      return null;
    }
  }

  private normalizeUPC(upc: string): string {
    // Remove non-numeric characters and pad to standard lengths
    const cleaned = upc.replace(/\D/g, '');
    
    // Handle common UPC formats (UPC-A: 12 digits, EAN-13: 13 digits)
    if (cleaned.length === 11) {
      return this.calculateUPCACheckDigit(cleaned);
    }
    if (cleaned.length === 12) {
      return cleaned; // UPC-A
    }
    if (cleaned.length === 13) {
      return cleaned; // EAN-13
    }
    
    return cleaned; // Return as-is for other formats
  }

  private calculateUPCACheckDigit(elevenDigits: string): string {
    const digits = elevenDigits.split('').map(Number);
    const sum = digits.reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 1 : 3);
    }, 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return elevenDigits + checkDigit;
  }

  private getCachedProduct(upc: string): Product | null | undefined {
    const cached = this.cache[upc];
    if (!cached) return undefined;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_TTL;
    if (isExpired) {
      delete this.cache[upc];
      return undefined;
    }

    return cached.product;
  }

  private cacheProduct(upc: string, product: Product | null): void {
    this.cache[upc] = {
      product,
      timestamp: Date.now()
    };
  }

  clearCache(): void {
    this.cache = {};
  }

  getCacheStats(): { size: number; hitRate?: number } {
    return { size: Object.keys(this.cache).length };
  }
}
