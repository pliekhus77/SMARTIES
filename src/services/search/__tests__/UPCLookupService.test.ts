import { UPCLookupService } from '../UPCLookupService';
import { DatabaseService } from '../../DatabaseService';
import { Product } from '../../../models/Product';

// Mock DatabaseService
jest.mock('../../DatabaseService');

describe('UPCLookupService', () => {
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

  describe('lookupByUPC', () => {
    it('should return product for valid UPC', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(mockProduct);

      const result = await upcLookupService.lookupByUPC('123456789012');

      expect(result).toEqual(mockProduct);
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledWith('123456789012');
    });

    it('should return null for non-existent UPC', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(null);

      const result = await upcLookupService.lookupByUPC('999999999999');

      expect(result).toBeNull();
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledWith('999999999999');
    });

    it('should normalize UPC codes correctly', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(mockProduct);

      // Test with spaces and dashes
      await upcLookupService.lookupByUPC('123-456-789-012');
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledWith('123456789012');

      // Test with 11 digits (should calculate check digit)
      await upcLookupService.lookupByUPC('12345678901');
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledWith('123456789017');
    });

    it('should use cache for repeated lookups', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(mockProduct);

      // First lookup
      const result1 = await upcLookupService.lookupByUPC('123456789012');
      expect(result1).toEqual(mockProduct);
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledTimes(1);

      // Second lookup should use cache
      const result2 = await upcLookupService.lookupByUPC('123456789012');
      expect(result2).toEqual(mockProduct);
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors gracefully', async () => {
      mockDatabaseService.findProductByUPC.mockRejectedValue(new Error('Database error'));

      const result = await upcLookupService.lookupByUPC('123456789012');

      expect(result).toBeNull();
    });

    it('should warn about slow lookups', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock slow database response
      mockDatabaseService.findProductByUPC.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockProduct), 150))
      );

      await upcLookupService.lookupByUPC('123456789012');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('UPC lookup exceeded 100ms')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('cache management', () => {
    it('should expire cached entries after TTL', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(mockProduct);

      // First lookup
      await upcLookupService.lookupByUPC('123456789012');
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledTimes(1);

      // Mock time passage beyond TTL (5 minutes)
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 6 * 60 * 1000);

      // Second lookup should hit database again
      await upcLookupService.lookupByUPC('123456789012');
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledTimes(2);
    });

    it('should clear cache when requested', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(mockProduct);

      // First lookup
      await upcLookupService.lookupByUPC('123456789012');
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledTimes(1);

      // Clear cache
      upcLookupService.clearCache();

      // Second lookup should hit database again
      await upcLookupService.lookupByUPC('123456789012');
      expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledTimes(2);
    });

    it('should provide cache statistics', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(mockProduct);

      const initialStats = upcLookupService.getCacheStats();
      expect(initialStats.size).toBe(0);

      await upcLookupService.lookupByUPC('123456789012');

      const afterLookupStats = upcLookupService.getCacheStats();
      expect(afterLookupStats.size).toBe(1);
    });
  });

  describe('UPC normalization', () => {
    it('should handle various UPC formats', async () => {
      mockDatabaseService.findProductByUPC.mockResolvedValue(mockProduct);

      const testCases = [
        { input: '123456789012', expected: '123456789012' }, // UPC-A
        { input: '1234567890123', expected: '1234567890123' }, // EAN-13
        { input: '12345678901', expected: '123456789017' }, // 11 digits + check
        { input: '123-456-789-012', expected: '123456789012' }, // With dashes
        { input: ' 123 456 789 012 ', expected: '123456789012' }, // With spaces
      ];

      for (const testCase of testCases) {
        await upcLookupService.lookupByUPC(testCase.input);
        expect(mockDatabaseService.findProductByUPC).toHaveBeenCalledWith(testCase.expected);
      }
    });
  });
});
