import { ProductRecommendationService, UserProfile } from '../ProductRecommendationService';
import { VectorSearchService } from '../../search/VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { AllergenDetectionService } from '../AllergenDetectionService';
import { DietaryComplianceService } from '../DietaryComplianceService';
import { DatabaseService } from '../../DatabaseService';
import { Product } from '../../../models/Product';

describe('ProductRecommendationService Integration Tests', () => {
  let recommendationService: ProductRecommendationService;
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
      name: 'Peanut Butter Cookies',
      ingredients: ['peanuts', 'flour', 'sugar', 'butter'],
      allergens: ['peanuts', 'gluten', 'milk'],
      dietaryFlags: { vegan: false, vegetarian: true, glutenFree: false, kosher: false, halal: false }
    },
    {
      _id: '3',
      upc: '333333333333',
      name: 'Organic Oat Milk',
      ingredients: ['organic oats', 'water', 'sea salt'],
      allergens: [],
      dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    },
    {
      _id: '4',
      upc: '444444444444',
      name: 'Soy Milk',
      ingredients: ['soybeans', 'water', 'calcium'],
      allergens: ['soy'],
      dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    }
  ];

  const userProfile: UserProfile = {
    allergens: ['peanuts'],
    dietaryRestrictions: [{ type: 'vegan', required: true }],
    preferences: ['organic', 'almond'],
    scanHistory: ['111111111111']
  };

  beforeAll(async () => {
    databaseService = new DatabaseService({
      uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017',
      database: 'smarties_recommendation_test',
      options: { serverSelectionTimeout: 5000 }
    });

    try {
      await databaseService.connect();
      
      const vectorSearchService = new VectorSearchService(databaseService);
      const embeddingService = new EmbeddingService();
      const allergenService = new AllergenDetectionService(vectorSearchService, embeddingService);
      const complianceService = new DietaryComplianceService(vectorSearchService, embeddingService);
      
      recommendationService = new ProductRecommendationService(
        vectorSearchService,
        embeddingService,
        allergenService,
        complianceService
      );

      console.log('Connected to test database for recommendation tests');
    } catch (error) {
      console.log('Skipping recommendation integration tests - no database connection');
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

  describe('Safer Alternative Recommendations', () => {
    it('should recommend safer alternatives to allergenic products', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const unsafeProduct = testProducts[1]; // Peanut butter cookies
      
      const recommendations = await recommendationService.recommendSaferAlternatives(
        unsafeProduct,
        userProfile,
        { maxResults: 5 }
      );

      expect(Array.isArray(recommendations)).toBe(true);
      
      // Should not recommend products with peanuts
      recommendations.forEach(rec => {
        expect(rec.safetyLevel).not.toBe('avoid');
        expect(rec.product.allergens?.includes('peanuts')).toBeFalsy();
      });
    });

    it('should prioritize products matching user preferences', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const baseProduct = testProducts[3]; // Soy milk
      
      const recommendations = await recommendationService.recommendSaferAlternatives(
        baseProduct,
        userProfile,
        { maxResults: 5 }
      );

      expect(Array.isArray(recommendations)).toBe(true);
      
      // Should prefer organic products (user preference)
      const organicRecommendations = recommendations.filter(rec => 
        rec.product.name.toLowerCase().includes('organic')
      );
      
      if (organicRecommendations.length > 0) {
        expect(organicRecommendations[0].reasons.some(r => r.includes('organic'))).toBe(true);
      }
    });
  });

  describe('Personalized Recommendations', () => {
    it('should generate personalized recommendations based on user profile', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const recommendations = await recommendationService.recommendPersonalized(
        userProfile,
        { maxResults: 10 }
      );

      expect(Array.isArray(recommendations)).toBe(true);
      
      // All recommendations should be safe for user
      recommendations.forEach(rec => {
        expect(rec.safetyLevel).not.toBe('avoid');
        expect(rec.product.dietaryFlags.vegan).toBe(true); // User requires vegan
      });
    });

    it('should exclude products with user allergens', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const recommendations = await recommendationService.recommendPersonalized(userProfile);

      // Should not recommend products with peanuts
      recommendations.forEach(rec => {
        expect(rec.product.allergens?.includes('peanuts')).toBeFalsy();
      });
    });
  });

  describe('Similar Product Discovery', () => {
    it('should discover products based on text query', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const recommendations = await recommendationService.discoverSimilarProducts(
        'plant milk',
        userProfile,
        { maxResults: 5 }
      );

      expect(Array.isArray(recommendations)).toBe(true);
      
      // Should find plant-based milk alternatives
      if (recommendations.length > 0) {
        recommendations.forEach(rec => {
          expect(rec.product.dietaryFlags.vegan).toBe(true);
        });
      }
    });

    it('should apply dietary filters from user profile', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const recommendations = await recommendationService.discoverSimilarProducts(
        'milk',
        userProfile
      );

      // All results should be vegan (user requirement)
      recommendations.forEach(rec => {
        expect(rec.product.dietaryFlags.vegan).toBe(true);
      });
    });
  });

  describe('Recommendation Quality and Ranking', () => {
    it('should provide confidence scores for recommendations', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const recommendations = await recommendationService.recommendPersonalized(userProfile);

      recommendations.forEach(rec => {
        expect(rec.confidence).toBeGreaterThan(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
        expect(rec.score).toBeGreaterThan(0);
        expect(rec.score).toBeLessThanOrEqual(1);
      });
    });

    it('should provide meaningful reasons for recommendations', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const recommendations = await recommendationService.recommendPersonalized(userProfile);

      recommendations.forEach(rec => {
        expect(Array.isArray(rec.reasons)).toBe(true);
        expect(rec.reasons.length).toBeGreaterThan(0);
        expect(rec.reasons.every(reason => typeof reason === 'string')).toBe(true);
      });
    });

    it('should rank recommendations by safety and score', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const unsafeProduct = testProducts[1]; // Contains peanuts
      
      const recommendations = await recommendationService.recommendSaferAlternatives(
        unsafeProduct,
        userProfile,
        { prioritizeSafety: true }
      );

      // Should be sorted by safety first, then score
      for (let i = 1; i < recommendations.length; i++) {
        const prev = recommendations[i - 1];
        const curr = recommendations[i];
        
        const safetyOrder = { safe: 3, caution: 2, avoid: 1 };
        const prevSafety = safetyOrder[prev.safetyLevel];
        const currSafety = safetyOrder[curr.safetyLevel];
        
        expect(prevSafety).toBeGreaterThanOrEqual(currSafety);
        
        if (prevSafety === currSafety) {
          expect(prev.score).toBeGreaterThanOrEqual(curr.score);
        }
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete recommendations within reasonable time', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const startTime = Date.now();
      const recommendations = await recommendationService.recommendPersonalized(userProfile);
      const responseTime = Date.now() - startTime;

      expect(recommendations).toBeDefined();
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle service failures gracefully', async () => {
      const invalidService = new DatabaseService({
        uri: 'mongodb://invalid:27017',
        database: 'invalid'
      });

      const invalidRecommendationService = new ProductRecommendationService(
        new VectorSearchService(invalidService),
        new EmbeddingService(),
        new AllergenDetectionService(new VectorSearchService(invalidService), new EmbeddingService()),
        new DietaryComplianceService(new VectorSearchService(invalidService), new EmbeddingService())
      );

      const recommendations = await invalidRecommendationService.recommendPersonalized(userProfile);

      expect(recommendations).toEqual([]);
    });

    it('should handle empty user profiles', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const emptyProfile: UserProfile = {
        allergens: [],
        dietaryRestrictions: [],
        preferences: [],
        scanHistory: []
      };

      const recommendations = await recommendationService.recommendPersonalized(emptyProfile);

      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
});
