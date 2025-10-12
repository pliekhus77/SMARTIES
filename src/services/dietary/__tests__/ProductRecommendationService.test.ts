import { ProductRecommendationService, UserProfile } from '../ProductRecommendationService';
import { VectorSearchService } from '../../search/VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { AllergenDetectionService } from '../AllergenDetectionService';
import { DietaryComplianceService, DietaryRestriction } from '../DietaryComplianceService';
import { Product } from '../../../models/Product';

jest.mock('../../search/VectorSearchService');
jest.mock('../../EmbeddingService');
jest.mock('../AllergenDetectionService');
jest.mock('../DietaryComplianceService');

describe('ProductRecommendationService', () => {
  let recommendationService: ProductRecommendationService;
  let mockVectorSearchService: jest.Mocked<VectorSearchService>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;
  let mockAllergenService: jest.Mocked<AllergenDetectionService>;
  let mockComplianceService: jest.Mocked<DietaryComplianceService>;

  const safeProduct: Product = {
    _id: '1',
    upc: '123456789012',
    name: 'Organic Almond Milk',
    ingredients: ['almonds', 'water', 'sea salt'],
    allergens: ['tree nuts'],
    dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
  };

  const unsafeProduct: Product = {
    _id: '2',
    upc: '123456789013',
    name: 'Peanut Butter',
    ingredients: ['peanuts', 'salt'],
    allergens: ['peanuts'],
    dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
  };

  const userProfile: UserProfile = {
    allergens: ['peanuts'],
    dietaryRestrictions: [{ type: 'vegan', required: true }],
    preferences: ['organic', 'almond'],
    scanHistory: ['123456789012']
  };

  const mockEmbedding = new Array(384).fill(0.5);

  beforeEach(() => {
    mockVectorSearchService = new VectorSearchService({} as any) as jest.Mocked<VectorSearchService>;
    mockEmbeddingService = new EmbeddingService() as jest.Mocked<EmbeddingService>;
    mockAllergenService = new AllergenDetectionService({} as any, {} as any) as jest.Mocked<AllergenDetectionService>;
    mockComplianceService = new DietaryComplianceService({} as any, {} as any) as jest.Mocked<DietaryComplianceService>;
    
    recommendationService = new ProductRecommendationService(
      mockVectorSearchService,
      mockEmbeddingService,
      mockAllergenService,
      mockComplianceService
    );

    jest.clearAllMocks();
  });

  describe('recommendSaferAlternatives', () => {
    it('should recommend safer alternatives to unsafe products', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByProductName.mockResolvedValue([
        { product: safeProduct, similarityScore: 0.8 },
        { product: unsafeProduct, similarityScore: 0.9 }
      ]);

      mockAllergenService.analyzeProduct.mockImplementation(async (product) => ({
        detectedAllergens: product.allergens?.includes('peanuts') ? [
          { allergen: 'peanuts', riskLevel: 'high' as const, confidence: 0.9, reason: 'Contains peanuts', sources: ['tags'] }
        ] : [],
        crossContaminationRisks: [],
        overallRiskLevel: product.allergens?.includes('peanuts') ? 'danger' as const : 'safe' as const,
        confidence: 0.9
      }));

      mockComplianceService.analyzeCompliance.mockResolvedValue({
        overallCompliance: true,
        confidence: 0.9,
        results: { vegan: { compliant: true, confidence: 0.9, violations: [], warnings: [], certifications: [] } }
      });

      const recommendations = await recommendationService.recommendSaferAlternatives(
        unsafeProduct,
        userProfile
      );

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].product.upc).toBe(safeProduct.upc);
      expect(recommendations[0].safetyLevel).toBe('safe');
    });

    it('should prioritize safety over similarity', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByProductName.mockResolvedValue([
        { product: safeProduct, similarityScore: 0.7 },
        { product: unsafeProduct, similarityScore: 0.9 }
      ]);

      mockAllergenService.analyzeProduct.mockImplementation(async (product) => ({
        detectedAllergens: product.allergens?.includes('peanuts') ? [
          { allergen: 'peanuts', riskLevel: 'high' as const, confidence: 0.9, reason: 'Contains peanuts', sources: ['tags'] }
        ] : [],
        crossContaminationRisks: [],
        overallRiskLevel: product.allergens?.includes('peanuts') ? 'danger' as const : 'safe' as const,
        confidence: 0.9
      }));

      mockComplianceService.analyzeCompliance.mockResolvedValue({
        overallCompliance: true,
        confidence: 0.9,
        results: { vegan: { compliant: true, confidence: 0.9, violations: [], warnings: [], certifications: [] } }
      });

      const recommendations = await recommendationService.recommendSaferAlternatives(
        unsafeProduct,
        userProfile,
        { prioritizeSafety: true }
      );

      expect(recommendations[0].safetyLevel).toBe('safe');
      expect(recommendations[0].product.upc).toBe(safeProduct.upc);
    });
  });

  describe('recommendPersonalized', () => {
    it('should generate personalized recommendations based on preferences', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByIngredients.mockResolvedValue([
        { product: safeProduct, similarityScore: 0.8 }
      ]);

      mockAllergenService.analyzeProduct.mockResolvedValue({
        detectedAllergens: [],
        crossContaminationRisks: [],
        overallRiskLevel: 'safe',
        confidence: 0.9
      });

      mockComplianceService.analyzeCompliance.mockResolvedValue({
        overallCompliance: true,
        confidence: 0.9,
        results: { vegan: { compliant: true, confidence: 0.9, violations: [], warnings: [], certifications: [] } }
      });

      const recommendations = await recommendationService.recommendPersonalized(userProfile);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].reasons.some(r => r.includes('organic'))).toBe(true);
    });

    it('should filter out unsafe products', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByIngredients.mockResolvedValue([
        { product: unsafeProduct, similarityScore: 0.8 }
      ]);

      mockAllergenService.analyzeProduct.mockResolvedValue({
        detectedAllergens: [
          { allergen: 'peanuts', riskLevel: 'high', confidence: 0.9, reason: 'Contains peanuts', sources: ['tags'] }
        ],
        crossContaminationRisks: [],
        overallRiskLevel: 'danger',
        confidence: 0.9
      });

      mockComplianceService.analyzeCompliance.mockResolvedValue({
        overallCompliance: true,
        confidence: 0.9,
        results: { vegan: { compliant: true, confidence: 0.9, violations: [], warnings: [], certifications: [] } }
      });

      const recommendations = await recommendationService.recommendPersonalized(userProfile);

      expect(recommendations).toHaveLength(0); // Unsafe product filtered out
    });
  });

  describe('discoverSimilarProducts', () => {
    it('should discover products based on text query', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByIngredients.mockResolvedValue([
        { product: safeProduct, similarityScore: 0.7 }
      ]);
      mockVectorSearchService.searchByProductName.mockResolvedValue([
        { product: safeProduct, similarityScore: 0.8 }
      ]);

      mockAllergenService.analyzeProduct.mockResolvedValue({
        detectedAllergens: [],
        crossContaminationRisks: [],
        overallRiskLevel: 'safe',
        confidence: 0.9
      });

      mockComplianceService.analyzeCompliance.mockResolvedValue({
        overallCompliance: true,
        confidence: 0.9,
        results: { vegan: { compliant: true, confidence: 0.9, violations: [], warnings: [], certifications: [] } }
      });

      const recommendations = await recommendationService.discoverSimilarProducts(
        'organic almond milk',
        userProfile
      );

      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('organic almond milk');
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].product.upc).toBe(safeProduct.upc);
    });

    it('should apply dietary filters from user profile', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByIngredients.mockResolvedValue([]);
      mockVectorSearchService.searchByProductName.mockResolvedValue([]);

      await recommendationService.discoverSimilarProducts('milk', userProfile);

      expect(mockVectorSearchService.searchByIngredients).toHaveBeenCalledWith(
        mockEmbedding,
        expect.objectContaining({
          dietaryFilters: { vegan: true }
        })
      );
    });
  });

  describe('confidence scoring and ranking', () => {
    it('should boost confidence for preference matches', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByProductName.mockResolvedValue([
        { product: safeProduct, similarityScore: 0.7 } // Contains 'organic' and 'almond'
      ]);

      mockAllergenService.analyzeProduct.mockResolvedValue({
        detectedAllergens: [],
        crossContaminationRisks: [],
        overallRiskLevel: 'safe',
        confidence: 0.9
      });

      mockComplianceService.analyzeCompliance.mockResolvedValue({
        overallCompliance: true,
        confidence: 0.9,
        results: { vegan: { compliant: true, confidence: 0.9, violations: [], warnings: [], certifications: [] } }
      });

      const recommendations = await recommendationService.recommendSaferAlternatives(
        unsafeProduct,
        userProfile
      );

      expect(recommendations[0].reasons.some(r => r.includes('organic'))).toBe(true);
      expect(recommendations[0].confidence).toBeGreaterThan(0.7);
    });

    it('should penalize confidence for allergen risks', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByProductName.mockResolvedValue([
        { product: unsafeProduct, similarityScore: 0.8 }
      ]);

      mockAllergenService.analyzeProduct.mockResolvedValue({
        detectedAllergens: [
          { allergen: 'peanuts', riskLevel: 'high', confidence: 0.9, reason: 'Contains peanuts', sources: ['tags'] }
        ],
        crossContaminationRisks: [],
        overallRiskLevel: 'danger',
        confidence: 0.9
      });

      mockComplianceService.analyzeCompliance.mockResolvedValue({
        overallCompliance: true,
        confidence: 0.9,
        results: { vegan: { compliant: true, confidence: 0.9, violations: [], warnings: [], certifications: [] } }
      });

      const recommendations = await recommendationService.recommendSaferAlternatives(
        safeProduct,
        userProfile
      );

      expect(recommendations[0].confidence).toBeLessThan(0.5); // Heavily penalized
      expect(recommendations[0].safetyLevel).toBe('avoid');
    });
  });

  describe('error handling', () => {
    it('should handle embedding generation failures', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(null);

      const recommendations = await recommendationService.discoverSimilarProducts(
        'test query',
        userProfile
      );

      expect(recommendations).toEqual([]);
    });

    it('should handle vector search failures', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByProductName.mockRejectedValue(new Error('Search failed'));

      const recommendations = await recommendationService.recommendSaferAlternatives(
        unsafeProduct,
        userProfile
      );

      expect(recommendations).toEqual([]);
    });
  });
});
