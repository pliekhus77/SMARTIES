import { HybridSearchService } from '../HybridSearchService';
import { UPCLookupService } from '../UPCLookupService';
import { VectorSearchService } from '../VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { Product } from '../../../models/Product';

jest.mock('../UPCLookupService');
jest.mock('../VectorSearchService');
jest.mock('../../EmbeddingService');

describe('HybridSearchService', () => {
  let hybridSearchService: HybridSearchService;
  let mockUPCLookupService: jest.Mocked<UPCLookupService>;
  let mockVectorSearchService: jest.Mocked<VectorSearchService>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;

  const mockProduct: Product = {
    _id: '1',
    upc: '123456789012',
    name: 'Test Product',
    ingredients: ['water', 'sugar'],
    allergens: ['none'],
    dietaryFlags: { vegan: true, vegetarian: true, glutenFree: false, kosher: false, halal: false }
  };

  const mockEmbedding = new Array(384).fill(0.5);

  beforeEach(() => {
    mockUPCLookupService = new UPCLookupService({} as any) as jest.Mocked<UPCLookupService>;
    mockVectorSearchService = new VectorSearchService({} as any) as jest.Mocked<VectorSearchService>;
    mockEmbeddingService = new EmbeddingService() as jest.Mocked<EmbeddingService>;
    
    hybridSearchService = new HybridSearchService(
      mockUPCLookupService,
      mockVectorSearchService,
      mockEmbeddingService
    );

    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should use UPC lookup for UPC queries', async () => {
      mockUPCLookupService.lookupByUPC.mockResolvedValue(mockProduct);

      const result = await hybridSearchService.search({ upc: '123456789012' });

      expect(mockUPCLookupService.lookupByUPC).toHaveBeenCalledWith('123456789012');
      expect(result.products).toEqual([mockProduct]);
      expect(result.searchStrategy).toBe('upc');
      expect(result.totalResults).toBe(1);
    });

    it('should detect UPC-like text queries', async () => {
      mockUPCLookupService.lookupByUPC.mockResolvedValue(mockProduct);

      const result = await hybridSearchService.search({ text: '123456789012' });

      expect(mockUPCLookupService.lookupByUPC).toHaveBeenCalledWith('123456789012');
      expect(result.searchStrategy).toBe('upc');
    });

    it('should use vector search for text queries', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByIngredients.mockResolvedValue([
        { product: mockProduct, similarityScore: 0.8 }
      ]);

      const result = await hybridSearchService.search({ text: 'organic milk' });

      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('organic milk');
      expect(result.products).toEqual([mockProduct]);
      expect(result.searchStrategy).toBe('vector');
    });

    it('should select appropriate search strategy based on query content', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByAllergens.mockResolvedValue([
        { product: mockProduct, similarityScore: 0.9 }
      ]);

      await hybridSearchService.search({ text: 'contains nuts allergen' });

      expect(mockVectorSearchService.searchByAllergens).toHaveBeenCalled();
    });

    it('should handle embedding generation failures', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(null);

      const result = await hybridSearchService.search({ text: 'test query' });

      expect(result.products).toEqual([]);
      expect(result.totalResults).toBe(0);
    });
  });

  describe('searchMultiModal', () => {
    it('should combine results from multiple queries', async () => {
      const product2: Product = { ...mockProduct, _id: '2', upc: '123456789013' };
      
      mockUPCLookupService.lookupByUPC.mockResolvedValue(mockProduct);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByProductName.mockResolvedValue([
        { product: product2, similarityScore: 0.7 }
      ]);

      const queries = [
        { upc: '123456789012' },
        { text: 'organic bread' }
      ];

      const result = await hybridSearchService.searchMultiModal(queries);

      expect(result.products).toHaveLength(2);
      expect(result.searchStrategy).toBe('hybrid');
    });

    it('should deduplicate results by default', async () => {
      mockUPCLookupService.lookupByUPC.mockResolvedValue(mockProduct);
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByIngredients.mockResolvedValue([
        { product: mockProduct, similarityScore: 0.8 }
      ]);

      const queries = [
        { upc: '123456789012' },
        { text: 'water sugar' } // Should find same product
      ];

      const result = await hybridSearchService.searchMultiModal(queries);

      expect(result.products).toHaveLength(1);
      expect(result.products[0]).toEqual(mockProduct);
    });

    it('should respect maxResults limit', async () => {
      const products = Array.from({ length: 25 }, (_, i) => ({
        ...mockProduct,
        _id: i.toString(),
        upc: `12345678901${i}`
      }));

      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByIngredients.mockResolvedValue(
        products.map(p => ({ product: p, similarityScore: 0.8 }))
      );

      const result = await hybridSearchService.searchMultiModal(
        [{ text: 'test' }],
        { maxResults: 10 }
      );

      expect(result.products).toHaveLength(10);
    });
  });

  describe('strategy selection', () => {
    beforeEach(() => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
    });

    it('should use allergen search for allergen queries', async () => {
      mockVectorSearchService.searchByAllergens.mockResolvedValue([]);

      await hybridSearchService.search({ text: 'gluten allergy' });

      expect(mockVectorSearchService.searchByAllergens).toHaveBeenCalled();
    });

    it('should use ingredient search for ingredient queries', async () => {
      mockVectorSearchService.searchByIngredients.mockResolvedValue([]);

      await hybridSearchService.search({ text: 'organic ingredients' });

      expect(mockVectorSearchService.searchByIngredients).toHaveBeenCalled();
    });

    it('should use product name search for brand queries', async () => {
      mockVectorSearchService.searchByProductName.mockResolvedValue([]);

      await hybridSearchService.search({ text: 'Coca Cola' });

      expect(mockVectorSearchService.searchByProductName).toHaveBeenCalled();
    });

    it('should use multi-strategy for ambiguous queries', async () => {
      mockVectorSearchService.searchByIngredients.mockResolvedValue([]);
      mockVectorSearchService.searchByProductName.mockResolvedValue([]);
      mockVectorSearchService.searchByAllergens.mockResolvedValue([]);

      await hybridSearchService.search({ text: 'healthy food' });

      expect(mockVectorSearchService.searchByIngredients).toHaveBeenCalled();
      expect(mockVectorSearchService.searchByProductName).toHaveBeenCalled();
      expect(mockVectorSearchService.searchByAllergens).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle UPC lookup errors gracefully', async () => {
      mockUPCLookupService.lookupByUPC.mockRejectedValue(new Error('Database error'));

      const result = await hybridSearchService.search({ upc: '123456789012' });

      expect(result.products).toEqual([]);
      expect(result.totalResults).toBe(0);
    });

    it('should handle vector search errors gracefully', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(new Error('Embedding error'));

      const result = await hybridSearchService.search({ text: 'test query' });

      expect(result.products).toEqual([]);
      expect(result.totalResults).toBe(0);
    });
  });
});
