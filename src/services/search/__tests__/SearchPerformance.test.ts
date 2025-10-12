import { UPCLookupService } from '../UPCLookupService';
import { VectorSearchService } from '../VectorSearchService';
import { HybridSearchService } from '../HybridSearchService';
import { DatabaseService } from '../../DatabaseService';
import { EmbeddingService } from '../../EmbeddingService';
import { Product } from '../../../models/Product';

describe('Search Performance Tests', () => {
  let databaseService: DatabaseService;
  let upcLookupService: UPCLookupService;
  let vectorSearchService: VectorSearchService;
  let hybridSearchService: HybridSearchService;

  const testProducts: Product[] = Array.from({ length: 100 }, (_, i) => ({
    _id: i.toString(),
    upc: `12345678901${i.toString().padStart(2, '0')}`,
    name: `Test Product ${i}`,
    ingredients: ['water', 'sugar', `ingredient${i}`],
    allergens: i % 3 === 0 ? ['gluten'] : ['none'],
    dietaryFlags: {
      vegan: i % 2 === 0,
      vegetarian: i % 3 === 0,
      glutenFree: i % 3 !== 0,
      kosher: i % 4 === 0,
      halal: i % 5 === 0
    }
  }));

  beforeAll(async () => {
    databaseService = new DatabaseService({
      uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017',
      database: 'smarties_performance_test',
      options: { serverSelectionTimeout: 5000, maxPoolSize: 20 }
    });

    try {
      await databaseService.connect();
      
      upcLookupService = new UPCLookupService(databaseService);
      vectorSearchService = new VectorSearchService(databaseService);
      hybridSearchService = new HybridSearchService(
        upcLookupService,
        vectorSearchService,
        new EmbeddingService()
      );

      console.log('Connected to test database for performance tests');
    } catch (error) {
      console.log('Skipping performance tests - no database connection');
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

    // Setup test data
    for (const product of testProducts) {
      try {
        await databaseService.deleteProduct(product.upc);
        await databaseService.createProduct(product);
      } catch (error) {
        // Ignore setup errors
      }
    }
  });

  afterEach(async () => {
    if (!databaseService || !await databaseService.isConnected()) {
      return;
    }

    // Cleanup test data
    for (const product of testProducts) {
      try {
        await databaseService.deleteProduct(product.upc);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('UPC Lookup Performance (<100ms requirement)', () => {
    it('should complete single UPC lookup within 100ms', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const testUPC = testProducts[0].upc;
      
      const startTime = Date.now();
      const result = await upcLookupService.lookupByUPC(testUPC);
      const responseTime = Date.now() - startTime;

      expect(result).toBeTruthy();
      expect(result?.upc).toBe(testUPC);
      expect(responseTime).toBeLessThan(100);
      
      console.log(`UPC lookup time: ${responseTime}ms`);
    });

    it('should maintain performance across multiple UPC lookups', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const lookupTimes: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const testUPC = testProducts[i].upc;
        
        const startTime = Date.now();
        await upcLookupService.lookupByUPC(testUPC);
        const responseTime = Date.now() - startTime;
        
        lookupTimes.push(responseTime);
      }

      const averageTime = lookupTimes.reduce((a, b) => a + b, 0) / lookupTimes.length;
      const maxTime = Math.max(...lookupTimes);

      expect(averageTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(150);
      
      console.log(`Average UPC lookup: ${averageTime.toFixed(2)}ms, Max: ${maxTime}ms`);
    });

    it('should benefit from caching on repeated lookups', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const testUPC = testProducts[0].upc;

      // First lookup (cache miss)
      const startTime1 = Date.now();
      await upcLookupService.lookupByUPC(testUPC);
      const firstLookupTime = Date.now() - startTime1;

      // Second lookup (cache hit)
      const startTime2 = Date.now();
      await upcLookupService.lookupByUPC(testUPC);
      const secondLookupTime = Date.now() - startTime2;

      expect(firstLookupTime).toBeLessThan(100);
      expect(secondLookupTime).toBeLessThan(10);
      expect(secondLookupTime).toBeLessThan(firstLookupTime);
      
      console.log(`Cache miss: ${firstLookupTime}ms, Cache hit: ${secondLookupTime}ms`);
    });
  });

  describe('Vector Search Performance (<500ms target)', () => {
    it('should complete vector search within 500ms', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queryEmbedding = new Array(384).fill(0.5);
      
      const startTime = Date.now();
      const results = await vectorSearchService.searchByIngredients(queryEmbedding, {
        maxResults: 10
      });
      const responseTime = Date.now() - startTime;

      expect(Array.isArray(results)).toBe(true);
      expect(responseTime).toBeLessThan(500);
      
      console.log(`Vector search time: ${responseTime}ms`);
    });

    it('should handle different vector search types efficiently', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queryEmbedding = new Array(384).fill(0.5);
      const searchTypes = [
        () => vectorSearchService.searchByIngredients(queryEmbedding),
        () => vectorSearchService.searchByProductName(queryEmbedding),
        () => vectorSearchService.searchByAllergens(queryEmbedding)
      ];

      const times: number[] = [];

      for (const searchFn of searchTypes) {
        const startTime = Date.now();
        await searchFn();
        const responseTime = Date.now() - startTime;
        times.push(responseTime);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(500);
      expect(maxTime).toBeLessThan(750);
      
      console.log(`Vector search types - Average: ${averageTime.toFixed(2)}ms, Max: ${maxTime}ms`);
    });
  });

  describe('Concurrent Search Load Handling', () => {
    it('should handle concurrent UPC lookups efficiently', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const concurrentLookups = testProducts.slice(0, 20).map(product =>
        upcLookupService.lookupByUPC(product.upc)
      );

      const startTime = Date.now();
      const results = await Promise.all(concurrentLookups);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(20);
      expect(results.every(r => r !== null)).toBe(true);
      expect(totalTime).toBeLessThan(1000); // 20 concurrent lookups in under 1 second
      
      console.log(`20 concurrent UPC lookups: ${totalTime}ms`);
    });

    it('should handle concurrent vector searches', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queryEmbedding = new Array(384).fill(0.5);
      const concurrentSearches = Array.from({ length: 5 }, () =>
        vectorSearchService.searchByIngredients(queryEmbedding, { maxResults: 5 })
      );

      const startTime = Date.now();
      const results = await Promise.all(concurrentSearches);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(5);
      expect(results.every(r => Array.isArray(r))).toBe(true);
      expect(totalTime).toBeLessThan(2000); // 5 concurrent vector searches in under 2 seconds
      
      console.log(`5 concurrent vector searches: ${totalTime}ms`);
    });

    it('should handle mixed concurrent operations', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queryEmbedding = new Array(384).fill(0.5);
      const mixedOperations = [
        ...testProducts.slice(0, 10).map(p => upcLookupService.lookupByUPC(p.upc)),
        ...Array.from({ length: 3 }, () => 
          vectorSearchService.searchByIngredients(queryEmbedding, { maxResults: 5 })
        )
      ];

      const startTime = Date.now();
      const results = await Promise.all(mixedOperations);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(13);
      expect(totalTime).toBeLessThan(2000);
      
      console.log(`Mixed concurrent operations (10 UPC + 3 vector): ${totalTime}ms`);
    });
  });

  describe('Hybrid Search Performance', () => {
    it('should route UPC queries efficiently', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const testUPC = testProducts[0].upc;
      
      const startTime = Date.now();
      const result = await hybridSearchService.search({ upc: testUPC });
      const responseTime = Date.now() - startTime;

      expect(result.searchStrategy).toBe('upc');
      expect(result.products).toHaveLength(1);
      expect(responseTime).toBeLessThan(100);
      expect(result.responseTime).toBeLessThan(100);
      
      console.log(`Hybrid UPC search: ${responseTime}ms`);
    });

    it('should handle text queries within reasonable time', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const startTime = Date.now();
      const result = await hybridSearchService.search({ 
        text: 'organic ingredients',
        filters: { maxResults: 10 }
      });
      const responseTime = Date.now() - startTime;

      expect(result.searchStrategy).toBe('vector');
      expect(Array.isArray(result.products)).toBe(true);
      expect(responseTime).toBeLessThan(1000);
      expect(result.responseTime).toBeLessThan(1000);
      
      console.log(`Hybrid text search: ${responseTime}ms`);
    });

    it('should handle multi-modal searches efficiently', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queries = [
        { upc: testProducts[0].upc },
        { text: 'water sugar' },
        { text: 'vegan food' }
      ];

      const startTime = Date.now();
      const result = await hybridSearchService.searchMultiModal(queries, {
        maxResults: 15,
        deduplication: true
      });
      const responseTime = Date.now() - startTime;

      expect(result.searchStrategy).toBe('hybrid');
      expect(Array.isArray(result.products)).toBe(true);
      expect(responseTime).toBeLessThan(2000);
      expect(result.responseTime).toBeLessThan(2000);
      
      console.log(`Multi-modal search: ${responseTime}ms`);
    });
  });

  describe('Performance Under Load', () => {
    it('should maintain performance with high query volume', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queries = Array.from({ length: 50 }, (_, i) => ({
        upc: testProducts[i % testProducts.length].upc
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        queries.map(query => hybridSearchService.search(query))
      );
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(50);
      expect(results.every(r => r.searchStrategy === 'upc')).toBe(true);
      expect(totalTime).toBeLessThan(5000); // 50 searches in under 5 seconds
      
      const averageTime = totalTime / 50;
      expect(averageTime).toBeLessThan(100);
      
      console.log(`50 searches: ${totalTime}ms total, ${averageTime.toFixed(2)}ms average`);
    });

    it('should handle cache pressure gracefully', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      // Fill cache with many different UPCs
      const cacheFillingPromises = testProducts.map(product =>
        upcLookupService.lookupByUPC(product.upc)
      );

      await Promise.all(cacheFillingPromises);

      // Test performance with full cache
      const testUPC = testProducts[0].upc;
      const startTime = Date.now();
      await upcLookupService.lookupByUPC(testUPC);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(10); // Should be very fast from cache
      
      console.log(`Cache lookup with pressure: ${responseTime}ms`);
    });
  });
});
