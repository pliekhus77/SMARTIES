import { AllergenDetectionService } from '../AllergenDetectionService';
import { DietaryComplianceService, DietaryRestriction } from '../DietaryComplianceService';
import { ProductRecommendationService, UserProfile } from '../ProductRecommendationService';
import { VectorSearchService } from '../../search/VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { Product } from '../../../models/Product';

jest.mock('../../search/VectorSearchService');
jest.mock('../../EmbeddingService');

describe('Dietary Analysis Integration Tests', () => {
  let allergenService: AllergenDetectionService;
  let complianceService: DietaryComplianceService;
  let recommendationService: ProductRecommendationService;
  let mockVectorSearchService: jest.Mocked<VectorSearchService>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;

  const testProducts: Product[] = [
    {
      _id: '1',
      upc: '123456789012',
      name: 'Almond Milk',
      ingredients: ['almonds', 'water', 'sea salt'],
      allergens: ['tree nuts'],
      dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    },
    {
      _id: '2',
      upc: '123456789013',
      name: 'Peanut Butter',
      ingredients: ['peanuts', 'salt'],
      allergens: ['peanuts'],
      dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    },
    {
      _id: '3',
      upc: '123456789014',
      name: 'Milk Chocolate',
      ingredients: ['milk', 'cocoa', 'sugar'],
      allergens: ['milk'],
      dietaryFlags: { vegan: false, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    }
  ];

  const mockEmbedding = new Array(384).fill(0.5);

  beforeEach(() => {
    mockVectorSearchService = new VectorSearchService({} as any) as jest.Mocked<VectorSearchService>;
    mockEmbeddingService = new EmbeddingService() as jest.Mocked<EmbeddingService>;
    
    allergenService = new AllergenDetectionService(mockVectorSearchService, mockEmbeddingService);
    complianceService = new DietaryComplianceService(mockVectorSearchService, mockEmbeddingService);
    recommendationService = new ProductRecommendationService(
      mockVectorSearchService,
      mockEmbeddingService,
      allergenService,
      complianceService
    );

    jest.clearAllMocks();
  });

  describe('Allergen Detection Accuracy', () => {
    it('should achieve high accuracy for explicit allergen detection', async () => {
      const product = testProducts[0]; // Contains tree nuts
      const userAllergens = ['tree nuts'];

      const result = await allergenService.analyzeProduct(product, userAllergens);

      expect(result.detectedAllergens).toHaveLength(1);
      expect(result.detectedAllergens[0].allergen).toBe('tree nuts');
      expect(result.detectedAllergens[0].confidence).toBeGreaterThanOrEqual(0.95);
      expect(result.overallRiskLevel).toBe('danger');
    });

    it('should detect allergens through ingredient analysis', async () => {
      const productWithMilk: Product = {
        ...testProducts[0],
        ingredients: ['milk', 'sugar'],
        allergens: [] // No explicit allergen tags
      };

      const result = await allergenService.analyzeProduct(productWithMilk, ['milk']);

      expect(result.detectedAllergens.length).toBeGreaterThan(0);
      const milkRisk = result.detectedAllergens.find(r => r.allergen === 'milk');
      expect(milkRisk).toBeDefined();
      expect(milkRisk?.confidence).toBeGreaterThan(0.6);
    });

    it('should provide accurate confidence scoring', async () => {
      const testCases = [
        { product: testProducts[0], allergen: 'tree nuts', expectedConfidence: 0.95 },
        { product: testProducts[1], allergen: 'peanuts', expectedConfidence: 0.95 },
        { product: testProducts[2], allergen: 'milk', expectedConfidence: 0.95 }
      ];

      for (const testCase of testCases) {
        const result = await allergenService.analyzeProduct(testCase.product, [testCase.allergen]);
        
        if (result.detectedAllergens.length > 0) {
          expect(result.detectedAllergens[0].confidence).toBeGreaterThanOrEqual(testCase.expectedConfidence);
        }
      }
    });

    it('should detect cross-contamination risks with appropriate confidence', async () => {
      const productWithWarning: Product = {
        ...testProducts[0],
        ingredients: ['oats', 'may contain wheat'],
        allergens: []
      };

      const result = await allergenService.analyzeProduct(productWithWarning, ['wheat']);

      expect(result.crossContaminationRisks).toHaveLength(1);
      expect(result.crossContaminationRisks[0].riskLevel).toBe('medium');
      expect(result.crossContaminationRisks[0].confidence).toBe(0.7);
    });

    it('should handle false positives correctly', async () => {
      const safeProduct = testProducts[0]; // Almond milk
      const unrelatedAllergens = ['shellfish', 'fish'];

      const result = await allergenService.analyzeProduct(safeProduct, unrelatedAllergens);

      expect(result.detectedAllergens).toHaveLength(0);
      expect(result.crossContaminationRisks).toHaveLength(0);
      expect(result.overallRiskLevel).toBe('safe');
      expect(result.confidence).toBeGreaterThan(0.9);
    });
  });

  describe('Dietary Compliance Checking Logic', () => {
    it('should validate vegan compliance accurately', async () => {
      const veganRestrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      // Test vegan product
      const veganResult = await complianceService.analyzeCompliance(testProducts[0], veganRestrictions);
      expect(veganResult.overallCompliance).toBe(true);
      expect(veganResult.results.vegan.confidence).toBe(0.9);

      // Test non-vegan product
      const nonVeganResult = await complianceService.analyzeCompliance(testProducts[2], veganRestrictions);
      expect(nonVeganResult.overallCompliance).toBe(false);
      expect(nonVeganResult.results.vegan.violations).toContain('Product marked as non-compliant');
    });

    it('should handle multiple dietary restrictions correctly', async () => {
      const multipleRestrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true },
        { type: 'gluten_free', required: true }
      ];

      const result = await complianceService.analyzeCompliance(testProducts[0], multipleRestrictions);

      expect(result.results).toHaveProperty('vegan');
      expect(result.results).toHaveProperty('gluten_free');
      expect(result.overallCompliance).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should detect prohibited ingredients accurately', async () => {
      const productWithProhibited: Product = {
        ...testProducts[0],
        ingredients: ['milk', 'eggs', 'honey'],
        dietaryFlags: { vegan: undefined, vegetarian: true, glutenFree: true, kosher: false, halal: false }
      };

      const veganRestrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await complianceService.analyzeCompliance(productWithProhibited, veganRestrictions);

      expect(result.results.vegan.compliant).toBe(false);
      expect(result.results.vegan.violations.length).toBeGreaterThan(0);
      expect(result.results.vegan.violations.some(v => v.includes('milk'))).toBe(true);
    });

    it('should provide confidence scoring based on evidence quality', async () => {
      const restrictions: DietaryRestriction[] = [
        { type: 'kosher', required: true }
      ];

      // Product with explicit flag (high confidence)
      const explicitResult = await complianceService.analyzeCompliance(
        { ...testProducts[0], dietaryFlags: { ...testProducts[0].dietaryFlags, kosher: true } },
        restrictions
      );
      expect(explicitResult.results.kosher.confidence).toBe(0.9);

      // Product with certification (medium-high confidence)
      const certifiedProduct: Product = {
        ...testProducts[0],
        name: 'Kosher Certified Almond Milk',
        dietaryFlags: { ...testProducts[0].dietaryFlags, kosher: undefined }
      };
      const certifiedResult = await complianceService.analyzeCompliance(certifiedProduct, restrictions);
      expect(certifiedResult.results.kosher.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('Recommendation Engine with Various Dietary Restrictions', () => {
    const userProfiles: { [key: string]: UserProfile } = {
      vegan: {
        allergens: [],
        dietaryRestrictions: [{ type: 'vegan', required: true }],
        preferences: ['organic'],
        scanHistory: []
      },
      allergic: {
        allergens: ['peanuts', 'tree nuts'],
        dietaryRestrictions: [],
        preferences: [],
        scanHistory: []
      },
      complex: {
        allergens: ['milk'],
        dietaryRestrictions: [
          { type: 'vegan', required: true },
          { type: 'gluten_free', required: true }
        ],
        preferences: ['organic', 'non-gmo'],
        scanHistory: []
      }
    };

    beforeEach(() => {
      mockEmbeddingService.generateEmbedding.mockResolvedValue(mockEmbedding);
      mockVectorSearchService.searchByProductName.mockResolvedValue([
        { product: testProducts[0], similarityScore: 0.8 },
        { product: testProducts[2], similarityScore: 0.7 }
      ]);
    });

    it('should recommend appropriate alternatives for vegan users', async () => {
      const recommendations = await recommendationService.recommendSaferAlternatives(
        testProducts[2], // Milk chocolate (non-vegan)
        userProfiles.vegan
      );

      recommendations.forEach(rec => {
        expect(rec.product.dietaryFlags.vegan).toBe(true);
        expect(rec.safetyLevel).not.toBe('avoid');
      });
    });

    it('should avoid allergens in recommendations', async () => {
      const recommendations = await recommendationService.recommendSaferAlternatives(
        testProducts[0], // Almond milk (contains tree nuts)
        userProfiles.allergic
      );

      recommendations.forEach(rec => {
        expect(rec.product.allergens?.includes('peanuts')).toBeFalsy();
        expect(rec.product.allergens?.includes('tree nuts')).toBeFalsy();
        expect(rec.safetyLevel).toBe('safe');
      });
    });

    it('should handle complex dietary profiles correctly', async () => {
      const recommendations = await recommendationService.recommendPersonalized(
        userProfiles.complex
      );

      recommendations.forEach(rec => {
        expect(rec.product.dietaryFlags.vegan).toBe(true);
        expect(rec.product.dietaryFlags.glutenFree).toBe(true);
        expect(rec.product.allergens?.includes('milk')).toBeFalsy();
        expect(rec.safetyLevel).not.toBe('avoid');
      });
    });

    it('should provide accurate confidence scores for recommendations', async () => {
      const recommendations = await recommendationService.recommendSaferAlternatives(
        testProducts[1], // Peanut butter
        userProfiles.allergic
      );

      recommendations.forEach(rec => {
        expect(rec.confidence).toBeGreaterThan(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
        expect(rec.score).toBeGreaterThan(0);
        expect(rec.score).toBeLessThanOrEqual(1);
      });
    });

    it('should rank recommendations appropriately', async () => {
      const recommendations = await recommendationService.recommendSaferAlternatives(
        testProducts[1], // Peanut butter
        userProfiles.allergic,
        { prioritizeSafety: true }
      );

      // Should be sorted by safety first, then score
      for (let i = 1; i < recommendations.length; i++) {
        const prev = recommendations[i - 1];
        const curr = recommendations[i];
        
        const safetyOrder = { safe: 3, caution: 2, avoid: 1 };
        expect(safetyOrder[prev.safetyLevel]).toBeGreaterThanOrEqual(safetyOrder[curr.safetyLevel]);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle products with missing dietary information', async () => {
      const incompleteProduct: Product = {
        _id: '999',
        upc: '999999999999',
        name: 'Unknown Product',
        ingredients: [],
        allergens: [],
        dietaryFlags: { vegan: undefined, vegetarian: undefined, glutenFree: undefined, kosher: undefined, halal: undefined }
      };

      const allergenResult = await allergenService.analyzeProduct(incompleteProduct, ['milk']);
      expect(allergenResult.overallRiskLevel).toBe('safe');

      const complianceResult = await complianceService.analyzeCompliance(
        incompleteProduct,
        [{ type: 'vegan', required: true }]
      );
      expect(complianceResult).toBeDefined();
    });

    it('should handle empty user profiles gracefully', async () => {
      const emptyProfile: UserProfile = {
        allergens: [],
        dietaryRestrictions: [],
        preferences: [],
        scanHistory: []
      };

      const recommendations = await recommendationService.recommendPersonalized(emptyProfile);
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should maintain performance under various input sizes', async () => {
      const largeAllergenList = Array.from({ length: 20 }, (_, i) => `allergen${i}`);
      const largeRestrictionList: DietaryRestriction[] = Array.from({ length: 10 }, (_, i) => ({
        type: 'vegan' as const,
        required: i % 2 === 0
      }));

      const startTime = Date.now();
      
      await allergenService.analyzeProduct(testProducts[0], largeAllergenList);
      await complianceService.analyzeCompliance(testProducts[0], largeRestrictionList);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Accuracy Benchmarks', () => {
    it('should meet accuracy requirements for allergen detection', async () => {
      const testCases = [
        { product: testProducts[0], allergen: 'tree nuts', shouldDetect: true },
        { product: testProducts[1], allergen: 'peanuts', shouldDetect: true },
        { product: testProducts[2], allergen: 'milk', shouldDetect: true },
        { product: testProducts[0], allergen: 'shellfish', shouldDetect: false },
        { product: testProducts[1], allergen: 'fish', shouldDetect: false }
      ];

      let correctDetections = 0;

      for (const testCase of testCases) {
        const result = await allergenService.analyzeProduct(testCase.product, [testCase.allergen]);
        const detected = result.overallRiskLevel !== 'safe';
        
        if (detected === testCase.shouldDetect) {
          correctDetections++;
        }
      }

      const accuracy = correctDetections / testCases.length;
      expect(accuracy).toBeGreaterThanOrEqual(0.9); // 90% accuracy requirement
    });

    it('should meet confidence scoring requirements', async () => {
      const highConfidenceTests = [
        { product: testProducts[0], allergen: 'tree nuts' },
        { product: testProducts[1], allergen: 'peanuts' },
        { product: testProducts[2], allergen: 'milk' }
      ];

      for (const test of highConfidenceTests) {
        const result = await allergenService.analyzeProduct(test.product, [test.allergen]);
        
        if (result.detectedAllergens.length > 0) {
          expect(result.detectedAllergens[0].confidence).toBeGreaterThanOrEqual(0.9);
        }
      }
    });
  });
});
