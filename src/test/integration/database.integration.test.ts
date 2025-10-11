import { TestProductBuilder, TestUserProfileBuilder, TestScanResultBuilder } from '../builders/testDataBuilders';
import { IntegrationTestUtils, integrationConfig } from './setup';

// Mock MongoDB Atlas service for integration testing
class AtlasIntegrationService {
  private products = new Map<string, any>();
  private users = new Map<string, any>();
  private scanHistory: any[] = [];

  // Product operations
  async createProduct(product: any): Promise<any> {
    const productWithId = {
      ...product,
      id: product.id || IntegrationTestUtils.generateTestId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.products.set(productWithId.id, productWithId);
    return productWithId;
  }

  async findProductByUpc(upc: string): Promise<any | null> {
    const product = Array.from(this.products.values()).find(p => p.upc === upc);
    return product || null;
  }

  async findProductById(id: string): Promise<any | null> {
    return this.products.get(id) || null;
  }

  async updateProduct(id: string, updates: any): Promise<any> {
    const product = this.products.get(id);
    if (!product) {
      throw new Error('Product not found');
    }

    const updatedProduct = {
      ...product,
      ...updates,
      updatedAt: new Date(),
    };

    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // User operations
  async createUser(user: any): Promise<any> {
    const userWithId = {
      ...user,
      id: user.id || IntegrationTestUtils.generateTestId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(userWithId.id, userWithId);
    return userWithId;
  }

  async findUserById(id: string): Promise<any | null> {
    return this.users.get(id) || null;
  }

  async findUserByEmail(email: string): Promise<any | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user || null;
  }

  async updateUser(id: string, updates: any): Promise<any> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Scan history operations
  async createScanResult(scanResult: any): Promise<any> {
    const scanWithId = {
      ...scanResult,
      id: scanResult.id || IntegrationTestUtils.generateTestId(),
      createdAt: new Date(),
    };

    this.scanHistory.push(scanWithId);
    return scanWithId;
  }

  async findScanHistoryByUserId(userId: string, limit: number = 50): Promise<any[]> {
    return this.scanHistory
      .filter(scan => scan.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async findScanHistoryByProductId(productId: string): Promise<any[]> {
    return this.scanHistory.filter(scan => scan.productId === productId);
  }

  // Analytics operations
  async getProductScanCount(productId: string): Promise<number> {
    return this.scanHistory.filter(scan => scan.productId === productId).length;
  }

  async getUserScanCount(userId: string): Promise<number> {
    return this.scanHistory.filter(scan => scan.userId === userId).length;
  }

  async getViolationStats(): Promise<{ total: number; violations: number; warnings: number }> {
    const total = this.scanHistory.length;
    const violations = this.scanHistory.filter(scan => !scan.isCompliant).length;
    const warnings = this.scanHistory.filter(scan => scan.warnings && scan.warnings.length > 0).length;

    return { total, violations, warnings };
  }

  // Test utilities
  clear(): void {
    this.products.clear();
    this.users.clear();
    this.scanHistory = [];
  }

  getStats(): { products: number; users: number; scans: number } {
    return {
      products: this.products.size,
      users: this.users.size,
      scans: this.scanHistory.length,
    };
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
