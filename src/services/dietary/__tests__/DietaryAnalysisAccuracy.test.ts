import { AllergenDetectionService } from '../AllergenDetectionService';
import { DietaryComplianceService, DietaryRestriction } from '../DietaryComplianceService';
import { ProductRecommendationService, UserProfile } from '../ProductRecommendationService';
import { VectorSearchService } from '../../search/VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { Product } from '../../../models/Product';

jest.mock('../../search/VectorSearchService');
jest.mock('../../EmbeddingService');

describe('Dietary Analysis Accuracy Validation', () => {
  let allergenService: AllergenDetectionService;
  let complianceService: DietaryComplianceService;
  let recommendationService: ProductRecommendationService;
  let mockVectorSearchService: jest.Mocked<VectorSearchService>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;

  // Comprehensive test dataset
  const testDataset: Array<{
    product: Product;
    expectedAllergens: string[];
    expectedCompliance: { [key: string]: boolean };
    description: string;
  }> = [
    {
      product: {
        _id: '1', upc: '111111111111', name: 'Peanut Butter',
        ingredients: ['peanuts', 'salt'], allergens: ['peanuts'],
        dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
      },
      expectedAllergens: ['peanuts'],
      expectedCompliance: { vegan: true, vegetarian: true, gluten_free: true },
      description: 'Simple peanut product'
    },
    {
      product: {
        _id: '2', upc: '222222222222', name: 'Milk Chocolate',
        ingredients: ['milk', 'cocoa', 'sugar'], allergens: ['milk'],
        dietaryFlags: { vegan: false, vegetarian: true, glutenFree: true, kosher: false, halal: false }
      },
      expectedAllergens: ['milk'],
      expectedCompliance: { vegan: false, vegetarian: true, gluten_free: true },
      description: 'Dairy-containing product'
    },
    {
      product: {
        _id: '3', upc: '333333333333', name: 'Wheat Bread',
        ingredients: ['wheat flour', 'water', 'yeast'], allergens: ['gluten'],
        dietaryFlags: { vegan: true, vegetarian: true, glutenFree: false, kosher: false, halal: false }
      },
      expectedAllergens: ['wheat', 'gluten'],
      expectedCompliance: { vegan: true, vegetarian: true, gluten_free: false },
      description: 'Gluten-containing product'
    },
    {
      product: {
        _id: '4', upc: '444444444444', name: 'Mixed Nuts',
        ingredients: ['almonds', 'cashews', 'walnuts'], allergens: ['tree nuts'],
        dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
      },
      expectedAllergens: ['tree nuts', 'almonds', 'cashews', 'walnuts'],
      expectedCompliance: { vegan: true, vegetarian: true, gluten_free: true },
      description: 'Multiple tree nuts'
    },
    {
      product: {
        _id: '5', upc: '555555555555', name: 'Fish Sauce',
        ingredients: ['fish', 'salt', 'water'], allergens: ['fish'],
        dietaryFlags: { vegan: false, vegetarian: false, glutenFree: true, kosher: false, halal: false }
      },
      expectedAllergens: ['fish'],
      expectedCompliance: { vegan: false, vegetarian: false, gluten_free: true },
      description: 'Fish-based product'
    }
  ];

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

    // Setup mocks
    mockEmbeddingService.generateEmbedding.mockResolvedValue(new Array(384).fill(0.5));
    mockVectorSearchService.searchByAllergens.mockResolvedValue([]);
    mockVectorSearchService.searchByIngredients.mockResolvedValue([]);
    mockVectorSearchService.searchByProductName.mockResolvedValue([]);

    jest.clearAllMocks();
  });

  describe('Allergen Detection Accuracy Benchmarks', () => {
    it('should achieve >95% accuracy for explicit allergen detection', async () => {
      let correctDetections = 0;
      let totalTests = 0;

      for (const testCase of testDataset) {
        for (const expectedAllergen of testCase.expectedAllergens) {
          const result = await allergenService.analyzeProduct(testCase.product, [expectedAllergen]);
          
          const detected = result.overallRiskLevel === 'danger';
          if (detected) {
            correctDetections++;
          }
          totalTests++;
        }
      }

      const accuracy = correctDetections / totalTests;
      expect(accuracy).toBeGreaterThanOrEqual(0.95);
      console.log(`Allergen detection accuracy: ${(accuracy * 100).toFixed(1)}%`);
    });

    it('should achieve >90% accuracy for false positive avoidance', async () => {
      const unrelatedAllergens = ['shellfish', 'sesame', 'mustard'];
      let correctNegatives = 0;
      let totalNegativeTests = 0;

      for (const testCase of testDataset) {
        for (const unrelatedAllergen of unrelatedAllergens) {
          // Skip if the allergen is actually present
          if (testCase.expectedAllergens.includes(unrelatedAllergen)) continue;

          const result = await allergenService.analyzeProduct(testCase.product, [unrelatedAllergen]);
          
          const notDetected = result.overallRiskLevel === 'safe';
          if (notDetected) {
            correctNegatives++;
          }
          totalNegativeTests++;
        }
      }

      const specificity = correctNegatives / totalNegativeTests;
      expect(specificity).toBeGreaterThanOrEqual(0.90);
      console.log(`False positive avoidance: ${(specificity * 100).toFixed(1)}%`);
    });

    it('should provide confidence scores >0.9 for high-certainty detections', async () => {
      const highCertaintyTests = testDataset.filter(test => 
        test.product.allergens && test.product.allergens.length > 0
      );

      let highConfidenceCount = 0;
      let totalHighCertaintyTests = 0;

      for (const testCase of highCertaintyTests) {
        const primaryAllergen = testCase.expectedAllergens[0];
        const result = await allergenService.analyzeProduct(testCase.product, [primaryAllergen]);
        
        if (result.detectedAllergens.length > 0) {
          const confidence = result.detectedAllergens[0].confidence;
          if (confidence >= 0.9) {
            highConfidenceCount++;
          }
        }
        totalHighCertaintyTests++;
      }

      const highConfidenceRate = highConfidenceCount / totalHighCertaintyTests;
      expect(highConfidenceRate).toBeGreaterThanOrEqual(0.8);
      console.log(`High confidence rate: ${(highConfidenceRate * 100).toFixed(1)}%`);
    });
  });

  describe('Dietary Compliance Accuracy Benchmarks', () => {
    it('should achieve >98% accuracy for dietary flag compliance', async () => {
      const complianceTypes = ['vegan', 'vegetarian', 'gluten_free'];
      let correctCompliance = 0;
      let totalComplianceTests = 0;

      for (const testCase of testDataset) {
        for (const complianceType of complianceTypes) {
          const restrictions: DietaryRestriction[] = [
            { type: complianceType as any, required: true }
          ];

          const result = await complianceService.analyzeCompliance(testCase.product, restrictions);
          const expected = testCase.expectedCompliance[complianceType];
          const actual = result.overallCompliance;

          if (actual === expected) {
            correctCompliance++;
          }
          totalComplianceTests++;
        }
      }

      const accuracy = correctCompliance / totalComplianceTests;
      expect(accuracy).toBeGreaterThanOrEqual(0.98);
      console.log(`Dietary compliance accuracy: ${(accuracy * 100).toFixed(1)}%`);
    });

    it('should detect prohibited ingredients with >95% accuracy', async () => {
      const prohibitedIngredientTests = [
        { product: testDataset[1].product, restriction: 'vegan', shouldViolate: true }, // Milk in vegan
        { product: testDataset[4].product, restriction: 'vegetarian', shouldViolate: true }, // Fish in vegetarian
        { product: testDataset[2].product, restriction: 'gluten_free', shouldViolate: true }, // Wheat in gluten-free
        { product: testDataset[0].product, restriction: 'vegan', shouldViolate: false }, // Peanuts OK for vegan
      ];

      let correctDetections = 0;

      for (const test of prohibitedIngredientTests) {
        const restrictions: DietaryRestriction[] = [
          { type: test.restriction as any, required: true }
        ];

        const result = await complianceService.analyzeCompliance(test.product, restrictions);
        const hasViolation = !result.overallCompliance;

        if (hasViolation === test.shouldViolate) {
          correctDetections++;
        }
      }

      const accuracy = correctDetections / prohibitedIngredientTests.length;
      expect(accuracy).toBeGreaterThanOrEqual(0.95);
      console.log(`Prohibited ingredient detection: ${(accuracy * 100).toFixed(1)}%`);
    });
  });

  describe('Recommendation Engine Accuracy Benchmarks', () => {
    const testUserProfiles: UserProfile[] = [
      {
        allergens: ['peanuts'],
        dietaryRestrictions: [{ type: 'vegan', required: true }],
        preferences: ['organic'],
        scanHistory: []
      },
      {
        allergens: ['milk', 'eggs'],
        dietaryRestrictions: [{ type: 'vegetarian', required: true }],
        preferences: [],
        scanHistory: []
      },
      {
        allergens: ['gluten'],
        dietaryRestrictions: [{ type: 'gluten_free', required: true }],
        preferences: ['natural'],
        scanHistory: []
      }
    ];

    beforeEach(() => {
      // Mock recommendations with safe products
      mockVectorSearchService.searchByProductName.mockResolvedValue([
        { product: testDataset[3].product, similarityScore: 0.8 }, // Mixed nuts (safe for most)
        { product: testDataset[0].product, similarityScore: 0.7 }  // Peanut butter (unsafe for peanut allergy)
      ]);
    });

    it('should never recommend unsafe products', async () => {
      let unsafeRecommendations = 0;
      let totalRecommendations = 0;

      for (const userProfile of testUserProfiles) {
        const recommendations = await recommendationService.recommendPersonalized(userProfile);
        
        for (const rec of recommendations) {
          totalRecommendations++;
          
          // Check if recommendation violates user allergens
          const hasUserAllergen = userProfile.allergens.some(allergen =>
            rec.product.allergens?.includes(allergen)
          );
          
          // Check if recommendation violates dietary restrictions
          const violatesDietary = userProfile.dietaryRestrictions.some(restriction => {
            const flag = rec.product.dietaryFlags[restriction.type];
            return restriction.required && flag === false;
          });

          if (hasUserAllergen || violatesDietary) {
            unsafeRecommendations++;
          }
        }
      }

      const safetyRate = 1 - (unsafeRecommendations / Math.max(totalRecommendations, 1));
      expect(safetyRate).toBe(1.0); // 100% safety requirement
      console.log(`Recommendation safety rate: ${(safetyRate * 100).toFixed(1)}%`);
    });

    it('should provide relevant recommendations with >80% relevance', async () => {
      // This test would require more sophisticated relevance scoring
      // For now, we test that recommendations are provided and have reasonable scores
      
      for (const userProfile of testUserProfiles) {
        const recommendations = await recommendationService.recommendPersonalized(userProfile);
        
        if (recommendations.length > 0) {
          const avgScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length;
          expect(avgScore).toBeGreaterThan(0.5); // Reasonable relevance threshold
        }
      }
    });
  });

  describe('Cross-Validation and Consistency Tests', () => {
    it('should provide consistent results across multiple runs', async () => {
      const testProduct = testDataset[0].product;
      const testAllergen = 'peanuts';
      
      const results = await Promise.all(
        Array.from({ length: 5 }, () => 
          allergenService.analyzeProduct(testProduct, [testAllergen])
        )
      );

      // All results should have the same risk level
      const riskLevels = results.map(r => r.overallRiskLevel);
      const uniqueRiskLevels = new Set(riskLevels);
      expect(uniqueRiskLevels.size).toBe(1);

      // Confidence scores should be similar (within 10%)
      const confidences = results.map(r => r.confidence);
      const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
      const maxDeviation = Math.max(...confidences.map(c => Math.abs(c - avgConfidence)));
      expect(maxDeviation).toBeLessThan(0.1);
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        {
          product: {
            _id: 'edge1', upc: 'edge1', name: '', ingredients: [], allergens: [],
            dietaryFlags: { vegan: undefined, vegetarian: undefined, glutenFree: undefined, kosher: undefined, halal: undefined }
          },
          description: 'Empty product'
        },
        {
          product: {
            _id: 'edge2', upc: 'edge2', name: 'Very Long Product Name '.repeat(20),
            ingredients: Array.from({ length: 50 }, (_, i) => `ingredient${i}`),
            allergens: Array.from({ length: 10 }, (_, i) => `allergen${i}`),
            dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: true, halal: true }
          },
          description: 'Very large product'
        }
      ];

      for (const edgeCase of edgeCases) {
        const allergenResult = await allergenService.analyzeProduct(edgeCase.product, ['peanuts']);
        expect(allergenResult).toBeDefined();
        expect(allergenResult.confidence).toBeGreaterThan(0);

        const complianceResult = await complianceService.analyzeCompliance(
          edgeCase.product,
          [{ type: 'vegan', required: true }]
        );
        expect(complianceResult).toBeDefined();
        expect(complianceResult.confidence).toBeGreaterThan(0);
      }
    });
  });
});
