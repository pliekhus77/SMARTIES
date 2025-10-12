import { UPCLookupService } from '../UPCLookupService';
import { DatabaseService } from '../../DatabaseService';
import { Product } from '../../../models/Product';

describe('UPCLookupService Integration Tests', () => {
  let upcLookupService: UPCLookupService;
  let databaseService: DatabaseService;

  const testProduct: Product = {
    _id: '507f1f77bcf86cd799439011',
    upc: '123456789012',
    name: 'Integration Test Product',
    ingredients: ['water', 'organic sugar', 'natural flavoring'],
    allergens: ['none'],
    dietaryFlags: {
      vegan: true,
      vegetarian: true,
      glutenFree: true,
      kosher: false,
      halal: false
    }
  };

  beforeAll(async () => {
    // Initialize database service with test configuration
    databaseService = new DatabaseService({
      uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017',
      database: 'smarties_test',
      options: {
        serverSelectionTimeout: 5000,
        maxPoolSize: 5
      }
    });

    upcLookupService = new UPCLookupService(databaseService);

    try {
      await databaseService.connect();
      console.log('Connected to test database');
    } catch (error) {
      console.log('Skipping integration tests - no database connection');
      return;
    }
  });

  afterAll(async () => {
    if (databaseService) {
      await databaseService.disconnect();
    }
  });

  beforeEach(async () => {
    if (!databaseService || !await databaseService.isConnected()) {
      return;
    }

    // Clean up test data
    try {
      await databaseService.deleteProduct(testProduct.upc);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Real Database Integration', () => {
    it('should perform end-to-end UPC lookup with real database', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Insert test product
      const createResult = await databaseService.createProduct(testProduct);
      expect(createResult.success).toBe(true);

      // Perform UPC lookup
      const startTime = Date.now();
      const result = await upcLookupService.lookupByUPC(testProduct.upc);
      const responseTime = Date.now() - startTime;

      // Verify results
      expect(result).toBeTruthy();
      expect(result?.upc).toBe(testProduct.upc);
      expect(result?.name).toBe(testProduct.name);
      expect(responseTime).toBeLessThan(100); // Performance requirement

      // Cleanup
      await databaseService.deleteProduct(testProduct.upc);
    });

    it('should handle non-existent products gracefully', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await upcLookupService.lookupByUPC('999999999999');
      expect(result).toBeNull();
    });

    it('should demonstrate caching benefits with real database', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Insert test product
      await databaseService.createProduct(testProduct);

      // First lookup (database hit)
      const startTime1 = Date.now();
      const result1 = await upcLookupService.lookupByUPC(testProduct.upc);
      const firstLookupTime = Date.now() - startTime1;

      // Second lookup (cache hit)
      const startTime2 = Date.now();
      const result2 = await upcLookupService.lookupByUPC(testProduct.upc);
      const secondLookupTime = Date.now() - startTime2;

      expect(result1).toEqual(result2);
      expect(secondLookupTime).toBeLessThan(firstLookupTime);
      expect(secondLookupTime).toBeLessThan(10); // Cache should be very fast

      // Cleanup
      await databaseService.deleteProduct(testProduct.upc);
    });

    it('should handle database connection failures', async () => {
      // Create service with invalid connection
      const invalidService = new DatabaseService({
        uri: 'mongodb://invalid:27017',
        database: 'invalid'
      });
      
      const invalidLookupService = new UPCLookupService(invalidService);

      const result = await invalidLookupService.lookupByUPC('123456789012');
      expect(result).toBeNull();
    });
  });

  describe('Performance Validation', () => {
    it('should meet sub-100ms requirement consistently', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Insert test product
      await databaseService.createProduct(testProduct);

      // Clear cache to ensure database hits
      upcLookupService.clearCache();

      // Perform multiple lookups and measure performance
      const lookupTimes: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await upcLookupService.lookupByUPC(testProduct.upc);
        const responseTime = Date.now() - startTime;
        lookupTimes.push(responseTime);
        
        // Clear cache for each test to ensure database hit
        upcLookupService.clearCache();
      }

      // Verify all lookups meet performance requirement
      const averageTime = lookupTimes.reduce((a, b) => a + b, 0) / lookupTimes.length;
      const maxTime = Math.max(...lookupTimes);

      expect(averageTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(150); // Allow some variance
      
      console.log(`Average lookup time: ${averageTime.toFixed(2)}ms`);
      console.log(`Max lookup time: ${maxTime}ms`);

      // Cleanup
      await databaseService.deleteProduct(testProduct.upc);
    });
  });
});
