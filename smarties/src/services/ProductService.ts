/**
 * Product Service with caching and offline support
 * Implements Requirements 1.2 from Open Food Facts integration specification
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, APIProductResponse } from '../types';
import { SmartiesAPIClient } from './api/SmartiesAPIClient';
import { ErrorHandlingService } from './ErrorHandlingService';

export interface CachedProduct extends Product {
  cachedAt: Date;
  expiresAt: Date;
}

export class ProductService {
  private static instance: ProductService;
  private apiClient: SmartiesAPIClient;
  private errorHandler: ErrorHandlingService;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_KEY_PREFIX = 'product_cache_';

  private constructor() {
    this.apiClient = new SmartiesAPIClient();
    this.errorHandler = ErrorHandlingService.getInstance();
  }

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  /**
   * Search for product by UPC with caching and offline support
   */
  async searchByUPC(barcode: string): Promise<APIProductResponse> {
    try {
      // First check cache
      const cachedProduct = await this.getCachedProduct(barcode);
      if (cachedProduct && !this.isCacheExpired(cachedProduct)) {
        console.log('Returning cached product for UPC:', barcode);
        return {
          success: true,
          data: cachedProduct
        };
      }

      // Try API call
      const apiResponse = await this.apiClient.searchProductByUPC(barcode);
      
      if (apiResponse.success && apiResponse.data) {
        // Cache the successful response
        await this.cacheProduct(barcode, apiResponse.data);
        return apiResponse;
      }

      // If API fails but we have expired cache, return it with warning
      if (cachedProduct) {
        console.log('API failed, returning expired cache for UPC:', barcode);
        return {
          success: true,
          data: { ...cachedProduct, source: 'database' as const }
        };
      }

      return apiResponse;
    } catch (error) {
      console.error('ProductService: Error in searchByUPC:', error);
      
      // Try to return cached data on error
      const cachedProduct = await this.getCachedProduct(barcode);
      if (cachedProduct) {
        return {
          success: true,
          data: cachedProduct
        };
      }

      return {
        success: false,
        error: 'Product not found and no cached data available'
      };
    }
  }

  /**
   * Cache product data
   */
  private async cacheProduct(barcode: string, product: Product): Promise<void> {
    try {
      const cachedProduct: CachedProduct = {
        ...product,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + this.CACHE_DURATION)
      };

      const cacheKey = this.CACHE_KEY_PREFIX + barcode;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedProduct));
      console.log('Cached product:', barcode);
    } catch (error) {
      console.error('Error caching product:', error);
    }
  }

  /**
   * Get cached product
   */
  private async getCachedProduct(barcode: string): Promise<CachedProduct | null> {
    try {
      const cacheKey = this.CACHE_KEY_PREFIX + barcode;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const cachedProduct: CachedProduct = JSON.parse(cached);
        // Convert date strings back to Date objects
        cachedProduct.cachedAt = new Date(cachedProduct.cachedAt);
        cachedProduct.expiresAt = new Date(cachedProduct.expiresAt);
        cachedProduct.lastUpdated = new Date(cachedProduct.lastUpdated);
        return cachedProduct;
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving cached product:', error);
      return null;
    }
  }

  /**
   * Check if cache is expired
   */
  private isCacheExpired(cachedProduct: CachedProduct): boolean {
    return new Date() > cachedProduct.expiresAt;
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const productKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      for (const key of productKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cachedProduct: CachedProduct = JSON.parse(cached);
          cachedProduct.expiresAt = new Date(cachedProduct.expiresAt);
          
          if (this.isCacheExpired(cachedProduct)) {
            await AsyncStorage.removeItem(key);
            console.log('Removed expired cache:', key);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ totalItems: number; totalSize: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const productKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      let totalSize = 0;
      for (const key of productKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
        }
      }
      
      return {
        totalItems: productKeys.length,
        totalSize
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalItems: 0, totalSize: 0 };
    }
  }

  /**
   * Clear all cached products
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const productKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      await AsyncStorage.multiRemove(productKeys);
      console.log('Cleared all product cache');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}