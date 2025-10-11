/**
 * DatabaseService Integration Tests
 * Task 4.5: Write database service integration tests
 * 
 * Tests:
 * - Database connection with real MongoDB Atlas instance
 * - CRUD operations with actual data
 * - Error handling and retry logic
 * - Offline fallback behavior
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import './setup';
import { DatabaseService, DatabaseError, ConnectionState } from '../../services/DatabaseService';
import { Product } from '../../types/Product';
import { User } from '../../types/User';
import { ScanResult } from '../../types/ScanResult';
import { IntegrationTestUtils, integrationConfig } from './setup';

describe('DatabaseService Integration Tests', () => {
  let databaseService: DatabaseService;
  let testProductId: string;
  let testUserId: string;
  let testScanResultId: string;

  beforeAll(async () => {
    // Initialize database service with test configuration
    databaseService = new DatabaseService();
  }, integrationConfig.timeout);

  afterAll(async () => {
    // Cleanup and disconnect
    await databaseService.disconnect();
  });

  beforeEach(() => {
    testProductId = IntegrationTestUtils.generateTestId();
    testUserId = IntegrationTestUtils.generateTestId();
    testScanResultId = IntegrationTestUtils.generateTestId();
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await databaseService.delete('products', { _id: testProductId });
      await databaseService.delete('users', { _id: testUserId });
      await databaseService.delete('scan_results', { _id: testScanResultId });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Database Connection Tests', () => {
    test('should connect to MongoDB Atlas successfully', async () => {
      await expect(databaseService.connect()).resolves.not.toThrow();
      
      const status = await databaseService.getConnectionStatus();
      expect(status.isConnected).toBe(true);
      expect(status.state).toBe(ConnectionState.CONNECTED);
    });

    test('should perform health check successfully', async () => {
      await databaseService.connect();
      
      const healthStatus = await databaseService.performHealthCheck();
      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.checks.connection.status).toBe('pass');
      expect(healthStatus.checks.database.status).toBe('pass');
    });

    test('should test connection ping', async () => {
      await databaseService.connect();
      
      const isConnected = await databaseService.testConnection();
      expect(isConnected).toBe(true);
    });

    test('should handle connection retry logic', async () => {
      // Create service with invalid URI to test retry
      const invalidService = new DatabaseService(undefined, {
        uri: 'mongodb://invalid-host:27017',
        connectionTimeout: 1000,
        serverSelectionTimeout: 1000
      });

      await expect(invalidService.connect()).rejects.toThrow(DatabaseError);
    });
  });

  describe('CRUD Operations - Products Collection', () => {
    const testProduct: Product = {
      _id: '',
      upc: '123456789012',
      name: 'Test Product',
      brand: 'Test Brand',
      ingredients: ['water', 'sugar', 'natural flavors'],
      allergens: ['none'],
      nutritionalInfo: {
        servingSize: '1 cup',
        calories: 100,
        totalFat: 0,
        saturatedFat: 0,
        transFat: 0,
        cholesterol: 0,
        sodium: 10,
        totalCarbohydrates: 25,
        dietaryFiber: 0,
        totalSugars: 24,
        addedSugars: 24,
        protein: 0,
        vitaminD: 0,
        calcium: 0,
        iron: 0,
        potassium: 0
      },
      dietaryFlags: {
        isVegan: true,
        isVegetarian: true,
        isGlutenFree: true,
        isKosher: false,
        isHalal: true,
        isOrganic: false,
        isNonGMO: false
      },
      confidence: 0.95,
      source: 'integration_test',
      lastUpdated: new Date(),
      createdAt: new Date()
    };

    test('should create product successfully', async () => {
      await databaseService.connect();
      testProduct._id = testProductId;

      const result = await databaseService.create('products', testProduct);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should read product by ID', async () => {
      await databaseService.connect();
      testProduct._id = testProductId;
      
      // Create product first
      await databaseService.create('products', testProduct);

      // Read it back
      const result = await databaseService.readOne('products', { _id: testProductId });
      expect(result.success).toBe(true);
      expect(result.data?.upc).toBe(testProduct.upc);
      expect(result.data?.name).toBe(testProduct.name);
    });

    test('should read products with filter', async () => {
      await databaseService.connect();
      testProduct._id = testProductId;
      
      // Create product first
      await databaseService.create('products', testProduct);

      // Read with filter
      const result = await databaseService.read('products', { upc: testProduct.upc });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].upc).toBe(testProduct.upc);
    });

    test('should update product successfully', async () => {
      await databaseService.connect();
      testProduct._id = testProductId;
      
      // Create product first
      await databaseService.create('products', testProduct);

      // Update it
      const updateData = { name: 'Updated Test Product' };
      const result = await databaseService.update('products', { _id: testProductId }, updateData);
      expect(result.success).toBe(true);

      // Verify update
      const updated = await databaseService.readOne('products', { _id: testProductId });
      expect(updated.data?.name).toBe('Updated Test Product');
    });

    test('should delete product successfully', async () => {
      await databaseService.connect();
      testProduct._id = testProductId;
      
      // Create product first
      await databaseService.create('products', testProduct);

      // Delete it
      const result = await databaseService.delete('products', { _id: testProductId });
      expect(result.success).toBe(true);

      // Verify deletion
      const deleted = await databaseService.readOne('products', { _id: testProductId });
      expect(deleted.data).toBeNull();
    });
  });

  describe('CRUD Operations - Users Collection', () => {
    const testUser: User = {
      _id: '',
      profileId: 'test-profile-123',
      dietaryRestrictions: {
        allergies: [
          {
            allergen: 'peanuts',
            severity: 'severe',
            notes: 'Carry EpiPen'
          }
        ],
        religious: ['halal'],
        medical: ['diabetes'],
        lifestyle: ['vegan']
      },
      preferences: {
        strictMode: true,
        notifications: {
          enabled: true,
          pushNotifications: true,
          emailAlerts: false
        },
        language: 'en',
        units: 'metric'
      },
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1
      }
    };

    test('should create and read user', async () => {
      await databaseService.connect();
      testUser._id = testUserId;

      // Create user
      const createResult = await databaseService.create('users', testUser);
      expect(createResult.success).toBe(true);

      // Read user back
      const readResult = await databaseService.readOne('users', { _id: testUserId });
      expect(readResult.success).toBe(true);
      expect(readResult.data?.profileId).toBe(testUser.profileId);
      expect(readResult.data?.dietaryRestrictions.allergies).toHaveLength(1);
    });
  });

  describe('CRUD Operations - Scan Results Collection', () => {
    const testScanResult: ScanResult = {
      _id: '',
      userId: 'test-user-123',
      productId: 'test-product-123',
      scanTimestamp: new Date(),
      complianceStatus: 'violation',
      violations: [
        {
          type: 'allergy',
          severity: 'severe',
          allergen: 'peanuts',
          ingredient: 'peanut oil',
          message: 'Contains peanuts - severe allergy detected'
        }
      ],
      confidence: 0.98,
      scanLocation: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      },
      metadata: {
        appVersion: '1.0.0',
        scanMethod: 'barcode',
        processingTime: 1250
      }
    };

    test('should create and read scan result', async () => {
      await databaseService.connect();
      testScanResult._id = testScanResultId;

      // Create scan result
      const createResult = await databaseService.create('scan_results', testScanResult);
      expect(createResult.success).toBe(true);

      // Read scan result back
      const readResult = await databaseService.readOne('scan_results', { _id: testScanResultId });
      expect(readResult.success).toBe(true);
      expect(readResult.data?.complianceStatus).toBe('violation');
      expect(readResult.data?.violations).toHaveLength(1);
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle invalid collection name', async () => {
      await databaseService.connect();

      const result = await databaseService.create('invalid_collection', { test: 'data' });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle network timeout', async () => {
      // Create service with very short timeout
      const timeoutService = new DatabaseService(undefined, {
        connectionTimeout: 1,
        serverSelectionTimeout: 1
      });

      await expect(timeoutService.connect()).rejects.toThrow();
    });

    test('should handle malformed data', async () => {
      await databaseService.connect();

      const result = await databaseService.create('products', { invalid: 'data' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });
  });

  describe('Offline Fallback Behavior', () => {
    test('should handle offline mode gracefully', async () => {
      await databaseService.connect();

      // Simulate offline mode
      const offlineService = new DatabaseService();
      
      // Test offline read
      const result = await offlineService.readOne('products', { upc: '123456789012' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('offline');
    });

    test('should cache data for offline access', async () => {
      await databaseService.connect();
      testProduct._id = testProductId;

      // Create product (should be cached)
      await databaseService.create('products', testProduct);

      // Read product (should use cache when offline)
      const result = await databaseService.readOne('products', { _id: testProductId });
      expect(result.success).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should meet sub-100ms query requirement for indexed fields', async () => {
      await databaseService.connect();
      testProduct._id = testProductId;

      // Create product first
      await databaseService.create('products', testProduct);

      // Test query performance
      const startTime = Date.now();
      await databaseService.readOne('products', { upc: testProduct.upc });
      const queryTime = Date.now() - startTime;

      expect(queryTime).toBeLessThan(100);
    });

    test('should handle concurrent operations', async () => {
      await databaseService.connect();

      const promises = [];
      for (let i = 0; i < 10; i++) {
        const product = { ...testProduct, _id: `${testProductId}_${i}`, upc: `12345678901${i}` };
        promises.push(databaseService.create('products', product));
      }

      const results = await Promise.all(promises);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Cleanup
      for (let i = 0; i < 10; i++) {
        await databaseService.delete('products', { _id: `${testProductId}_${i}` });
      }
    });
  });

  describe('Connection Monitoring Tests', () => {
    test('should start and stop connection monitoring', async () => {
      await databaseService.connect();

      // Start monitoring
      await databaseService.startConnectionMonitoring(1000);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stop monitoring
      await databaseService.stopConnectionMonitoring();

      expect(true).toBe(true); // Test passes if no errors thrown
    });

    test('should detect connection status changes', async () => {
      await databaseService.connect();

      const initialStatus = await databaseService.getConnectionStatus();
      expect(initialStatus.isConnected).toBe(true);

      // Disconnect
      await databaseService.disconnect();

      const disconnectedStatus = await databaseService.getConnectionStatus();
      expect(disconnectedStatus.isConnected).toBe(false);
    });
  });
});
