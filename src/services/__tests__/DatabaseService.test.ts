/**
 * Unit tests for DatabaseService
 * Tests connection management, retry logic, CRUD operations, and error handling
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
    },
    apis: {
      openFoodFactsUrl: 'https://test.openfoodfacts.org',
      usdaApiKey: 'test-usda-key'
    },
    app: {
      nodeEnv: 'test' as const,
      logLevel: 'error' as const
    }
  },
  ConfigurationError: class ConfigurationError extends Error {
    constructor(message: string) {
      super(`Configuration Error: ${message}`);
      this.name = 'ConfigurationError';
    }
  }
}));

import { 
  DatabaseService, 
  DatabaseError, 
  ConnectionState,
  MongoClientInterface,
  DatabaseInterface,
  CollectionInterface,
  AdminInterface
} from '../DatabaseService';
import { Product } from '../../types/Product';
import { User } from '../../types/User';
import { ScanResult } from '../../types/ScanResult';

// Mock MongoDB client for testing
class MockMongoClient implements MongoClientInterface {
  private connected = false;
  private shouldFailConnection = false;
  private shouldFailPing = false;

  async connect(): Promise<void> {
    if (this.shouldFailConnection) {
      throw new Error('Connection failed');
    }
    this.connected = true;
  }

  async close(): Promise<void> {
    this.connected = false;
  }

  db(name?: string): DatabaseInterface {
    return new MockDatabase(this.shouldFailPing);
  }

  // Test helpers
  setConnectionFailure(shouldFail: boolean): void {
    this.shouldFailConnection = shouldFail;
  }

  setPingFailure(shouldFail: boolean): void {
    this.shouldFailPing = shouldFail;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

class MockDatabase implements DatabaseInterface {
  constructor(private shouldFailPing: boolean = false) {}

  collection(name: string): CollectionInterface {
    return new MockCollection(name);
  }

  admin(): AdminInterface {
    return new MockAdmin(this.shouldFailPing);
  }
}

class MockAdmin implements AdminInterface {
  constructor(private shouldFailPing: boolean = false) {}

  async ping(): Promise<any> {
    if (this.shouldFailPing) {
      throw new Error('Ping failed');
    }
    return { ok: 1 };
  }
}

// Global document store to persist data across collection instances
const globalDocumentStore: { [collectionName: string]: any[] } = {};

class MockCollection implements CollectionInterface {
  private shouldFailOperations = false;

  constructor(private collectionName: string) {
    if (!globalDocumentStore[collectionName]) {
      globalDocumentStore[collectionName] = [];
    }
  }

  private get documents(): any[] {
    return globalDocumentStore[this.collectionName];
  }

  async insertOne(doc: any): Promise<{ insertedId: any }> {
    if (this.shouldFailOperations) {
      throw new Error('Insert failed');
    }
    const id = 'mock-id-' + Date.now() + '-' + Math.random();
    const newDoc = { ...doc, _id: id };
    this.documents.push(newDoc);
    return { insertedId: id };
  }

  async findOne(filter: any): Promise<any> {
    if (this.shouldFailOperations) {
      throw new Error('FindOne failed');
    }
    return this.documents.find(doc => 
      Object.keys(filter).every(key => doc[key] === filter[key])
    ) || null;
  }

  find(filter: any): { toArray(): Promise<any[]> } {
    return {
      toArray: async () => {
        if (this.shouldFailOperations) {
          throw new Error('Find failed');
        }
        return this.documents.filter(doc =>
          Object.keys(filter).length === 0 || 
          Object.keys(filter).every(key => doc[key] === filter[key])
        );
      }
    };
  }

  async updateOne(filter: any, update: any): Promise<{ modifiedCount: number }> {
    if (this.shouldFailOperations) {
      throw new Error('Update failed');
    }
    const docIndex = this.documents.findIndex(doc =>
      Object.keys(filter).every(key => doc[key] === filter[key])
    );
    if (docIndex >= 0) {
      this.documents[docIndex] = { ...this.documents[docIndex], ...update.$set };
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    if (this.shouldFailOperations) {
      throw new Error('Delete failed');
    }
    const docIndex = this.documents.findIndex(doc =>
      Object.keys(filter).every(key => doc[key] === filter[key])
    );
    if (docIndex >= 0) {
      this.documents.splice(docIndex, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async createIndex(keys: any, options?: any): Promise<string> {
    return 'mock-index';
  }

  // Test helpers
  setOperationFailure(shouldFail: boolean): void {
    this.shouldFailOperations = shouldFail;
  }

  getDocuments(): any[] {
    return this.documents;
  }

  clearDocuments(): void {
    globalDocumentStore[this.collectionName] = [];
  }
}

describe('DatabaseService', () => {
  let mockClient: MockMongoClient;
  let databaseService: DatabaseService;

  beforeEach(() => {
    // Clear global document store
    Object.keys(globalDocumentStore).forEach(key => {
      globalDocumentStore[key] = [];
    });
    
    mockClient = new MockMongoClient();
    databaseService = new DatabaseService(mockClient);
  });

  afterEach(async () => {
    await databaseService.disconnect();
  });

  describe('Connection Management', () => {
    it('should successfully connect to database', async () => {
      await databaseService.connect();
      
      expect(databaseService.getConnectionState()).toBe(ConnectionState.CONNECTED);
      expect(mockClient.isConnected()).toBe(true);
    });

    it('should handle connection failures with retry logic', async () => {
      mockClient.setConnectionFailure(true);
      
      // Configure for faster testing
      const fastRetryService = new DatabaseService(
        mockClient,
        undefined,
        { maxRetries: 2, initialDelay: 10, maxDelay: 100, backoffMultiplier: 2 }
      );

      await expect(fastRetryService.connect()).rejects.toThrow('Max connection retries');
      expect(fastRetryService.getConnectionState()).toBe(ConnectionState.FAILED);
    });

    it('should not connect if already connected', async () => {
      await databaseService.connect();
      const firstState = databaseService.getConnectionState();
      
      await databaseService.connect(); // Second call
      const secondState = databaseService.getConnectionState();
      
      expect(firstState).toBe(ConnectionState.CONNECTED);
      expect(secondState).toBe(ConnectionState.CONNECTED);
    });

    it('should test connection with ping', async () => {
      await databaseService.connect();
      const isHealthy = await databaseService.testConnection();
      
      expect(isHealthy).toBe(true);
    });

    it('should handle ping failures', async () => {
      mockClient.setPingFailure(true);
      
      // Configure for faster testing
      const fastRetryService = new DatabaseService(
        mockClient,
        undefined,
        { maxRetries: 1, initialDelay: 10, maxDelay: 100, backoffMultiplier: 2 }
      );
      
      await expect(fastRetryService.connect()).rejects.toThrow();
      expect(fastRetryService.getConnectionState()).toBe(ConnectionState.FAILED);
    }, 10000);

    it('should disconnect successfully', async () => {
      await databaseService.connect();
      await databaseService.disconnect();
      
      expect(databaseService.getConnectionState()).toBe(ConnectionState.DISCONNECTED);
      expect(mockClient.isConnected()).toBe(false);
    });

    it('should provide connection statistics', async () => {
      const stats = databaseService.getConnectionStats();
      
      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('retries');
      expect(stats).toHaveProperty('lastAttempt');
      expect(stats).toHaveProperty('isHealthy');
    });
  });

  describe('Generic CRUD Operations', () => {
    beforeEach(async () => {
      await databaseService.connect();
    });

    it('should create documents successfully', async () => {
      const testDoc = { name: 'Test Document', value: 123 };
      const result = await databaseService.create('test_collection', testDoc);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('_id');
      expect(result.data?.name).toBe('Test Document');
    });

    it('should read documents successfully', async () => {
      // Create test document first
      await databaseService.create('test_collection', { name: 'Test', value: 1 });
      
      const result = await databaseService.read<{ name: string; value: number }>('test_collection', { name: 'Test' });
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe('Test');
    });

    it('should read single document successfully', async () => {
      // Create test document first
      await databaseService.create('test_collection', { name: 'Single', value: 1 });
      
      const result = await databaseService.readOne<{ name: string; value: number }>('test_collection', { name: 'Single' });
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Single');
    });

    it('should update documents successfully', async () => {
      // Create test document first
      await databaseService.create('test_collection', { name: 'Update Test', value: 1 });
      
      const result = await databaseService.update(
        'test_collection', 
        { name: 'Update Test' }, 
        { value: 2 }
      );
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should delete documents successfully', async () => {
      // Create test document first
      await databaseService.create('test_collection', { name: 'Delete Test', value: 1 });
      
      const result = await databaseService.delete('test_collection', { name: 'Delete Test' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should handle operation failures gracefully', async () => {
      await databaseService.disconnect();
      
      const result = await databaseService.create('test_collection', { name: 'Test' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Create operation failed');
    });
  });

  describe('Product Operations', () => {
    beforeEach(async () => {
      await databaseService.connect();
    });

    const mockProduct: Omit<Product, '_id'> = {
      upc: '123456789012',
      name: 'Test Product',
      ingredients: ['ingredient1', 'ingredient2'],
      allergens: ['milk'],
      dietaryFlags: { vegan: false, glutenFree: true },
      source: 'manual',
      lastUpdated: new Date(),
      confidence: 0.95
    };

    it('should create product successfully', async () => {
      const result = await databaseService.createProduct(mockProduct);
      
      expect(result.success).toBe(true);
      expect(result.data?.upc).toBe('123456789012');
    });

    it('should get product by UPC', async () => {
      await databaseService.createProduct(mockProduct);
      
      const result = await databaseService.getProductByUPC('123456789012');
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test Product');
    });

    it('should get all products', async () => {
      await databaseService.createProduct(mockProduct);
      
      const result = await databaseService.getProducts();
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should update product', async () => {
      await databaseService.createProduct(mockProduct);
      
      const result = await databaseService.updateProduct('123456789012', { name: 'Updated Product' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should delete product', async () => {
      await databaseService.createProduct(mockProduct);
      
      const result = await databaseService.deleteProduct('123456789012');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('User Operations', () => {
    beforeEach(async () => {
      await databaseService.connect();
    });

    const mockUser: Omit<User, '_id'> = {
      profileId: 'test-user-123',
      name: 'Test User',
      dietaryRestrictions: {
        allergies: ['milk'],
        religious: [],
        medical: [],
        lifestyle: ['vegan']
      },
      preferences: {
        alertLevel: 'strict',
        notifications: true,
        offlineMode: false
      },
      createdAt: new Date(),
      lastActive: new Date()
    };

    it('should create user successfully', async () => {
      const result = await databaseService.createUser(mockUser);
      
      expect(result.success).toBe(true);
      expect(result.data?.profileId).toBe('test-user-123');
    });

    it('should get user by profile ID', async () => {
      await databaseService.createUser(mockUser);
      
      const result = await databaseService.getUserByProfileId('test-user-123');
      
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Test User');
    });

    it('should update user', async () => {
      await databaseService.createUser(mockUser);
      
      const result = await databaseService.updateUser('test-user-123', { name: 'Updated User' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should delete user', async () => {
      await databaseService.createUser(mockUser);
      
      const result = await databaseService.deleteUser('test-user-123');
      
      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });
  });

  describe('ScanResult Operations', () => {
    beforeEach(async () => {
      await databaseService.connect();
    });

    const mockScanResult: Omit<ScanResult, '_id'> = {
      userId: '507f1f77bcf86cd799439011',
      productId: '507f1f77bcf86cd799439012',
      upc: '123456789012',
      scanTimestamp: new Date(),
      complianceStatus: 'safe',
      violations: []
    };

    it('should create scan result successfully', async () => {
      const result = await databaseService.createScanResult(mockScanResult);
      
      expect(result.success).toBe(true);
      expect(result.data?.upc).toBe('123456789012');
    });

    it('should get scan results by user ID', async () => {
      await databaseService.createScanResult(mockScanResult);
      
      const result = await databaseService.getScanResultsByUserId('507f1f77bcf86cd799439011');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should update scan result', async () => {
      const createResult = await databaseService.createScanResult(mockScanResult);
      const scanResultId = createResult.data?._id;
      
      if (scanResultId) {
        const result = await databaseService.updateScanResult(scanResultId, { 
          complianceStatus: 'caution' 
        });
        
        expect(result.success).toBe(true);
        expect(result.data).toBe(true);
      }
    });

    it('should delete scan result', async () => {
      const createResult = await databaseService.createScanResult(mockScanResult);
      const scanResultId = createResult.data?._id;
      
      if (scanResultId) {
        const result = await databaseService.deleteScanResult(scanResultId);
        
        expect(result.success).toBe(true);
        expect(result.data).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should create DatabaseError with proper properties', () => {
      const originalError = new Error('Original error');
      const dbError = new DatabaseError('Database error', originalError, 'TEST_CODE');
      
      expect(dbError.name).toBe('DatabaseError');
      expect(dbError.message).toBe('Database error');
      expect(dbError.originalError).toBe(originalError);
      expect(dbError.code).toBe('TEST_CODE');
    });

    it('should handle missing MongoDB driver gracefully', async () => {
      const serviceWithoutClient = new DatabaseService(
        undefined,
        undefined,
        { maxRetries: 0, initialDelay: 10, maxDelay: 100, backoffMultiplier: 2 }
      );
      
      await expect(serviceWithoutClient.connect()).rejects.toThrow('MongoDB driver not available');
    }, 10000);
  });

  describe('Configuration Validation', () => {
    it('should validate database configuration', async () => {
      const invalidConfigService = new DatabaseService(
        mockClient,
        { uri: '', database: '' }, // Invalid config
        { maxRetries: 0, initialDelay: 10, maxDelay: 100, backoffMultiplier: 2 }
      );
      
      await expect(invalidConfigService.connect()).rejects.toThrow('MongoDB URI is required');
    }, 10000);

    it('should validate timeout configuration', async () => {
      const invalidTimeoutService = new DatabaseService(
        mockClient,
        { connectionTimeout: -1 }, // Invalid timeout
        { maxRetries: 0, initialDelay: 10, maxDelay: 100, backoffMultiplier: 2 }
      );
      
      await expect(invalidTimeoutService.connect()).rejects.toThrow('Connection timeout must be positive');
    }, 10000);
  });
});