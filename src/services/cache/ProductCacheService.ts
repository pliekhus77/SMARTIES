import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../../types/product';

interface CachedProduct {
  product: Product;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  totalProducts: number;
  hitRate: number;
  totalSize: number;
}

export class ProductCacheService {
  private readonly cachePrefix = 'product_cache_';
  private readonly maxCacheSize = 100;
  private readonly ttlDays = 7;
  private readonly statsKey = 'cache_stats';
  
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
  };

  async getProduct(barcode: string): Promise<Product | null> {
    this.stats.totalRequests++;
    
    try {
      const key = this.getCacheKey(barcode);
      const cached = await AsyncStorage.getItem(key);
      
      if (!cached) {
        this.stats.misses++;
        return null;
      }

      const cachedProduct: CachedProduct = JSON.parse(cached);
      
      // Check TTL
      const age = Date.now() - cachedProduct.timestamp;
      const maxAge = this.ttlDays * 24 * 60 * 60 * 1000;
      
      if (age > maxAge) {
        await this.removeProduct(barcode);
        this.stats.misses++;
        return null;
      }

      // Update access stats
      cachedProduct.accessCount++;
      cachedProduct.lastAccessed = Date.now();
      await AsyncStorage.setItem(key, JSON.stringify(cachedProduct));
      
      this.stats.hits++;
      return cachedProduct.product;
      
    } catch (error) {
      console.error('Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  async setProduct(barcode: string, product: Product): Promise<void> {
    try {
      // Check cache size and evict if necessary
      await this.enforceMaxSize();
      
      const key = this.getCacheKey(barcode);
      const cachedProduct: CachedProduct = {
        product,
        timestamp: Date.now(),
        accessCount: 1,
        lastAccessed: Date.now(),
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(cachedProduct));
      
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async removeProduct(barcode: string): Promise<void> {
    try {
      const key = this.getCacheKey(barcode);
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Cache remove error:', error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      await AsyncStorage.multiRemove(cacheKeys);
      
      this.stats = { hits: 0, misses: 0, totalRequests: 0 };
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  async getCacheStats(): Promise<CacheStats> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
      
      const hitRate = this.stats.totalRequests > 0 
        ? this.stats.hits / this.stats.totalRequests 
        : 0;
      
      return {
        totalProducts: cacheKeys.length,
        hitRate: Math.round(hitRate * 100) / 100,
        totalSize,
      };
      
    } catch (error) {
      console.error('Cache stats error:', error);
      return { totalProducts: 0, hitRate: 0, totalSize: 0 };
    }
  }

  private async enforceMaxSize(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.cachePrefix));
      
      if (cacheKeys.length < this.maxCacheSize) {
        return;
      }
      
      // Get all cached products with their access info
      const products: Array<{ key: string; lastAccessed: number; accessCount: number }> = [];
      
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const cached: CachedProduct = JSON.parse(item);
          products.push({
            key,
            lastAccessed: cached.lastAccessed,
            accessCount: cached.accessCount,
          });
        }
      }
      
      // Sort by LRU (least recently used first)
      products.sort((a, b) => {
        // First by access count (ascending), then by last accessed (ascending)
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        return a.lastAccessed - b.lastAccessed;
      });
      
      // Remove oldest items to make room
      const itemsToRemove = products.length - this.maxCacheSize + 1;
      const keysToRemove = products.slice(0, itemsToRemove).map(p => p.key);
      
      await AsyncStorage.multiRemove(keysToRemove);
      
    } catch (error) {
      console.error('Cache eviction error:', error);
    }
  }

  private getCacheKey(barcode: string): string {
    return `${this.cachePrefix}${barcode}`;
  }

  async isProductCached(barcode: string): Promise<boolean> {
    const product = await this.getProduct(barcode);
    return product !== null;
  }

  async refreshProduct(barcode: string, product: Product): Promise<void> {
    // Remove old version and add new one
    await this.removeProduct(barcode);
    await this.setProduct(barcode, product);
  }
}
