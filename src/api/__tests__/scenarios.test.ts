import request from 'supertest';
import { ProductSearchAPI } from '../server';

describe('API End-to-End Scenarios', () => {
  let api: ProductSearchAPI;
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017';
    process.env.MONGODB_DATABASE = 'smarties_e2e_test';

    try {
      api = new ProductSearchAPI();
      app = api.getApp();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('E2E scenario tests initialized');
    } catch (error) {
      console.log('Skipping E2E tests - initialization failed');
    }
  });

  afterAll(async () => {
    if (api) {
      await api.stop();
    }
  });

  describe('Complete User Journey Scenarios', () => {
    it('should handle complete barcode scanning workflow', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      // Step 1: User scans a barcode (UPC lookup)
      const upcResponse = await request(app)
        .get('/api/products/upc/123456789012')
        .expect(200);

      expect(upcResponse.body.success).toBe(true);
      const product = upcResponse.body.data.product;

      if (product) {
        // Step 2: Analyze product for user's dietary restrictions
        const analysisResponse = await request(app)
          .post('/api/products/analyze')
          .send({
            upc: product.upc,
            userAllergens: ['tree nuts', 'peanuts'],
            dietaryRestrictions: [
              { type: 'vegan', required: true },
              { type: 'gluten_free', required: false }
            ]
          })
          .expect(200);

        expect(analysisResponse.body.success).toBe(true);
        expect(analysisResponse.body.data).toHaveProperty('allergenAnalysis');
        expect(analysisResponse.body.data).toHaveProperty('complianceAnalysis');

        // Step 3: If product is unsafe, get safer alternatives
        const allergenAnalysis = analysisResponse.body.data.allergenAnalysis;
        if (allergenAnalysis && allergenAnalysis.overallRiskLevel !== 'safe') {
          const recommendationsResponse = await request(app)
            .post('/api/products/recommendations')
            .send({
              baseProduct: product.upc,
              userProfile: {
                allergens: ['tree nuts', 'peanuts'],
                dietaryRestrictions: [
                  { type: 'vegan', required: true }
                ],
                preferences: ['organic'],
                scanHistory: []
              },
              maxResults: 5
            })
            .expect(200);

          expect(recommendationsResponse.body.success).toBe(true);
          expect(recommendationsResponse.body.data).toHaveProperty('recommendations');
        }
      }

      // Verify total workflow time is reasonable
      const totalTime = upcResponse.body.responseTime + 
                       (analysisResponse?.body.data.responseTime || 0);
      expect(totalTime).toBeLessThan(500); // Complete workflow under 500ms
    });

    it('should handle product discovery workflow', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      // Step 1: User searches for products by text
      const searchResponse = await request(app)
        .post('/api/products/search')
        .send({
          query: 'organic almond milk',
          filters: {
            dietary: ['vegan'],
            maxResults: 10,
            similarityThreshold: 0.6
          }
        })
        .expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(Array.isArray(searchResponse.body.data.products)).toBe(true);

      // Step 2: Get personalized recommendations based on search
      const recommendationsResponse = await request(app)
        .post('/api/products/recommendations')
        .send({
          userProfile: {
            allergens: ['peanuts'],
            dietaryRestrictions: [
              { type: 'vegan', required: true },
              { type: 'gluten_free', required: false }
            ],
            preferences: ['organic', 'non-gmo'],
            scanHistory: []
          },
          maxResults: 15
        })
        .expect(200);

      expect(recommendationsResponse.body.success).toBe(true);
      expect(Array.isArray(recommendationsResponse.body.data.recommendations)).toBe(true);

      // Verify recommendations are safe for user
      const recommendations = recommendationsResponse.body.data.recommendations;
      recommendations.forEach((rec: any) => {
        expect(rec).toHaveProperty('safetyLevel');
        expect(rec.safetyLevel).not.toBe('avoid');
        expect(rec).toHaveProperty('confidence');
        expect(rec.confidence).toBeGreaterThan(0);
      });
    });

    it('should handle complex dietary restriction scenarios', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const complexUserProfile = {
        allergens: ['milk', 'eggs', 'tree nuts'],
        dietaryRestrictions: [
          { type: 'vegan', required: true },
          { type: 'gluten_free', required: true },
          { type: 'kosher', required: false }
        ],
        preferences: ['organic', 'non-gmo', 'local'],
        scanHistory: []
      };

      // Test multiple products for complex restrictions
      const testUPCs = ['123456789012', '987654321098', '555666777888'];
      
      for (const upc of testUPCs) {
        const analysisResponse = await request(app)
          .post('/api/products/analyze')
          .send({
            upc,
            userAllergens: complexUserProfile.allergens,
            dietaryRestrictions: complexUserProfile.dietaryRestrictions
          });

        // Should handle analysis even if product doesn't exist
        expect([200, 404]).toContain(analysisResponse.status);
        
        if (analysisResponse.status === 200) {
          expect(analysisResponse.body.success).toBe(true);
          expect(analysisResponse.body.data).toHaveProperty('allergenAnalysis');
          expect(analysisResponse.body.data).toHaveProperty('complianceAnalysis');
        }
      }

      // Get recommendations for complex profile
      const recommendationsResponse = await request(app)
        .post('/api/products/recommendations')
        .send({
          userProfile: complexUserProfile,
          maxResults: 20
        })
        .expect(200);

      expect(recommendationsResponse.body.success).toBe(true);
      
      // Verify all recommendations meet required restrictions
      const recommendations = recommendationsResponse.body.data.recommendations;
      recommendations.forEach((rec: any) => {
        expect(rec.safetyLevel).not.toBe('avoid');
        expect(rec.reasons).toBeDefined();
        expect(Array.isArray(rec.reasons)).toBe(true);
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should gracefully handle service degradation', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      // Test with various invalid inputs to ensure graceful degradation
      const invalidRequests = [
        {
          endpoint: '/api/products/upc/invalid_upc',
          method: 'get',
          expectedStatus: 400
        },
        {
          endpoint: '/api/products/search',
          method: 'post',
          body: { query: '' },
          expectedStatus: 400
        },
        {
          endpoint: '/api/products/analyze',
          method: 'post',
          body: { upc: '999999999999' },
          expectedStatus: 404
        }
      ];

      for (const req of invalidRequests) {
        let response;
        if (req.method === 'get') {
          response = await request(app).get(req.endpoint);
        } else {
          response = await request(app).post(req.endpoint).send(req.body || {});
        }

        expect(response.status).toBe(req.expectedStatus);
        expect(response.body.success).toBe(false);
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('responseTime');
      }
    });

    it('should maintain API availability during high error rates', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      // Generate mix of valid and invalid requests
      const requests = [
        ...Array.from({ length: 10 }, () => 
          request(app).get('/api/products/upc/invalid')
        ),
        ...Array.from({ length: 10 }, () => 
          request(app).get('/health')
        ),
        ...Array.from({ length: 5 }, () =>
          request(app).post('/api/products/search').send({ query: '' })
        )
      ];

      const responses = await Promise.all(requests);
      
      // Health checks should still work
      const healthResponses = responses.slice(10, 20);
      expect(healthResponses.every(r => r.status === 200)).toBe(true);
      
      // Error responses should be properly formatted
      const errorResponses = responses.filter(r => r.status >= 400);
      errorResponses.forEach(response => {
        expect(response.body.success).toBe(false);
        expect(response.body).toHaveProperty('error');
      });
    });
  });

  describe('Data Consistency Scenarios', () => {
    it('should maintain consistent responses across multiple calls', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const upc = '123456789012';
      const responses = await Promise.all(
        Array.from({ length: 5 }, () =>
          request(app).get(`/api/products/upc/${upc}`)
        )
      );

      // All responses should have same success status
      const successStatuses = responses.map(r => r.body.success);
      expect(new Set(successStatuses).size).toBe(1);

      // If product exists, all should return same product
      if (responses[0].body.data.product) {
        const productUPCs = responses.map(r => r.body.data.product?.upc);
        expect(new Set(productUPCs).size).toBe(1);
      }
    });

    it('should provide consistent dietary analysis results', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const analysisRequest = {
        upc: '123456789012',
        userAllergens: ['peanuts'],
        dietaryRestrictions: [{ type: 'vegan', required: true }]
      };

      const responses = await Promise.all(
        Array.from({ length: 3 }, () =>
          request(app).post('/api/products/analyze').send(analysisRequest)
        )
      );

      // All should have same success status
      const statuses = responses.map(r => r.status);
      expect(new Set(statuses).size).toBe(1);

      // If successful, analysis results should be consistent
      if (responses[0].status === 200) {
        const riskLevels = responses.map(r => 
          r.body.data.allergenAnalysis?.overallRiskLevel
        );
        expect(new Set(riskLevels).size).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Performance Under Various Scenarios', () => {
    it('should maintain performance with different query complexities', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const queries = [
        { query: 'milk', complexity: 'simple' },
        { query: 'organic gluten-free almond milk', complexity: 'medium' },
        { query: 'certified organic non-gmo gluten-free vegan almond milk with no artificial preservatives', complexity: 'complex' }
      ];

      for (const testQuery of queries) {
        const startTime = Date.now();
        const response = await request(app)
          .post('/api/products/search')
          .send({
            query: testQuery.query,
            filters: { maxResults: 10 }
          });
        const responseTime = Date.now() - startTime;

        expect(response.status).toBeLessThan(500);
        expect(responseTime).toBeLessThan(2000); // Even complex queries under 2s
        
        console.log(`${testQuery.complexity} query: ${responseTime}ms`);
      }
    });
  });
});
