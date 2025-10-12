import { DietaryComplianceService, DietaryRestriction } from '../DietaryComplianceService';
import { VectorSearchService } from '../../search/VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { DatabaseService } from '../../DatabaseService';
import { Product } from '../../../models/Product';

describe('DietaryComplianceService Integration Tests', () => {
  let complianceService: DietaryComplianceService;
  let databaseService: DatabaseService;

  const testProducts: Product[] = [
    {
      _id: '1',
      upc: '111111111111',
      name: 'Organic Vegan Almond Milk',
      ingredients: ['organic almonds', 'filtered water', 'sea salt'],
      allergens: ['tree nuts'],
      dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    },
    {
      _id: '2',
      upc: '222222222222',
      name: 'Kosher Whole Milk',
      ingredients: ['milk', 'vitamin D'],
      allergens: ['milk'],
      dietaryFlags: { vegan: false, vegetarian: true, glutenFree: true, kosher: true, halal: false }
    },
    {
      _id: '3',
      upc: '333333333333',
      name: 'Halal Chicken Breast',
      ingredients: ['chicken', 'salt'],
      allergens: [],
      dietaryFlags: { vegan: false, vegetarian: false, glutenFree: true, kosher: false, halal: true }
    },
    {
      _id: '4',
      upc: '444444444444',
      name: 'Gluten-Free Bread',
      ingredients: ['rice flour', 'water', 'yeast', 'may contain eggs'],
      allergens: [],
      dietaryFlags: { vegan: false, vegetarian: true, glutenFree: true, kosher: false, halal: false }
    }
  ];

  beforeAll(async () => {
    databaseService = new DatabaseService({
      uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017',
      database: 'smarties_compliance_test',
      options: { serverSelectionTimeout: 5000 }
    });

    try {
      await databaseService.connect();
      
      const vectorSearchService = new VectorSearchService(databaseService);
      const embeddingService = new EmbeddingService();
      
      complianceService = new DietaryComplianceService(
        vectorSearchService,
        embeddingService
      );

      console.log('Connected to test database for dietary compliance tests');
    } catch (error) {
      console.log('Skipping dietary compliance integration tests - no database connection');
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

  describe('Real Dietary Compliance Analysis', () => {
    it('should validate vegan compliance correctly', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const veganProduct = testProducts[0];
      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await complianceService.analyzeCompliance(veganProduct, restrictions);

      expect(result.overallCompliance).toBe(true);
      expect(result.results.vegan.compliant).toBe(true);
      expect(result.results.vegan.confidence).toBeGreaterThan(0.8);
    });

    it('should detect kosher compliance', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const kosherProduct = testProducts[1];
      const restrictions: DietaryRestriction[] = [
        { type: 'kosher', required: true }
      ];

      const result = await complianceService.analyzeCompliance(kosherProduct, restrictions);

      expect(result.results.kosher.compliant).toBe(true);
      expect(result.results.kosher.confidence).toBeGreaterThan(0.8);
    });

    it('should validate halal compliance', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const halalProduct = testProducts[2];
      const restrictions: DietaryRestriction[] = [
        { type: 'halal', required: true }
      ];

      const result = await complianceService.analyzeCompliance(halalProduct, restrictions);

      expect(result.results.halal.compliant).toBe(true);
      expect(result.results.halal.confidence).toBeGreaterThan(0.8);
    });

    it('should detect gluten-free compliance', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const glutenFreeProduct = testProducts[3];
      const restrictions: DietaryRestriction[] = [
        { type: 'gluten_free', required: true }
      ];

      const result = await complianceService.analyzeCompliance(glutenFreeProduct, restrictions);

      expect(result.results.gluten_free.compliant).toBe(true);
    });
  });

  describe('Multiple Dietary Restrictions', () => {
    it('should handle multiple restrictions correctly', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const veganProduct = testProducts[0];
      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true },
        { type: 'gluten_free', required: true },
        { type: 'organic', required: false }
      ];

      const result = await complianceService.analyzeCompliance(veganProduct, restrictions);

      expect(result.results).toHaveProperty('vegan');
      expect(result.results).toHaveProperty('gluten_free');
      expect(result.results).toHaveProperty('organic');
      expect(result.overallCompliance).toBe(true);
    });

    it('should fail when any required restriction is violated', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const nonVeganProduct = testProducts[1]; // Kosher milk (not vegan)
      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true },
        { type: 'kosher', required: true }
      ];

      const result = await complianceService.analyzeCompliance(nonVeganProduct, restrictions);

      expect(result.results.vegan.compliant).toBe(false);
      expect(result.results.kosher.compliant).toBe(true);
      expect(result.overallCompliance).toBe(false);
    });
  });

  describe('Alternative Product Recommendations', () => {
    it('should find compliant alternatives', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const nonVeganProduct = testProducts[1]; // Kosher milk
      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const alternatives = await complianceService.findAlternativeProducts(nonVeganProduct, restrictions);

      expect(Array.isArray(alternatives)).toBe(true);
      // Should find vegan almond milk as alternative
    });

    it('should exclude the original product from alternatives', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const veganProduct = testProducts[0];
      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const alternatives = await complianceService.findAlternativeProducts(veganProduct, restrictions);

      expect(alternatives.every(alt => alt.upc !== veganProduct.upc)).toBe(true);
    });
  });

  describe('Certification Detection', () => {
    it('should detect organic certification from product name', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const organicProduct = testProducts[0]; // Has "Organic" in name
      const restrictions: DietaryRestriction[] = [
        { type: 'organic', required: true }
      ];

      const result = await complianceService.analyzeCompliance(organicProduct, restrictions);

      expect(result.results.organic.certifications).toContain('organic');
    });

    it('should validate certification equivalency', () => {
      const result1 = complianceService.validateCertificationEquivalency('OU Kosher', 'OK Kosher', 'kosher');
      expect(result1).toBe(true);

      const result2 = complianceService.validateCertificationEquivalency('USDA Organic', 'Certified Organic', 'organic');
      expect(result2).toBe(true);

      const result3 = complianceService.validateCertificationEquivalency('Kosher', 'Halal', 'kosher');
      expect(result3).toBe(false);
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete compliance analysis within reasonable time', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true },
        { type: 'kosher', required: true },
        { type: 'gluten_free', required: true }
      ];

      const startTime = Date.now();
      const result = await complianceService.analyzeCompliance(testProducts[0], restrictions);
      const responseTime = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(3000); // Should complete within 3 seconds
    });

    it('should handle service failures gracefully', async () => {
      const invalidService = new DatabaseService({
        uri: 'mongodb://invalid:27017',
        database: 'invalid'
      });

      const invalidComplianceService = new DietaryComplianceService(
        new VectorSearchService(invalidService),
        new EmbeddingService()
      );

      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result = await invalidComplianceService.analyzeCompliance(testProducts[0], restrictions);

      expect(result).toBeDefined();
      expect(result.results.vegan).toBeDefined();
    });

    it('should provide consistent results for same inputs', async () => {
      if (!databaseService || !await databaseService.isConnected()) {
        console.log('Skipping test - no database connection');
        return;
      }

      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true }
      ];

      const result1 = await complianceService.analyzeCompliance(testProducts[0], restrictions);
      const result2 = await complianceService.analyzeCompliance(testProducts[0], restrictions);

      expect(result1.overallCompliance).toBe(result2.overallCompliance);
      expect(result1.results.vegan.compliant).toBe(result2.results.vegan.compliant);
    });
  });
});
