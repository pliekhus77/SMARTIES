import { DietaryComplianceService, DietaryRestriction } from '../DietaryComplianceService';
import { VectorSearchService } from '../../search/VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { Product } from '../../../models/Product';

jest.mock('../../search/VectorSearchService');
jest.mock('../../EmbeddingService');

describe('DietaryComplianceService', () => {
  let complianceService: DietaryComplianceService;
  let mockVectorSearchService: jest.Mocked<VectorSearchService>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;

  const veganProduct: Product = {
    _id: '1',
    upc: '123456789012',
    name: 'Almond Milk',
    ingredients: ['almonds', 'water', 'sea salt'],
    allergens: ['tree nuts'],
    dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
  };

  const nonVeganProduct: Product = {
    _id: '2',
    upc: '123456789013',
    name: 'Cow Milk',
    ingredients: ['milk', 'vitamin D'],
    allergens: ['milk'],
    dietaryFlags: { vegan: false, vegetarian: true, glutenFree: true, kosher: true, halal: false }
  };

  const mockEmbedding = new Array(384).fill(0.5);

  beforeEach(() => {
    mockVectorSearchService = new VectorSearchService({} as any) as jest.Mocked<VectorSearchService>;
    mockEmbeddingService = new EmbeddingService() as jest.Mocked<EmbeddingService>;
    
    complianceService = new DietaryComplianceService(
      mockVectorSearchService,
      mockEmbeddingService
    );

    jest.clearAllMocks();
  });

  describe('analyzeCompliance', () => {
    it('should validate vegan compliance correctly', async () => {
      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await complianceService.analyzeCompliance(veganProduct, restrictions);

      expect(result.overallCompliance).toBe(true);
      expect(result.results.vegan.compliant).toBe(true);
      expect(result.results.vegan.confidence).toBeGreaterThan(0.8);
    });

    it('should detect non-vegan products', async () => {
      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await complianceService.analyzeCompliance(nonVeganProduct, restrictions);

      expect(result.overallCompliance).toBe(false);
      expect(result.results.vegan.compliant).toBe(false);
      expect(result.results.vegan.violations).toContain('Product marked as non-compliant');
    });

    it('should check prohibited ingredients', async () => {
      const productWithMilk: Product = {
        ...veganProduct,
        ingredients: ['milk', 'sugar'],
        dietaryFlags: { vegan: undefined, vegetarian: true, glutenFree: true, kosher: false, halal: false }
      };

      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await complianceService.analyzeCompliance(productWithMilk, restrictions);

      expect(result.results.vegan.compliant).toBe(false);
      expect(result.results.vegan.violations.some(v => v.includes('milk'))).toBe(true);
    });

    it('should detect certifications', async () => {
      const certifiedProduct: Product = {
        ...veganProduct,
        name: 'Organic Kosher Almond Milk',
        dietaryFlags: { vegan: undefined, vegetarian: true, glutenFree: true, kosher: undefined, halal: false }
      };

      const restrictions: DietaryRestriction[] = [
        { type: 'kosher', required: true }
      ];

      const result = await complianceService.analyzeCompliance(certifiedProduct, restrictions);

      expect(result.results.kosher.certifications).toContain('kosher');
    });

    it('should handle multiple dietary restrictions', async () => {
      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true },
        { type: 'gluten_free', required: true }
      ];

      const result = await complianceService.analyzeCompliance(veganProduct, restrictions);

      expect(result.results).toHaveProperty('vegan');
      expect(result.results).toHaveProperty('gluten_free');
      expect(result.overallCompliance).toBe(true);
    });
  });

  describe('findAlternativeProducts', () => {
    it('should find compliant alternatives', async () => {
      const alternatives = [veganProduct];
      
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByProductName.mockResolvedValue([
        { product: veganProduct, similarityScore: 0.8 },
        { product: nonVeganProduct, similarityScore: 0.7 }
      ]);

      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await complianceService.findAlternativeProducts(nonVeganProduct, restrictions);

      expect(mockVectorSearchService.searchByProductName).toHaveBeenCalledWith(
        mockEmbedding,
        expect.objectContaining({
          dietaryFilters: { vegan: true }
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0].upc).toBe(veganProduct.upc);
    });

    it('should handle embedding generation failures', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(null);

      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await complianceService.findAlternativeProducts(nonVeganProduct, restrictions);

      expect(result).toEqual([]);
    });
  });

  describe('validateCertificationEquivalency', () => {
    it('should validate kosher certification equivalency', () => {
      const result1 = complianceService.validateCertificationEquivalency('OU Kosher', 'OK Kosher', 'kosher');
      expect(result1).toBe(true);

      const result2 = complianceService.validateCertificationEquivalency('Kosher', 'Halal', 'kosher');
      expect(result2).toBe(false);
    });

    it('should validate organic certification equivalency', () => {
      const result = complianceService.validateCertificationEquivalency('USDA Organic', 'Certified Organic', 'organic');
      expect(result).toBe(true);
    });
  });

  describe('cultural compliance checking', () => {
    it('should use vector similarity for cultural compliance', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByIngredients.mockResolvedValue([
        { product: veganProduct, similarityScore: 0.9 }
      ]);

      const restrictions: DietaryRestriction[] = [
        { type: 'kosher', required: true }
      ];

      const productWithoutFlags: Product = {
        ...veganProduct,
        dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: undefined, halal: false }
      };

      const result = await complianceService.analyzeCompliance(productWithoutFlags, restrictions);

      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('kosher compliant food');
    });
  });

  describe('ingredient substitution suggestions', () => {
    it('should suggest vegan substitutions', async () => {
      const productWithEggs: Product = {
        ...veganProduct,
        ingredients: ['flour', 'egg', 'sugar'],
        dietaryFlags: { vegan: undefined, vegetarian: true, glutenFree: true, kosher: false, halal: false }
      };

      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await complianceService.analyzeCompliance(productWithEggs, restrictions);

      expect(result.results.vegan.warnings.some(w => w.includes('substituting egg'))).toBe(true);
    });
  });

  describe('confidence calculation', () => {
    it('should provide high confidence for explicit flags', async () => {
      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await complianceService.analyzeCompliance(veganProduct, restrictions);

      expect(result.results.vegan.confidence).toBe(0.9);
    });

    it('should adjust confidence based on violations and certifications', async () => {
      const productWithViolations: Product = {
        ...veganProduct,
        ingredients: ['milk', 'organic almonds'],
        name: 'Organic Certified Product',
        dietaryFlags: { vegan: undefined, vegetarian: true, glutenFree: true, kosher: false, halal: false }
      };

      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await complianceService.analyzeCompliance(productWithViolations, restrictions);

      expect(result.results.vegan.confidence).toBeLessThan(0.9);
      expect(result.results.vegan.compliant).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle vector search failures gracefully', async () => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByIngredients.mockRejectedValue(new Error('Search failed'));

      const restrictions: DietaryRestriction[] = [
        { type: 'kosher', required: true }
      ];

      const productWithoutFlags: Product = {
        ...veganProduct,
        dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: undefined, halal: false }
      };

      const result = await complianceService.analyzeCompliance(productWithoutFlags, restrictions);

      expect(result).toBeDefined();
      expect(result.results.kosher).toBeDefined();
    });
  });
});
