/**
 * Product Service with Search and Caching
 * Implements Requirements 1.1, 1.5 from SMARTIES API integration specification
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SmartiesAPIClient } from './SmartiesAPIClient';
import { Product } from '../../types/product';

interface CachedProduct {
  product: Product;
  timestamp: number;
  ttl: number;
}

export class ProductService {
  private apiClient: SmartiesAPIClient;
  private readonly CACHE_PREFIX = 'smarties_product_';
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(apiClient: SmartiesAPIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Search product by UPC with caching
   */
  async searchByUPC(upc: string): Promise<Product | null> {
    // Check cache first
    const cached = await this.getCachedProduct(upc);
    if (cached) {
      return cached;
    }

    try {
      // Fetch from API
      const product = await this.apiClient.searchProductByUPC(upc);
      
      if (product) {
        // Cache the result
        await this.cacheProduct(upc, product);
      }

      return product;
    } catch (error) {
      console.error('Product search failed:', error);
      // Return cached version if available, even if expired
      return await this.getCachedProduct(upc, true);
    }
  }

  /**
   * Get cached product
   */
  private async getCachedProduct(upc: string, ignoreExpiry: boolean = false): Promise<Product | null> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${upc}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cachedData: CachedProduct = JSON.parse(cached);
      
      // Check if expired
      if (!ignoreExpiry && Date.now() - cachedData.timestamp > cachedData.ttl) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return cachedData.product;
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Cache product data
   */
  private async cacheProduct(upc: string, product: Product): Promise<void> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${upc}`;
      const cachedData: CachedProduct = {
        product,
        timestamp: Date.now(),
        ttl: this.DEFAULT_TTL
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedData));
    } catch (error) {
      console.error('Cache storage failed:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  async cleanupCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const productKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));

      for (const key of productKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cachedData: CachedProduct = JSON.parse(cached);
          if (Date.now() - cachedData.timestamp > cachedData.ttl) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Cache cleanup failed:', error);
    }
  }
}
