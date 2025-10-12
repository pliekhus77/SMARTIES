import { UPCLookupService } from '../UPCLookupService';
import { DatabaseService } from '../../DatabaseService';
import { Product } from '../../../models/Product';

// Mock DatabaseService
jest.mock('../../DatabaseService');

describe('UPCLookupService Performance Tests', () => {
  let upcLookupService: UPCLookupService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  const mockProduct: Product = {
    _id: '507f1f77bcf86cd799439011',
    upc: '123456789012',
    name: 'Test Product',
    ingredients: ['water', 'sugar'],
    allergens: ['none'],
    dietaryFlags: {
      vegan: true,
      vegetarian: true,
      glutenFree: false,
      kosher: false,
      halal: false
    }
  };

  beforeEach(() => {
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>;
    upcLookupService = new UPCLookupService(mockDatabaseService);
    jest.clearAllMocks();
  });

  describe('Performance Requirements', () => {
    it('should complete UPC lookup within 100ms target', async () => {
      // Mock fast database response (50ms)
      mockDatabaseService.findProductByUPC.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockProduct), 50))
      );

      const startTime = Date.now();
      const result = await upcLookupService.lookupByUPC('123456789012');
      const responseTime = Date.now() - startTime;

      expect(result).toEqual(mockProduct);
      expect(responseTime).toBeLessThan(100);
    });

    it('should handle concurrent lookups efficiently', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(mockProduct);

      const concurrentLookups = Array.from({ length: 10 }, (_, i) => 
        upcLookupService.lookupByUPC(`12345678901${i}`)
      );

      const startTime = Date.now();
      const results = await Promise.all(concurrentLookups);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(results.every(r => r === mockProduct)).toBe(true);
      expect(totalTime).toBeLessThan(500); // All 10 lookups in under 500ms
    });

    it('should benefit from caching for repeated lookups', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(mockProduct);

      // First lookup (cache miss)
      const startTime1 = Date.now();
      await upcLookupService.lookupByUPC('123456789012');
      const firstLookupTime = Date.now() - startTime1;

      // Second lookup (cache hit)
      const startTime2 = Date.now();
      await upcLookupService.lookupByUPC('123456789012');
      const secondLookupTime = Date.now() - startTime2;

      expect(secondLookupTime).toBeLessThan(firstLookupTime);
      expect(secondLookupTime).toBeLessThan(10); // Cache hit should be very fast
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledTimes(1);
    });

    it('should maintain performance under cache pressure', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(mockProduct);

      // Fill cache with many entries
      const lookupPromises = Array.from({ length: 100 }, (_, i) => 
        upcLookupService.lookupByUPC(`12345678901${i.toString().padStart(2, '0')}`)
      );

      const startTime = Date.now();
      await Promise.all(lookupPromises);
      const totalTime = Date.now() - startTime;

      // Should complete all lookups in reasonable time
      expect(totalTime).toBeLessThan(2000); // 2 seconds for 100 lookups
      
      // Verify cache is working
      const cacheStats = upcLookupService.getCacheStats();
      expect(cacheStats.size).toBe(100);
    });
  });

  describe('Error Handling Performance', () => {
    it('should fail fast on database errors', async () => {
      mockDatabaseService.findProductByUPC.mockRejectedValue(new Error('Database error'));

      const startTime = Date.now();
      const result = await upcLookupService.lookupByUPC('123456789012');
      const responseTime = Date.now() - startTime;

      expect(result).toBeNull();
      expect(responseTime).toBeLessThan(50); // Should fail quickly
    });

    it('should handle invalid UPC codes efficiently', async () => {
      const invalidUPCs = ['', 'invalid', '123', 'abcdefghijkl'];

      for (const invalidUPC of invalidUPCs) {
        const startTime = Date.now();
        await upcLookupService.lookupByUPC(invalidUPC);
        const responseTime = Date.now() - startTime;

        expect(responseTime).toBeLessThan(50); // Should process quickly
      }
    });
  });
});
