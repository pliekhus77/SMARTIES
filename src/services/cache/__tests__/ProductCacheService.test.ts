import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductCacheService } from '../ProductCacheService';
import { Product } from '../../../types/product';

jest.mock('@react-native-async-storage/async-storage');

describe('ProductCacheService', () => {
  let service: ProductCacheService;
  const mockProduct: Product = {
    barcode: '1234567890123',
    name: 'Test Product',
    ingredients: 'Water, Sugar',
    allergens: ['milk'],
  };

  beforeEach(() => {
    service = new ProductCacheService();
    jest.clearAllMocks();
  });

  it('caches and retrieves products', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValueOnce(undefined);

    // Cache product
    await service.setProduct('123', mockProduct);
    expect(AsyncStorage.setItem).toHaveBeenCalled();

    // Mock cached data for retrieval
    const cachedData = {
      product: mockProduct,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    };
    
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(cachedData)
    );

    const retrieved = await service.getProduct('123');
    expect(retrieved).toEqual(mockProduct);
  });

  it('returns null for expired products', async () => {
    const expiredData = {
      product: mockProduct,
      timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
      accessCount: 1,
      lastAccessed: Date.now(),
    };
    
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(expiredData)
    );
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValueOnce(undefined);

    const result = await service.getProduct('123');
    expect(result).toBeNull();
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  it('enforces cache size limits', async () => {
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce(
      Array.from({ length: 101 }, (_, i) => `product_cache_${i}`)
    );
    
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValueOnce(undefined);

    await service.setProduct('new', mockProduct);
    expect(AsyncStorage.multiRemove).toHaveBeenCalled();
  });

  it('calculates cache statistics', async () => {
    (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValueOnce([
      'product_cache_1',
      'product_cache_2',
      'other_key',
    ]);
    
    (AsyncStorage.getItem as jest.Mock)
      .mockResolvedValueOnce('{"product":{}}')
      .mockResolvedValueOnce('{"product":{}}');

    const stats = await service.getCacheStats();
    expect(stats.totalProducts).toBe(2);
    expect(stats.totalSize).toBeGreaterThan(0);
  });
});
