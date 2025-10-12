import { AllergenDetectionService } from '../AllergenDetectionService';
import { VectorSearchService } from '../../search/VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { Product } from '../../../models/Product';

jest.mock('../../search/VectorSearchService');
jest.mock('../../EmbeddingService');

describe('AllergenDetectionService', () => {
  let allergenService: AllergenDetectionService;
  let mockVectorSearchService: jest.Mocked<VectorSearchService>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;

  const mockProduct: Product = {
    _id: '1',
    upc: '123456789012',
    name: 'Almond Milk',
    ingredients: ['almonds', 'water', 'sea salt'],
    allergens: ['tree nuts'],
    dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
  };

  const mockEmbedding = new Array(384).fill(0.5);

  beforeEach(() => {
    mockVectorSearchService = new VectorSearchService({} as any) as jest.Mocked<VectorSearchService>;
    mockEmbeddingService = new EmbeddingService() as jest.Mocked<EmbeddingService>;
    
    allergenService = new AllergenDetectionService(
      mockVectorSearchService,
      mockEmbeddingService
    );

    jest.clearAllMocks();
  });

  describe('analyzeProduct', () => {
    it('should detect high-risk allergens from allergen tags', async () => {
      const result = await allergenService.analyzeProduct(mockProduct, ['tree nuts']);

      expect(result.detectedAllergens).toHaveLength(1);
      expect(result.detectedAllergens[0]).toMatchObject({
        allergen: 'tree nuts',
        riskLevel: 'high',
        confidence: 0.95,
        reason: 'Listed in allergen tags'
      });
      expect(result.overallRiskLevel).toBe('danger');
    });

    it('should detect allergens through keyword matching', async () => {
      const productWithMilk: Product = {
        ...mockProduct,
        ingredients: ['milk', 'sugar', 'vanilla'],
        allergens: []
      };

      const result = await allergenService.analyzeProduct(productWithMilk, ['milk']);

      expect(result.detectedAllergens).toHaveLength(1);
      expect(result.detectedAllergens[0]).toMatchObject({
        allergen: 'milk',
        riskLevel: 'medium',
        reason: expect.stringContaining('Contains allergen keywords: milk')
      });
    });

    it('should detect cross-contamination risks', async () => {
      const productWithWarning: Product = {
        ...mockProduct,
        ingredients: ['oats', 'may contain wheat'],
        allergens: []
      };

      const result = await allergenService.analyzeProduct(productWithWarning, ['wheat']);

      expect(result.crossContaminationRisks).toHaveLength(1);
      expect(result.crossContaminationRisks[0]).toMatchObject({
        allergen: 'wheat',
        riskLevel: 'medium',
        reason: expect.stringContaining('Cross-contamination warning')
      });
    });

    it('should use vector similarity for allergen detection', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByAllergens.mockResolvedValue([
        { product: mockProduct, similarityScore: 0.85 }
      ]);

      const result = await allergenService.analyzeProduct(mockProduct, ['nuts']);

      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('nuts');
      expect(result.detectedAllergens.some(r => r.sources.includes('vector_similarity'))).toBe(true);
    });

    it('should return safe when no allergens detected', async () => {
      const safeProduct: Product = {
        ...mockProduct,
        ingredients: ['water', 'sugar'],
        allergens: []
      };

      const result = await allergenService.analyzeProduct(safeProduct, ['milk']);

      expect(result.detectedAllergens).toHaveLength(0);
      expect(result.crossContaminationRisks).toHaveLength(0);
      expect(result.overallRiskLevel).toBe('safe');
      expect(result.confidence).toBe(0.95);
    });

    it('should calculate appropriate confidence scores', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByAllergens.mockResolvedValue([
        { product: mockProduct, similarityScore: 0.9 }
      ]);

      const result = await allergenService.analyzeProduct(mockProduct, ['tree nuts']);

      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.confidence).toBeLessThanOrEqual(0.95);
    });
  });

  describe('detectAllergenSynonyms', () => {
    it('should find allergen synonyms using vector similarity', async () => {
      const synonymProduct: Product = {
        ...mockProduct,
        allergens: ['nuts', 'almonds']
      };

      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByAllergens.mockResolvedValue([
        { product: synonymProduct, similarityScore: 0.9 }
      ]);

      const synonyms = await allergenService.detectAllergenSynonyms('tree nuts');

      expect(synonyms).toContain('nuts');
      expect(synonyms).toContain('almonds');
      expect(synonyms).not.toContain('tree nuts');
    });

    it('should handle embedding generation failures', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(null);

      const synonyms = await allergenService.detectAllergenSynonyms('milk');

      expect(synonyms).toEqual([]);
    });
  });

  describe('risk level calculation', () => {
    it('should prioritize high-risk allergens', async () => {
      const multiAllergenProduct: Product = {
        ...mockProduct,
        ingredients: ['milk', 'may contain nuts'],
        allergens: ['milk']
      };

      const result = await allergenService.analyzeProduct(multiAllergenProduct, ['milk', 'nuts']);

      expect(result.overallRiskLevel).toBe('danger'); // High risk from direct allergen
    });

    it('should show caution for medium-risk only', async () => {
      const warningProduct: Product = {
        ...mockProduct,
        ingredients: ['oats', 'may contain wheat'],
        allergens: []
      };

      const result = await allergenService.analyzeProduct(warningProduct, ['wheat']);

      expect(result.overallRiskLevel).toBe('caution');
    });
  });

  describe('error handling', () => {
    it('should handle vector search failures gracefully', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByAllergens.mockRejectedValue(new Error('Search failed'));

      const result = await allergenService.analyzeProduct(mockProduct, ['milk']);

      expect(result).toBeDefined();
      expect(result.overallRiskLevel).toBe('safe');
    });

    it('should handle missing product data', async () => {
      const incompleteProduct: Product = {
        _id: '1',
        upc: '123456789012',
        name: 'Unknown Product',
        ingredients: [],
        allergens: [],
        dietaryFlags: { vegan: false, vegetarian: false, glutenFree: false, kosher: false, halal: false }
      };

      const result = await allergenService.analyzeProduct(incompleteProduct, ['milk']);

      expect(result.overallRiskLevel).toBe('safe');
    });
  });
});
