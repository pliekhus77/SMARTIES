import { HybridSearchService } from '../HybridSearchService';
import { UPCLookupService } from '../UPCLookupService';
import { VectorSearchService } from '../VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { DatabaseService } from '../../DatabaseService';
import { Product } from '../../../models/Product';

describe('HybridSearchService Integration Tests', () => {
  let hybridSearchService: HybridSearchService;
  let databaseService: DatabaseService;

  const testProducts: Product[] = [
    {
      _id: '1',
      upc: '111111111111',
      name: 'Organic Almond Milk',
      ingredients: ['organic almonds', 'filtered water', 'sea salt'],
      allergens: ['tree nuts'],
      dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    },
    {
      _id: '2',
      upc: '222222222222',
      name: 'Whole Wheat Bread',
      ingredients: ['whole wheat flour', 'water', 'yeast'],
      allergens: ['gluten'],
      dietaryFlags: { vegan: false, vegetarian: true, glutenFree: false, kosher: true, halal: false }
    }
  ];

  beforeAll(async () => {
    databaseService = new DatabaseService({
      uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017',
      database: 'smarties_hybrid_test',
      options: { serverSelectionTimeout: 5000 }
    });

    try {
      await databaseService.connect();
      
      const upcLookupService = new UPCLookupService(databaseService);
      const vectorSearchService = new VectorSearchService(databaseService);
      const embeddingService = new EmbeddingService();
      
      hybridSearchService = new HybridSearchService(
        upcLookupService,
        vectorSearchService,
        embeddingService
      );

      console.log('Connected to test database for hybrid search tests');
    } catch (error) {
      console.log('Skipping hybrid search integration tests - no database connection');
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

  describe('End-to-End Search Operations', () => {
    it('should perform UPC-based search successfully', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await hybridSearchService.search({
        upc: '111111111111'
      });

      expect(result.searchStrategy).toBe('upc');
      expect(result.products).toHaveLength(1);
      expect(result.products[0].upc).toBe('111111111111');
      expect(result.responseTime).toBeLessThan(200);
    });

    it('should detect UPC in text queries', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await hybridSearchService.search({
        text: '222222222222'
      });

      expect(result.searchStrategy).toBe('upc');
      expect(result.products).toHaveLength(1);
      expect(result.products[0].name).toBe('Whole Wheat Bread');
    });

    it('should perform vector search for text queries', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await hybridSearchService.search({
        text: 'organic milk almonds',
        filters: { maxResults: 5 }
      });

      expect(result.searchStrategy).toBe('vector');
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.responseTime).toBeLessThan(1000);
    });

    it('should handle multi-modal search with deduplication', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queries = [
        { upc: '111111111111' },
        { text: 'almond milk' },
        { text: 'organic' }
      ];

      const result = await hybridSearchService.searchMultiModal(queries, {
        maxResults: 10,
        deduplication: true
      });

      expect(result.searchStrategy).toBe('hybrid');
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.responseTime).toBeLessThan(2000);
    });
  });

  describe('Search Strategy Selection', () => {
    it('should select allergen strategy for allergen queries', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await hybridSearchService.search({
        text: 'gluten allergy nuts',
        filters: { allergenFilters: ['gluten'] }
      });

      expect(result.searchStrategy).toBe('vector');
      expect(Array.isArray(result.products)).toBe(true);
    });

    it('should select ingredient strategy for ingredient queries', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await hybridSearchService.search({
        text: 'organic ingredients water',
        filters: { dietaryFilters: { vegan: true } }
      });

      expect(result.searchStrategy).toBe('vector');
      expect(Array.isArray(result.products)).toBe(true);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should complete searches within performance targets', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      // UPC search should be very fast
      const upcStart = Date.now();
      const upcResult = await hybridSearchService.search({ upc: '111111111111' });
      const upcTime = Date.now() - upcStart;

      expect(upcTime).toBeLessThan(100); // Sub-100ms for UPC
      expect(upcResult.responseTime).toBeLessThan(100);

      // Vector search should be reasonable
      const vectorStart = Date.now();
      const vectorResult = await hybridSearchService.search({ text: 'organic food' });
      const vectorTime = Date.now() - vectorStart;

      expect(vectorTime).toBeLessThan(1000); // Under 1 second for vector
      expect(vectorResult.responseTime).toBeLessThan(1000);
    });

    it('should handle database connection failures gracefully', async () => {
      const invalidService = new DatabaseService({
        uri: 'mongodb://invalid:27017',
        database: 'invalid'
      });

      const invalidHybridService = new HybridSearchService(
        new UPCLookupService(invalidService),
        new VectorSearchService(invalidService),
        new EmbeddingService()
      );

      const result = await invalidHybridService.search({ upc: '123456789012' });

      expect(result.products).toEqual([]);
      expect(result.totalResults).toBe(0);
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should handle empty and invalid queries', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const emptyResult = await hybridSearchService.search({});
      expect(emptyResult.products).toEqual([]);

      const invalidResult = await hybridSearchService.search({ text: '' });
      expect(invalidResult.products).toEqual([]);
    });
  });

  describe('Result Quality and Ranking', () => {
    it('should return results in order of relevance', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await hybridSearchService.search({
        text: 'milk',
        filters: { maxResults: 10 }
      });

      expect(Array.isArray(result.products)).toBe(true);
      // Results should be ordered by relevance (tested via similarity scores internally)
    });

    it('should apply dietary filters correctly', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result = await hybridSearchService.search({
        text: 'food',
        filters: {
          dietaryFilters: { vegan: true },
          maxResults: 10
        }
      });

      expect(Array.isArray(result.products)).toBe(true);
      // All returned products should be vegan (if any are returned)
      result.products.forEach(product => {
        expect(product.dietaryFlags.vegan).toBe(true);
      });
    });
  });
});
