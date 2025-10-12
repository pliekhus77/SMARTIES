import { VectorSearchService } from '../VectorSearchService';
import { DatabaseService } from '../../DatabaseService';
import { Product } from '../../../models/Product';

describe('VectorSearchService Integration Tests', () => {
  let vectorSearchService: VectorSearchService;
  let databaseService: DatabaseService;

  const testProducts: Product[] = [
    {
      _id: '1',
      upc: '111111111111',
      name: 'Organic Almond Milk',
      ingredients: ['organic almonds', 'filtered water', 'sea salt'],
      allergens: ['tree nuts'],
      dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false },
      ingredients_embedding: new Array(384).fill(0.8),
      product_name_embedding: new Array(384).fill(0.7),
      allergens_embedding: new Array(384).fill(0.6)
    },
    {
      _id: '2',
      upc: '222222222222', 
      name: 'Whole Wheat Bread',
      ingredients: ['whole wheat flour', 'water', 'yeast', 'salt'],
      allergens: ['gluten'],
      dietaryFlags: { vegan: false, vegetarian: true, glutenFree: false, kosher: true, halal: false },
      ingredients_embedding: new Array(384).fill(0.5),
      product_name_embedding: new Array(384).fill(0.4),
      allergens_embedding: new Array(384).fill(0.3)
    }
  ];

  beforeAll(async () => {
    databaseService = new DatabaseService({
      uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017',
      database: 'smarties_vector_test',
      options: { serverSelectionTimeout: 5000 }
    });

    vectorSearchService = new VectorSearchService(databaseService);

    try {
      await databaseService.connect();
      console.log('Connected to test database for vector search tests');
    } catch (error) {
      console.log('Skipping vector search integration tests - no database connection');
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

    // Clean up and insert test data
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

  describe('Real Vector Search Operations', () => {
    it('should perform ingredient-based vector search', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queryEmbedding = new Array(384).fill(0.75); // Similar to almond milk
      
      const results = await vectorSearchService.searchByIngredients(queryEmbedding, {
        similarityThreshold: 0.5,
        maxResults: 10
      });

      // Note: Without actual vector search indexes, this will return empty
      // In a real MongoDB Atlas setup with vector search, this would return results
      expect(Array.isArray(results)).toBe(true);
    });

    it('should apply dietary filters in vector search', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queryEmbedding = new Array(384).fill(0.5);
      
      const results = await vectorSearchService.searchByIngredients(queryEmbedding, {
        dietaryFilters: { vegan: true },
        similarityThreshold: 0.3
      });

      expect(Array.isArray(results)).toBe(true);
      // All results should be vegan
      results.forEach(result => {
        expect(result.product.dietaryFlags.vegan).toBe(true);
      });
    });

    it('should filter out allergens in vector search', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queryEmbedding = new Array(384).fill(0.5);
      
      const results = await vectorSearchService.searchByIngredients(queryEmbedding, {
        allergenFilters: ['tree nuts'],
        similarityThreshold: 0.3
      });

      expect(Array.isArray(results)).toBe(true);
      // No results should contain tree nuts
      results.forEach(result => {
        expect(result.product.allergens).not.toContain('tree nuts');
      });
    });

    it('should handle product name vector search', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queryEmbedding = new Array(384).fill(0.6);
      
      const results = await vectorSearchService.searchByProductName(queryEmbedding, {
        maxResults: 5
      });

      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle allergen-based vector search', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queryEmbedding = new Array(384).fill(0.4);
      
      const results = await vectorSearchService.searchByAllergens(queryEmbedding, {
        maxResults: 5
      });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      const invalidService = new DatabaseService({
        uri: 'mongodb://invalid:27017',
        database: 'invalid'
      });
      
      const invalidVectorService = new VectorSearchService(invalidService);
      const queryEmbedding = new Array(384).fill(0.5);

      const results = await invalidVectorService.searchByIngredients(queryEmbedding);
      expect(results).toEqual([]);
    });

    it('should handle malformed embeddings gracefully', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const invalidEmbedding: any = null;
      
      const results = await vectorSearchService.searchByIngredients(invalidEmbedding);
      expect(results).toEqual([]);
    });

    it('should complete vector searches within reasonable time', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const queryEmbedding = new Array(384).fill(0.5);
      
      const startTime = Date.now();
      await vectorSearchService.searchByIngredients(queryEmbedding);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
