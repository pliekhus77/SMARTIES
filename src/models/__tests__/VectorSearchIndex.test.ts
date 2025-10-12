/**
 * Unit tests for Vector Search Index functionality
 * Tests Requirements 1.2, 2.3, and 5.1 implementation
 */

import { VectorSearchIndexManager, VectorSearchUtils, VectorSearchQuery } from '../VectorSearchIndex';
import { DatabaseService } from '../../services/DatabaseService';

// Mock configuration to avoid loading real config
jest.mock('../../config/config', () => ({
  config: {
    mongodb: {
      uri: 'mongodb://localhost:27017',
      database: 'test'
    },
    ai: {
      openaiApiKey: 'test-key',
      anthropicApiKey: 'test-key'
    },
    apis: {
      openFoodFactsUrl: 'https://test.com'
    },
    app: {
      nodeEnv: 'test',
      logLevel: 'error'
    }
  }
}));

// Mock DatabaseService
jest.mock('../../services/DatabaseService');

describe('VectorSearchIndexManager', () => {
  let vectorManager: VectorSearchIndexManager;
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
    vectorManager = new VectorSearchIndexManager(mockDbService);
  });

  describe('createVectorSearchIndexes', () => {
    it('should prepare vector search index definitions', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await vectorManager.createVectorSearchIndexes();

      expect(consoleSpy).toHaveBeenCalledWith('Creating MongoDB Atlas Vector Search indexes...');
      expect(consoleSpy).toHaveBeenCalledWith('Vector search index definitions prepared:');
      
      consoleSpy.mockRestore();
    });
  });

  describe('validateVectorQuery', () => {
    it('should validate correct vector query', () => {
      const query: VectorSearchQuery = {
        queryVector: new Array(384).fill(0.1),
        path: 'ingredients_embedding',
        numCandidates: 100,
        limit: 10,
        minScore: 0.7
      };

      const errors = vectorManager.validateVectorQuery(query);

      expect(errors).toHaveLength(0);
    });

    it('should detect invalid query vector dimensions', () => {
      const query: VectorSearchQuery = {
        queryVector: new Array(100).fill(0.1), // Wrong size
        path: 'ingredients_embedding',
        numCandidates: 100,
        limit: 10
      };

      const errors = vectorManager.validateVectorQuery(query);

      expect(errors).toContain('queryVector must have exactly 384 dimensions, got 100');
    });

    it('should detect invalid embedding path', () => {
      const query: VectorSearchQuery = {
        queryVector: new Array(384).fill(0.1),
        path: 'invalid_embedding', // Invalid path
        numCandidates: 100,
        limit: 10
      };

      const errors = vectorManager.validateVectorQuery(query);

      expect(errors).toContain('path must be one of: ingredients_embedding, product_name_embedding, allergens_embedding');
    });

    it('should detect invalid parameters', () => {
      const query: VectorSearchQuery = {
        queryVector: new Array(384).fill(0.1),
        path: 'ingredients_embedding',
        numCandidates: -1, // Invalid
        limit: 0, // Invalid
        minScore: 1.5 // Invalid
      };

      const errors = vectorManager.validateVectorQuery(query);

      expect(errors).toContain('numCandidates must be positive');
      expect(errors).toContain('limit must be positive');
      expect(errors).toContain('minScore must be between 0.0 and 1.0');
    });

    it('should handle missing required fields', () => {
      const query = {
        path: 'ingredients_embedding',
        numCandidates: 100,
        limit: 10
      } as VectorSearchQuery;

      const errors = vectorManager.validateVectorQuery(query);

      expect(errors).toContain('queryVector is required and must be an array');
    });
  });

  describe('vectorSearch', () => {
    it('should execute vector search with proper pipeline', async () => {
      const query: VectorSearchQuery = {
        queryVector: new Array(384).fill(0.1),
        path: 'ingredients_embedding',
        numCandidates: 100,
        limit: 10,
        minScore: 0.7
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        await vectorManager.vectorSearch('products', query);
      } catch (error) {
        // Expected to fail in test environment without actual MongoDB
      }

      expect(consoleSpy).toHaveBeenCalledWith('Executing vector search query:', expect.objectContaining({
        index: 'ingredients_vector_index',
        path: 'ingredients_embedding',
        numCandidates: 100,
        limit: 10,
        minScore: 0.7
      }));

      consoleSpy.mockRestore();
    });
  });

  describe('hybridSearch', () => {
    it('should combine exact and vector search results', async () => {
      const hybridQuery = {
        exactQuery: { code: '1234567890123' },
        vectorQuery: {
          queryVector: new Array(384).fill(0.1),
          path: 'ingredients_embedding',
          numCandidates: 100,
          limit: 10
        } as VectorSearchQuery,
        maxResults: 20,
        boostExactMatches: true,
        minVectorScore: 0.5
      };

      // Mock database responses
      mockDbService.read.mockResolvedValue({
        success: true,
        data: [{ code: '1234567890123', product_name: 'Exact Match' }]
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      try {
        await vectorManager.hybridSearch('products', hybridQuery);
      } catch (error) {
        // Expected to fail in test environment without actual vector search
      }

      expect(mockDbService.read).toHaveBeenCalledWith('products', { code: '1234567890123' });
      
      consoleSpy.mockRestore();
    });
  });

  describe('getPerformanceRecommendations', () => {
    it('should provide performance recommendations', () => {
      const recommendations = vectorManager.getPerformanceRecommendations();

      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('numCandidates'))).toBe(true);
      expect(recommendations.some(r => r.includes('filters'))).toBe(true);
    });
  });
});

describe('VectorSearchUtils', () => {
  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const vectorA = [1, 0, 0];
      const vectorB = [0, 1, 0];

      const similarity = VectorSearchUtils.cosineSimilarity(vectorA, vectorB);

      expect(similarity).toBe(0); // Orthogonal vectors
    });

    it('should return 1 for identical vectors', () => {
      const vectorA = [1, 2, 3];
      const vectorB = [1, 2, 3];

      const similarity = VectorSearchUtils.cosineSimilarity(vectorA, vectorB);

      expect(similarity).toBeCloseTo(1, 5);
    });

    it('should handle zero vectors', () => {
      const vectorA = [0, 0, 0];
      const vectorB = [1, 2, 3];

      const similarity = VectorSearchUtils.cosineSimilarity(vectorA, vectorB);

      expect(similarity).toBe(0);
    });

    it('should throw error for different length vectors', () => {
      const vectorA = [1, 2];
      const vectorB = [1, 2, 3];

      expect(() => VectorSearchUtils.cosineSimilarity(vectorA, vectorB))
        .toThrow('Vectors must have the same length');
    });
  });

  describe('normalizeVector', () => {
    it('should normalize vector to unit length', () => {
      const vector = [3, 4]; // Length 5
      const normalized = VectorSearchUtils.normalizeVector(vector);

      expect(normalized[0]).toBeCloseTo(0.6, 5);
      expect(normalized[1]).toBeCloseTo(0.8, 5);

      // Check unit length
      const length = Math.sqrt(normalized[0] ** 2 + normalized[1] ** 2);
      expect(length).toBeCloseTo(1, 5);
    });

    it('should handle zero vector', () => {
      const vector = [0, 0, 0];
      const normalized = VectorSearchUtils.normalizeVector(vector);

      expect(normalized).toEqual([0, 0, 0]);
    });
  });

  describe('createSearchParams', () => {
    const queryVector = new Array(384).fill(0.1);

    it('should create exact search parameters', () => {
      const params = VectorSearchUtils.createSearchParams(queryVector, 'exact', 5);

      expect(params.queryVector).toBe(queryVector);
      expect(params.path).toBe('ingredients_embedding');
      expect(params.limit).toBe(5);
      expect(params.numCandidates).toBe(25); // 5 * 5
      expect(params.minScore).toBe(0.9);
    });

    it('should create similar search parameters', () => {
      const params = VectorSearchUtils.createSearchParams(queryVector, 'similar', 10);

      expect(params.limit).toBe(10);
      expect(params.numCandidates).toBe(100); // 10 * 10
      expect(params.minScore).toBe(0.7);
    });

    it('should create broad search parameters', () => {
      const params = VectorSearchUtils.createSearchParams(queryVector, 'broad', 20);

      expect(params.limit).toBe(20);
      expect(params.numCandidates).toBe(400); // 20 * 20
      expect(params.minScore).toBe(0.5);
    });

    it('should use default parameters for unknown search type', () => {
      const params = VectorSearchUtils.createSearchParams(queryVector, 'unknown' as any);

      expect(params.limit).toBe(10);
      expect(params.numCandidates).toBe(100);
      expect(params.minScore).toBe(0.7);
    });
  });
});