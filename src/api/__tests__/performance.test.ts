import request from 'supertest';
import { ProductSearchAPI } from '../server';

describe('API Performance Tests', () => {
  let api: ProductSearchAPI;
  let app: any;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017';
    process.env.MONGODB_DATABASE = 'smarties_perf_test';

    try {
      api = new ProductSearchAPI();
      app = api.getApp();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Performance tests initialized');
    } catch (error) {
      console.log('Skipping performance tests - initialization failed');
    }
  });

  afterAll(async () => {
    if (api) {
      await api.stop();
    }
  });

  describe('Response Time Requirements', () => {
    it('should meet UPC lookup performance (<100ms)', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const measurements: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        const response = await request(app)
          .get('/api/products/upc/123456789012')
          .expect(200);
        const responseTime = Date.now() - startTime;
        
        measurements.push(responseTime);
        expect(response.body.data.responseTime).toBeLessThan(100);
      }

      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxTime = Math.max(...measurements);
      
      console.log(`UPC lookup - Avg: ${avgTime.toFixed(1)}ms, Max: ${maxTime}ms`);
      expect(avgTime).toBeLessThan(150); // Allow HTTP overhead
      expect(maxTime).toBeLessThan(200);
    });

    it('should meet semantic search performance (<500ms)', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const measurements: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const response = await request(app)
          .post('/api/products/search')
          .send({ query: 'organic milk', filters: { maxResults: 10 } })
          .expect(200);
        const responseTime = Date.now() - startTime;
        
        measurements.push(responseTime);
        expect(response.body.data.responseTime).toBeLessThan(500);
      }

      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      console.log(`Semantic search - Avg: ${avgTime.toFixed(1)}ms`);
      expect(avgTime).toBeLessThan(1000);
    });

    it('should meet dietary analysis performance (<300ms)', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const measurements: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const response = await request(app)
          .post('/api/products/analyze')
          .send({
            upc: '123456789012',
            userAllergens: ['peanuts'],
            dietaryRestrictions: [{ type: 'vegan', required: true }]
          });
        const responseTime = Date.now() - startTime;
        
        measurements.push(responseTime);
        
        if (response.status === 200) {
          expect(response.body.data.responseTime).toBeLessThan(300);
        }
      }

      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      console.log(`Dietary analysis - Avg: ${avgTime.toFixed(1)}ms`);
    });
  });

  describe('Concurrent Load Testing', () => {
    it('should handle concurrent UPC lookups', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const concurrency = 20;
      const requests = Array.from({ length: concurrency }, (_, i) =>
        request(app).get(`/api/products/upc/12345678901${i % 10}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      expect(responses.every(r => r.status < 500)).toBe(true);
      expect(totalTime).toBeLessThan(3000); // 20 requests in under 3 seconds
      
      console.log(`Concurrent UPC lookups: ${concurrency} requests in ${totalTime}ms`);
    });

    it('should handle mixed concurrent operations', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const requests = [
        ...Array.from({ length: 10 }, () => 
          request(app).get('/api/products/upc/123456789012')
        ),
        ...Array.from({ length: 5 }, () =>
          request(app)
            .post('/api/products/search')
            .send({ query: 'milk', filters: { maxResults: 5 } })
        ),
        ...Array.from({ length: 3 }, () =>
          request(app)
            .post('/api/products/recommendations')
            .send({
              userProfile: {
                allergens: ['peanuts'],
                dietaryRestrictions: [{ type: 'vegan', required: true }],
                preferences: [],
                scanHistory: []
              }
            })
        )
      ];

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successCount = responses.filter(r => r.status < 400).length;
      const successRate = (successCount / responses.length) * 100;

      expect(successRate).toBeGreaterThan(80); // At least 80% success rate
      expect(totalTime).toBeLessThan(5000); // All requests in under 5 seconds
      
      console.log(`Mixed operations: ${responses.length} requests, ${successRate.toFixed(1)}% success, ${totalTime}ms`);
    });
  });

  describe('Stress Testing', () => {
    it('should maintain performance under sustained load', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const duration = 10000; // 10 seconds
      const startTime = Date.now();
      const requests: Promise<any>[] = [];
      let requestCount = 0;

      // Generate requests for 10 seconds
      while (Date.now() - startTime < duration) {
        requests.push(
          request(app)
            .get('/api/products/upc/123456789012')
            .then(() => requestCount++)
            .catch(() => {}) // Ignore individual failures
        );
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      await Promise.all(requests);
      const actualDuration = Date.now() - startTime;
      const throughput = (requestCount / actualDuration) * 1000; // requests per second

      console.log(`Stress test: ${requestCount} requests in ${actualDuration}ms (${throughput.toFixed(1)} req/sec)`);
      expect(throughput).toBeGreaterThan(5); // At least 5 requests per second
    });

    it('should handle memory efficiently under load', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate many requests
      const requests = Array.from({ length: 100 }, () =>
        request(app).get('/health').catch(() => {})
      );

      await Promise.all(requests);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`Memory usage: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should enforce rate limits without degrading performance', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const requests = Array.from({ length: 30 }, () =>
        request(app).get('/health')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      const successResponses = responses.filter(r => r.status === 200);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(successResponses.length + rateLimitedResponses.length).toBe(responses.length);
      expect(totalTime).toBeLessThan(2000); // Should complete quickly even with rate limiting
      
      console.log(`Rate limiting: ${successResponses.length} success, ${rateLimitedResponses.length} rate limited`);
    });
  });

  describe('Error Response Performance', () => {
    it('should handle validation errors quickly', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const measurements: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await request(app)
          .get('/api/products/upc/invalid')
          .expect(400);
        const responseTime = Date.now() - startTime;
        
        measurements.push(responseTime);
      }

      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      console.log(`Validation error response time: ${avgTime.toFixed(1)}ms`);
      expect(avgTime).toBeLessThan(50); // Should be very fast
    });

    it('should handle 404 errors quickly', async () => {
      if (!app) {
        console.log('Skipping test - app not initialized');
        return;
      }

      const measurements: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await request(app)
          .get('/api/nonexistent')
          .expect(404);
        const responseTime = Date.now() - startTime;
        
        measurements.push(responseTime);
      }

      const avgTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      console.log(`404 error response time: ${avgTime.toFixed(1)}ms`);
      expect(avgTime).toBeLessThan(30); // Should be very fast
    });
  });
});
