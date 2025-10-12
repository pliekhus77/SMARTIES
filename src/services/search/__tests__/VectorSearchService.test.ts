import { VectorSearchService, VectorSearchOptions } from '../VectorSearchService';
import { DatabaseService } from '../../DatabaseService';
import { Product } from '../../../models/Product';

jest.mock('../../DatabaseService');

describe('VectorSearchService', () => {
  let vectorSearchService: VectorSearchService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  const mockProducts: Product[] = [
    {
      _id: '1',
      upc: '123456789012',
      name: 'Organic Almond Milk',
      ingredients: ['almonds', 'water', 'sea salt'],
      allergens: ['tree nuts'],
      dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    },
    {
      _id: '2', 
      upc: '123456789013',
      name: 'Whole Wheat Bread',
      ingredients: ['wheat flour', 'water', 'yeast'],
      allergens: ['gluten'],
      dietaryFlags: { vegan: false, vegetarian: true, glutenFree: false, kosher: true, halal: false }
    }
  ];

  const mockEmbedding = new Array(384).fill(0.1);

  beforeEach(() => {
    mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>;
    vectorSearchService = new VectorSearchService(mockDatabaseService);
    jest.clearAllMocks();
  });

  describe('searchByIngredients', () => {
    it('should perform vector search with default options', async () => {
      const mockResults = mockProducts.map(p => ({ ...p, similarityScore: 0.8 }));
      mockDatabaseService.aggregateProducts.mockResolvedValue(mockResults);

      const results = await vectorSearchService.searchByIngredients(mockEmbedding);

      expect(mockDatabaseService.aggregateProducts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $vectorSearch: expect.objectContaining({
              index: 'ingredients_embedding_index',
              path: 'ingredients_embedding',
              queryVector: mockEmbedding
            })
          })
        ])
      );
      expect(results).toHaveLength(2);
      expect(results[0].similarityScore).toBe(0.8);
    });

    it('should apply dietary filters', async () => {
      mockDatabaseService.aggregateProducts.mockResolvedValue([]);

      const options: VectorSearchOptions = {
        dietaryFilters: { vegan: true, glutenFree: true }
      };

      await vectorSearchService.searchByIngredients(mockEmbedding, options);

      expect(mockDatabaseService.aggregateProducts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: {
              'dietaryFlags.vegan': true,
              'dietaryFlags.glutenFree': true
            }
          })
        ])
      );
    });

    it('should apply allergen filters', async () => {
      mockDatabaseService.aggregateProducts.mockResolvedValue([]);

      const options: VectorSearchOptions = {
        allergenFilters: ['tree nuts', 'gluten']
      };

      await vectorSearchService.searchByIngredients(mockEmbedding, options);

      expect(mockDatabaseService.aggregateProducts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: {
              allergens: { $nin: ['tree nuts', 'gluten'] }
            }
          })
        ])
      );
    });

    it('should handle custom similarity threshold', async () => {
      mockDatabaseService.aggregateProducts.mockResolvedValue([]);

      const options: VectorSearchOptions = {
        similarityThreshold: 0.9,
        maxResults: 10
      };

      await vectorSearchService.searchByIngredients(mockEmbedding, options);

      expect(mockDatabaseService.aggregateProducts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $match: {
              similarityScore: { $gte: 0.9 }
            }
          })
        ])
      );
    });
  });

  describe('searchByProductName', () => {
    it('should use product_name_embedding index', async () => {
      mockDatabaseService.aggregateProducts.mockResolvedValue([]);

      await vectorSearchService.searchByProductName(mockEmbedding);

      expect(mockDatabaseService.aggregateProducts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $vectorSearch: expect.objectContaining({
              index: 'product_name_embedding_index',
              path: 'product_name_embedding'
            })
          })
        ])
      );
    });
  });

  describe('searchByAllergens', () => {
    it('should use allergens_embedding index', async () => {
      mockDatabaseService.aggregateProducts.mockResolvedValue([]);

      await vectorSearchService.searchByAllergens(mockEmbedding);

      expect(mockDatabaseService.aggregateProducts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $vectorSearch: expect.objectContaining({
              index: 'allergens_embedding_index',
              path: 'allergens_embedding'
            })
          })
        ])
      );
    });
  });

  describe('error handling', () => {
    it('should return empty array on database error', async () => {
      mockDatabaseService.aggregateProducts.mockRejectedValue(new Error('Database error'));

      const results = await vectorSearchService.searchByIngredients(mockEmbedding);

      expect(results).toEqual([]);
    });
  });
});
