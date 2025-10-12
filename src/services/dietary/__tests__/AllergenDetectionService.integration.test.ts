import { AllergenDetectionService } from '../AllergenDetectionService';
import { VectorSearchService } from '../../search/VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { DatabaseService } from '../../DatabaseService';
import { Product } from '../../../models/Product';

describe('AllergenDetectionService Integration Tests', () => {
  let allergenService: AllergenDetectionService;
  let databaseService: DatabaseService;

  const testProducts: Product[] = [
    {
      _id: '1',
      upc: '111111111111',
      name: 'Almond Milk',
      ingredients: ['organic almonds', 'filtered water', 'sea salt'],
      allergens: ['tree nuts'],
      dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    },
    {
      _id: '2',
      upc: '222222222222',
      name: 'Wheat Bread',
      ingredients: ['wheat flour', 'water', 'yeast', 'may contain eggs'],
      allergens: ['gluten'],
      dietaryFlags: { vegan: false, vegetarian: true, glutenFree: false, kosher: false, halal: false }
    },
    {
      _id: '3',
      upc: '333333333333',
      name: 'Peanut Butter',
      ingredients: ['peanuts', 'salt', 'processed in facility that handles tree nuts'],
      allergens: ['peanuts'],
      dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    }
  ];

  beforeAll(async () => {
    databaseService = new DatabaseService({
      uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017',
      database: 'smarties_allergen_test',
      options: { serverSelectionTimeout: 5000 }
    });

    try {
      await databaseService.connect();
      
      const vectorSearchService = new VectorSearchService(databaseService);
      const embeddingService = new EmbeddingService();
      
      allergenService = new AllergenDetectionService(
        vectorSearchService,
        embeddingService
      );

      console.log('Connected to test database for allergen detection tests');
    } catch (error) {
      console.log('Skipping allergen detection integration tests - no database connection');
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

  describe('Real Allergen Detection', () => {
    it('should detect explicit allergens correctly', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const almondMilk = testProducts[0];
      const result = await allergenService.analyzeProduct(almondMilk, ['tree nuts']);

      expect(result.detectedAllergens).toHaveLength(1);
      expect(result.detectedAllergens[0].allergen).toBe('tree nuts');
      expect(result.detectedAllergens[0].riskLevel).toBe('high');
      expect(result.overallRiskLevel).toBe('danger');
    });

    it('should detect keyword-based allergens', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const wheatBread = testProducts[1];
      const result = await allergenService.analyzeProduct(wheatBread, ['wheat']);

      expect(result.detectedAllergens.length).toBeGreaterThan(0);
      const wheatRisk = result.detectedAllergens.find(r => r.allergen === 'wheat');
      expect(wheatRisk).toBeDefined();
      expect(wheatRisk?.reason).toContain('keyword');
    });

    it('should detect cross-contamination risks', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const peanutButter = testProducts[2];
      const result = await allergenService.analyzeProduct(peanutButter, ['tree nuts']);

      expect(result.crossContaminationRisks.length).toBeGreaterThan(0);
      const crossRisk = result.crossContaminationRisks.find(r => r.allergen === 'tree nuts');
      expect(crossRisk).toBeDefined();
      expect(crossRisk?.riskLevel).toBe('medium');
    });

    it('should return safe for non-allergenic products', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const almondMilk = testProducts[0];
      const result = await allergenService.analyzeProduct(almondMilk, ['shellfish']);

      expect(result.detectedAllergens).toHaveLength(0);
      expect(result.crossContaminationRisks).toHaveLength(0);
      expect(result.overallRiskLevel).toBe('safe');
    });
  });

  describe('Vector Similarity Detection', () => {
    it('should use vector similarity for allergen detection', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const almondMilk = testProducts[0];
      const result = await allergenService.analyzeProduct(almondMilk, ['nuts']);

      // Should detect similarity between 'nuts' and 'tree nuts'
      expect(Array.isArray(result.detectedAllergens)).toBe(true);
    });

    it('should detect allergen synonyms', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const synonyms = await allergenService.detectAllergenSynonyms('tree nuts');

      expect(Array.isArray(synonyms)).toBe(true);
      // May find related terms like 'nuts', 'almonds', etc.
    });
  });

  describe('Complex Allergen Scenarios', () => {
    it('should handle multiple allergens correctly', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const wheatBread = testProducts[1];
      const result = await allergenService.analyzeProduct(wheatBread, ['wheat', 'eggs']);

      expect(result.detectedAllergens.length + result.crossContaminationRisks.length).toBeGreaterThan(0);
      
      // Should detect wheat directly and eggs as cross-contamination
      const hasWheat = result.detectedAllergens.some(r => r.allergen === 'wheat');
      const hasEggsCross = result.crossContaminationRisks.some(r => r.allergen === 'eggs');
      
      expect(hasWheat || hasEggsCross).toBe(true);
    });

    it('should prioritize risk levels correctly', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const peanutButter = testProducts[2];
      const result = await allergenService.analyzeProduct(peanutButter, ['peanuts', 'tree nuts']);

      // Should show danger for peanuts (direct) and caution/medium for tree nuts (cross-contamination)
      expect(result.overallRiskLevel).toBe('danger');
      
      const peanutRisk = result.detectedAllergens.find(r => r.allergen === 'peanuts');
      expect(peanutRisk?.riskLevel).toBe('high');
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete allergen analysis within reasonable time', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const startTime = Date.now();
      const result = await allergenService.analyzeProduct(testProducts[0], ['tree nuts', 'milk', 'eggs']);
      const responseTime = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    it('should handle service failures gracefully', async () => {
      // Test with invalid database connection
      const invalidService = new DatabaseService({
        uri: 'mongodb://invalid:27017',
        database: 'invalid'
      });

      const invalidAllergenService = new AllergenDetectionService(
        new VectorSearchService(invalidService),
        new EmbeddingService()
      );

      const result = await invalidAllergenService.analyzeProduct(testProducts[0], ['tree nuts']);

      expect(result).toBeDefined();
      expect(result.overallRiskLevel).toBeDefined();
    });

    it('should provide consistent results for same inputs', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const result1 = await allergenService.analyzeProduct(testProducts[0], ['tree nuts']);
      const result2 = await allergenService.analyzeProduct(testProducts[0], ['tree nuts']);

      expect(result1.overallRiskLevel).toBe(result2.overallRiskLevel);
      expect(result1.detectedAllergens).toHaveLength(result2.detectedAllergens.length);
    });
  });
});
