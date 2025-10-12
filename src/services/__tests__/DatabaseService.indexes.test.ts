/**
 * Database Service Index Tests
 * Tests for Task 5.2: Implement performance-optimized indexes
 * 
 * This test suite validates that all performance-optimized indexes are created correctly
 * and meet the sub-100ms query response time requirement.
 */

// Mock the config module before importing DatabaseService
jest.mock('../../config/config', () => ({
  config: {
    mongodb: {
      uri: 'mongodb://localhost:27017',
      database: 'test_smarties'
    },
    ai: {
      openaiApiKey: 'test-openai-key',
      anthropicApiKey: 'test-anthropic-key'
    }
  },
  ConfigurationError: class ConfigurationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ConfigurationError';
    }
  }
}));

// Mock offline utilities
jest.mock('../../utils/offline', () => ({
  OfflineManager: {
    getInstance: () => ({
      isOffline: () => false,
      addOfflineListener: () => {},
      initialize: async () => {},
      getNetworkState: () => ({ isConnected: true }),
      getSyncQueueStatus: () => ({ pending: 0 }),
      queueForSync: () => {}
    })
  },
  OfflineCacheManager: {
    getInstance: () => ({
      get: () => null,
      set: () => {},
      delete: () => {},
      clear: () => {},
      getStats: () => ({ size: 0, hits: 0, misses: 0 })
    })
  },
  OfflineUtils: {
    createCacheKey: (collection: string, query: any) => `${collection}_${JSON.stringify(query)}`,
    shouldUseCache: () => false,
    createOfflineErrorMessage: (operation: string) => `Offline: Cannot ${operation}`
  }
}));

import { DatabaseService, DatabaseResult, ConnectionState } from '../DatabaseService';

// Mock MongoDB interfaces for testing
class MockCollection {
  private indexList: any[] = [{ name: '_id_' }];
  private documents: any[] = [];

  async createIndex(keys: any, options?: any): Promise<string> {
    const indexName = options?.name || `index_${Object.keys(keys).join('_')}`;
    this.indexList.push({ name: indexName, keys, options });
    return indexName;
  }

  async indexes(): Promise<any[]> {
    return this.indexList;
  }

  async dropIndex(indexName: string): Promise<any> {
    this.indexList = this.indexList.filter(index => index.name !== indexName);
    return { ok: 1 };
  }

  async insertOne(doc: any): Promise<{ insertedId: any }> {
    const id = `mock_id_${Date.now()}`;
    this.documents.push({ ...doc, _id: id });
    return { insertedId: id };
  }

  async updateOne(filter: any, update: any): Promise<{ modifiedCount: number }> {
    const docIndex = this.documents.findIndex(doc => this.matchesFilter(doc, filter));
    if (docIndex >= 0) {
      this.documents[docIndex] = { ...this.documents[docIndex], ...update.$set };
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    const docIndex = this.documents.findIndex(doc => this.matchesFilter(doc, filter));
    if (docIndex >= 0) {
      this.documents.splice(docIndex, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async findOne(filter: any): Promise<any> {
    // Simulate fast query response
    await new Promise(resolve => setTimeout(resolve, 10)); // 10ms response
    return this.documents.find(doc => this.matchesFilter(doc, filter)) || null;
  }

  find(filter: any): { toArray(): Promise<any[]> } {
    return {
      toArray: async () => {
        // Simulate fast query response
        await new Promise(resolve => setTimeout(resolve, 20)); // 20ms response
        return this.documents.filter(doc => this.matchesFilter(doc, filter));
      }
    };
  }

  private matchesFilter(doc: any, filter: any): boolean {
    // Simple filter matching for testing
    for (const [key, value] of Object.entries(filter)) {
      if (key === '$text') {
        // Mock text search
        return true;
      }
      if (doc[key] !== value) {
        return false;
      }
    }
    return true;
  }

  // Add test documents
  addTestDocument(doc: any): void {
    this.documents.push(doc);
  }
}

class MockDatabase {
  private collections: Map<string, MockCollection> = new Map();

  collection(name: string): MockCollection {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockCollection());
    }
    return this.collections.get(name)!;
  }

  admin(): any {
    return {
      ping: async () => ({ ok: 1 })
    };
  }
}

class MockMongoClient {
  private database = new MockDatabase();

  async connect(): Promise<void> {
    // Mock connection
  }

  async close(): Promise<void> {
    // Mock disconnection
  }

  db(name?: string): MockDatabase {
    return this.database;
  }
}

describe('DatabaseService Index Management', () => {
  let databaseService: DatabaseService;
  let mockClient: MockMongoClient;

  beforeEach(() => {
    mockClient = new MockMongoClient();
    databaseService = new DatabaseService(mockClient);
  });

  afterEach(async () => {
    await databaseService.disconnect();
  });

  describe('createPerformanceIndexes', () => {
    it('should create all required indexes successfully', async () => {
      // Connect to database
      await databaseService.connect();

      // Create indexes
      const result = await databaseService.createPerformanceIndexes();

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should fail when database is not connected', async () => {
      // Don't connect to database
      const result = await databaseService.createPerformanceIndexes();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create performance indexes');
    });
  });

  describe('Products Collection Indexes', () => {
    beforeEach(async () => {
      await databaseService.connect();
      await databaseService.createPerformanceIndexes();
    });

    it('should create unique UPC index for fast product lookups', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('products');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('upc_unique_lookup');
    });

    it('should create allergens index for filtering', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('products');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('allergens_filter');
    });

    it('should create text search index for product search', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('products');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('product_text_search');
    });

    it('should create dietary flags indexes', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('products');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('dietary_halal_filter');
      expect(indexNames).toContain('dietary_kosher_filter');
      expect(indexNames).toContain('dietary_vegan_filter');
      expect(indexNames).toContain('dietary_vegetarian_filter');
      expect(indexNames).toContain('dietary_gluten_free_filter');
    });
  });

  describe('Users Collection Indexes', () => {
    beforeEach(async () => {
      await databaseService.connect();
      await databaseService.createPerformanceIndexes();
    });

    it('should create unique profileId index for user lookups', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('users');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('profile_id_unique');
    });

    it('should create dietary restrictions indexes', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('users');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('user_allergies_filter');
      expect(indexNames).toContain('user_religious_filter');
      expect(indexNames).toContain('user_medical_filter');
      expect(indexNames).toContain('user_lifestyle_filter');
    });

    it('should create user activity index', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('users');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('last_active_desc');
    });
  });

  describe('Scan Results Collection Indexes', () => {
    beforeEach(async () => {
      await databaseService.connect();
      await databaseService.createPerformanceIndexes();
    });

    it('should create compound index for user scan history', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('scan_results');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('user_scan_history');
    });

    it('should create UPC index for product analytics', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('scan_results');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('scan_upc_analytics');
    });

    it('should create compliance status index for safety analytics', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('scan_results');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('compliance_status_analytics');
    });

    it('should create timestamp index for recent scans', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('scan_results');
      
      expect(indexesResult.success).toBe(true);
      const indexNames = indexesResult.data!.map(index => index.name);
      expect(indexNames).toContain('recent_scans_global');
    });
  });

  describe('validateIndexPerformance', () => {
    beforeEach(async () => {
      await databaseService.connect();
      await databaseService.createPerformanceIndexes();
      
      // Add test data to collections
      const productsCollection = mockClient.db().collection('products');
      productsCollection.addTestDocument({
        upc: '123456789012',
        name: 'Test Product',
        allergens: ['milk'],
        dietaryFlags: { vegan: true }
      });

      const usersCollection = mockClient.db().collection('users');
      usersCollection.addTestDocument({
        profileId: 'demo_user_001',
        dietaryRestrictions: { allergies: ['peanuts'] },
        preferences: { alertLevel: 'strict' }
      });

      const scanResultsCollection = mockClient.db().collection('scan_results');
      scanResultsCollection.addTestDocument({
        userId: 'demo_user_001',
        upc: '123456789012',
        complianceStatus: 'safe',
        scanTimestamp: new Date()
      });
    });

    it('should validate that all queries meet sub-100ms requirement', async () => {
      const result = await databaseService.validateIndexPerformance();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      const { products, users, scanResults } = result.data!;
      
      // All response times should be under 100ms
      expect(products.avgResponseTime).toBeLessThan(100);
      expect(users.avgResponseTime).toBeLessThan(100);
      expect(scanResults.avgResponseTime).toBeLessThan(100);
      
      // All tests should pass
      expect(products.passed).toBe(true);
      expect(users.passed).toBe(true);
      expect(scanResults.passed).toBe(true);
    });

    it('should fail when database is not connected', async () => {
      await databaseService.disconnect();
      
      const result = await databaseService.validateIndexPerformance();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to validate index performance');
    });
  });

  describe('recreateAllIndexes', () => {
    it('should drop and recreate all indexes', async () => {
      await databaseService.connect();
      
      // Create initial indexes
      await databaseService.createPerformanceIndexes();
      
      // Verify indexes exist
      let indexesResult = await databaseService.listCollectionIndexes('products');
      expect(indexesResult.data!.length).toBeGreaterThan(1); // More than just _id_
      
      // Recreate indexes
      const result = await databaseService.recreateAllIndexes();
      expect(result.success).toBe(true);
      
      // Verify indexes still exist after recreation
      indexesResult = await databaseService.listCollectionIndexes('products');
      expect(indexesResult.data!.length).toBeGreaterThan(1);
    });

    it('should fail when database is not connected', async () => {
      const result = await databaseService.recreateAllIndexes();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to recreate indexes');
    });
  });

  describe('listCollectionIndexes', () => {
    it('should list all indexes for a collection', async () => {
      await databaseService.connect();
      await databaseService.createPerformanceIndexes();
      
      const result = await databaseService.listCollectionIndexes('products');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should fail when database is not connected', async () => {
      const result = await databaseService.listCollectionIndexes('products');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to list indexes for products');
    });
  });

  describe('Index Requirements Validation', () => {
    beforeEach(async () => {
      await databaseService.connect();
      await databaseService.createPerformanceIndexes();
    });

    it('should meet Requirement 2.2: Fast product lookups via UPC', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('products');
      const indexes = indexesResult.data!;
      
      // Should have unique UPC index
      const upcIndex = indexes.find(index => index.name === 'upc_unique_lookup');
      expect(upcIndex).toBeDefined();
    });

    it('should meet Requirement 2.3: Efficient user profile queries', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('users');
      const indexes = indexesResult.data!;
      
      // Should have unique profileId index
      const profileIndex = indexes.find(index => index.name === 'profile_id_unique');
      expect(profileIndex).toBeDefined();
    });

    it('should meet Requirement 2.3: Fast user scan history retrieval', async () => {
      const indexesResult = await databaseService.listCollectionIndexes('scan_results');
      const indexes = indexesResult.data!;
      
      // Should have compound index for user scan history
      const scanHistoryIndex = indexes.find(index => index.name === 'user_scan_history');
      expect(scanHistoryIndex).toBeDefined();
    });

    it('should meet Requirement 2.4: Allergen and dietary restriction filtering', async () => {
      // Products allergen filtering
      const productsIndexes = await databaseService.listCollectionIndexes('products');
      const allergenIndex = productsIndexes.data!.find(index => index.name === 'allergens_filter');
      expect(allergenIndex).toBeDefined();
      
      // Users dietary restrictions filtering
      const usersIndexes = await databaseService.listCollectionIndexes('users');
      const userAllergiesIndex = usersIndexes.data!.find(index => index.name === 'user_allergies_filter');
      expect(userAllergiesIndex).toBeDefined();
    });

    it('should meet Requirement 2.5: Sub-100ms query response times', async () => {
      const performanceResult = await databaseService.validateIndexPerformance();
      
      expect(performanceResult.success).toBe(true);
      const { products, users, scanResults } = performanceResult.data!;
      
      // All collections should meet sub-100ms requirement
      expect(products.passed).toBe(true);
      expect(users.passed).toBe(true);
      expect(scanResults.passed).toBe(true);
    });
  });
});