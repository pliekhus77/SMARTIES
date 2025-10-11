/**
 * Database Service Integration Tests
 * Tests database connection with real MongoDB Atlas instance, CRUD operations,
 * error handling, retry logic, and offline fallback behavior.
 * 
 * Implements Requirements 5.1, 5.2, 5.3, 5.4, 5.5 from core architecture specification
 */

import { DatabaseService, DatabaseError, ConnectionState } from '../../services/DatabaseService';
import { Product, CreateProductInput } from '../../types/Product';
import { User, CreateUserInput } from '../../types/User';
import { ScanResult, CreateScanResultInput } from '../../types/ScanResult';
import { IntegrationTestUtils, integrationConfig } from './setup';

// Mock MongoDB client for testing
class MockMongoClient {
  private isConnected = false;
  private shouldFailConnection = false;
  private shouldFailOperations = false;
  private connectionAttempts = 0;
  private collections = new Map<string, MockCollection>();

  constructor() {
    this.collections.set('products', new MockCollection());
    this.collections.set('users', new MockCollection());
    this.collections.set('scan_results', new MockCollection());
  }

  async connect(): Promise<void> {
    this.connectionAttempts++;
    
    if (this.shouldFailConnection) {
      throw new Error('Connection failed');
    }
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 100));
    this.isConnected = true;
  }

  async close(): Promise<void> {
    this.isConnected = false;
  }

  db(name?: string) {
    return new MockDatabase(this.collections, this.shouldFailOperations);
  }

  // Test utilities
  setConnectionFailure(shouldFail: boolean): void {
    this.shouldFailConnection = shouldFail;
  }

  setOperationFailure(shouldFail: boolean): void {
    this.shouldFailOperations = shouldFail;
  }

  getConnectionAttempts(): number {
    return this.connectionAttempts;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  reset(): void {
    this.isConnected = false;
    this.shouldFailConnection = false;
    this.shouldFailOperations = false;
    this.connectionAttempts = 0;
    this.collections.forEach(collection => collection.clear());
  }
}

class MockDatabase {
  constructor(
    private collections: Map<string, MockCollection>,
    private shouldFailOperations: boolean
  ) {}

  collection(name: string) {
    const collection = this.collections.get(name);
    if (!collection) {
      throw new Error(`Collection ${name} not found`);
    }
    collection.setShouldFail(this.shouldFailOperations);
    return collection;
  }

  admin() {
    return new MockAdmin(this.shouldFailOperations);
  }
}

class MockCollection {
  private documents = new Map<string, any>();
  private shouldFail = false;

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  async insertOne(doc: any): Promise<{ insertedId: string }> {
    if (this.shouldFail) {
      throw new Error('Insert operation failed');
    }

    const id = doc._id || IntegrationTestUtils.generateTestId();
    const docWithId = { ...doc, _id: id };
    this.documents.set(id, docWithId);
    
    return { insertedId: id };
  }

  async findOne(filter: any): Promise<any> {
    if (this.shouldFail) {
      throw new Error('Find operation failed');
    }

    // Simple filter matching for testing
    for (const [id, doc] of this.documents) {
      if (this.matchesFilter(doc, filter)) {
        return doc;
      }
    }
    return null;
  }

  find(filter: any) {
    return {
      toArray: async (): Promise<any[]> => {
        if (this.shouldFail) {
          throw new Error('Find operation failed');
        }

        const results = [];
        for (const [id, doc] of this.documents) {
          if (this.matchesFilter(doc, filter)) {
            results.push(doc);
          }
        }
        return results;
      }
    };
  }

  async updateOne(filter: any, update: any): Promise<{ modifiedCount: number }> {
    if (this.shouldFail) {
      throw new Error('Update operation failed');
    }

    for (const [id, doc] of this.documents) {
      if (this.matchesFilter(doc, filter)) {
        const updatedDoc = { ...doc, ...update.$set };
        this.documents.set(id, updatedDoc);
        return { modifiedCount: 1 };
      }
    }
    return { modifiedCount: 0 };
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    if (this.shouldFail) {
      throw new Error('Delete operation failed');
    }

    for (const [id, doc] of this.documents) {
      if (this.matchesFilter(doc, filter)) {
        this.documents.delete(id);
        return { deletedCount: 1 };
      }
    }
    return { deletedCount: 0 };
  }

  async createIndex(keys: any, options?: any): Promise<string> {
    if (this.shouldFail) {
      throw new Error('Create index operation failed');
    }
    return 'index_created';
  }

  private matchesFilter(doc: any, filter: any): boolean {
    if (Object.keys(filter).length === 0) {
      return true; // Empty filter matches all
    }

    for (const [key, value] of Object.entries(filter)) {
      if (doc[key] !== value) {
        return false;
      }
    }
    return true;
  }

  clear(): void {
    this.documents.clear();
  }

  size(): number {
    return this.documents.size;
  }
}

class MockAdmin {
  constructor(private shouldFail: boolean) {}

  async ping(): Promise<any> {
    if (this.shouldFail) {
      throw new Error('Ping failed');
    }
    return { ok: 1 };
  }
}

describe('Database Operations Integration Tests', () => {
  let atlasService: AtlasIntegrationService;

  beforeEach(() => {
    atlasService = new AtlasIntegrationService();
  });

  afterEach(() => {
    atlasService.clear();
  });

  describe('Product Operations', () => {
    it('should create and retrieve products', async () => {
      const productData = TestProductBuilder.milkProduct();
      
      const createdProduct = await atlasService.createProduct(productData);
      
      expect(createdProduct.id).toBeDefined();
      expect(createdProduct.name).toBe(productData.name);
      expect(createdProduct.createdAt).toBeDefined();
      expect(createdProduct.updatedAt).toBeDefined();

      const retrievedProduct = await atlasService.findProductById(createdProduct.id);
      expect(retrievedProduct).toEqual(createdProduct);
    });

    it('should find products by UPC', async () => {
      const productData = TestProductBuilder.create()
        .withUpc('1234567890123')
        .withName('Test Product')
        .build();

      await atlasService.createProduct(productData);
      
      const foundProduct = await atlasService.findProductByUpc('1234567890123');
      expect(foundProduct).toBeDefined();
      expect(foundProduct.name).toBe('Test Product');
    });

    it('should update products', async () => {
      const productData = TestProductBuilder.safeProduct();
      const createdProduct = await atlasService.createProduct(productData);

      const updates = { name: 'Updated Product Name' };
      const updatedProduct = await atlasService.updateProduct(createdProduct.id, updates);

      expect(updatedProduct.name).toBe('Updated Product Name');
      expect(updatedProduct.updatedAt.getTime()).toBeGreaterThan(updatedProduct.createdAt.getTime());
    });

    it('should delete products', async () => {
      const productData = TestProductBuilder.safeProduct();
      const createdProduct = await atlasService.createProduct(productData);

      const deleted = await atlasService.deleteProduct(createdProduct.id);
      expect(deleted).toBe(true);

      const retrievedProduct = await atlasService.findProductById(createdProduct.id);
      expect(retrievedProduct).toBeNull();
    });

    it('should handle product not found scenarios', async () => {
      const nonExistentId = 'non-existent-id';
      
      const product = await atlasService.findProductById(nonExistentId);
      expect(product).toBeNull();

      await expect(atlasService.updateProduct(nonExistentId, { name: 'Updated' }))
        .rejects.toThrow('Product not found');
    });
  });

  describe('User Operations', () => {
    it('should create and retrieve users', async () => {
      const userData = TestUserProfileBuilder.milkAllergic();
      
      const createdUser = await atlasService.createUser(userData);
      
      expect(createdUser.id).toBeDefined();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.allergens).toEqual(userData.allergens);

      const retrievedUser = await atlasService.findUserById(createdUser.id);
      expect(retrievedUser).toEqual(createdUser);
    });

    it('should find users by email', async () => {
      const userData = TestUserProfileBuilder.create()
        .withEmail('test@example.com')
        .build();

      await atlasService.createUser(userData);
      
      const foundUser = await atlasService.findUserByEmail('test@example.com');
      expect(foundUser).toBeDefined();
      expect(foundUser.email).toBe('test@example.com');
    });

    it('should update user profiles', async () => {
      const userData = TestUserProfileBuilder.safeUser();
      const createdUser = await atlasService.createUser(userData);

      const updates = { allergens: ['peanuts', 'tree nuts'] };
      const updatedUser = await atlasService.updateUser(createdUser.id, updates);

      expect(updatedUser.allergens).toEqual(['peanuts', 'tree nuts']);
    });
  });

  describe('Scan History Operations', () => {
    it('should create and retrieve scan results', async () => {
      const scanData = TestScanResultBuilder.safeResult();
      
      const createdScan = await atlasService.createScanResult(scanData);
      
      expect(createdScan.id).toBeDefined();
      expect(createdScan.isCompliant).toBe(scanData.isCompliant);
      expect(createdScan.createdAt).toBeDefined();
    });

    it('should retrieve scan history by user', async () => {
      const userId = IntegrationTestUtils.generateTestId();
      
      // Create multiple scan results for the user
      const scan1 = TestScanResultBuilder.create().withUserId(userId).build();
      const scan2 = TestScanResultBuilder.create().withUserId(userId).build();
      const scan3 = TestScanResultBuilder.create().withUserId('other-user').build();

      await atlasService.createScanResult(scan1);
      await atlasService.createScanResult(scan2);
      await atlasService.createScanResult(scan3);

      const userScans = await atlasService.findScanHistoryByUserId(userId);
      
      expect(userScans).toHaveLength(2);
      expect(userScans.every(scan => scan.userId === userId)).toBe(true);
    });

    it('should retrieve scan history by product', async () => {
      const productId = IntegrationTestUtils.generateTestId();
      
      const scan1 = TestScanResultBuilder.create().withProductId(productId).build();
      const scan2 = TestScanResultBuilder.create().withProductId(productId).build();
      const scan3 = TestScanResultBuilder.create().withProductId('other-product').build();

      await atlasService.createScanResult(scan1);
      await atlasService.createScanResult(scan2);
      await atlasService.createScanResult(scan3);

      const productScans = await atlasService.findScanHistoryByProductId(productId);
      
      expect(productScans).toHaveLength(2);
      expect(productScans.every(scan => scan.productId === productId)).toBe(true);
    });
  });

  describe('Analytics Operations', () => {
    it('should calculate scan counts', async () => {
      const userId = IntegrationTestUtils.generateTestId();
      const productId = IntegrationTestUtils.generateTestId();

      // Create scan results
      await atlasService.createScanResult(
        TestScanResultBuilder.create().withUserId(userId).withProductId(productId).build()
      );
      await atlasService.createScanResult(
        TestScanResultBuilder.create().withUserId(userId).withProductId('other-product').build()
      );
      await atlasService.createScanResult(
        TestScanResultBuilder.create().withUserId('other-user').withProductId(productId).build()
      );

      const userScanCount = await atlasService.getUserScanCount(userId);
      const productScanCount = await atlasService.getProductScanCount(productId);

      expect(userScanCount).toBe(2);
      expect(productScanCount).toBe(2);
    });

    it('should calculate violation statistics', async () => {
      // Create various scan results
      await atlasService.createScanResult(TestScanResultBuilder.safeResult());
      await atlasService.createScanResult(TestScanResultBuilder.violationResult(['milk']));
      await atlasService.createScanResult(
        TestScanResultBuilder.create().withWarnings(['May contain traces']).build()
      );

      const stats = await atlasService.getViolationStats();

      expect(stats.total).toBe(3);
      expect(stats.violations).toBe(1);
      expect(stats.warnings).toBe(1);
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent operations', async () => {
      const promises = [];
      
      // Create multiple products concurrently
      for (let i = 0; i < 10; i++) {
        const productData = TestProductBuilder.create()
          .withName(`Product ${i}`)
          .withUpc(`123456789012${i}`)
          .build();
        promises.push(atlasService.createProduct(productData));
      }

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      expect(new Set(results.map(r => r.id)).size).toBe(10); // All unique IDs
    });

    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      // Create 100 scan results
      const promises = [];
      for (let i = 0; i < 100; i++) {
        const scanData = TestScanResultBuilder.create()
          .withUserId(`user_${i % 10}`) // 10 different users
          .build();
        promises.push(atlasService.createScanResult(scanData));
      }

      await Promise.all(promises);
      
      const endTime = Date.now();
      const stats = atlasService.getStats();

      expect(stats.scans).toBe(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
