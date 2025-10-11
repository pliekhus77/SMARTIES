// Mock services for testing

import { TestProduct, TestUserProfile, TestScanResult } from '../builders/testDataBuilders';

// Mock MongoDB Atlas service
export class MockAtlasService {
  private products: Map<string, TestProduct> = new Map();
  private users: Map<string, TestUserProfile> = new Map();
  private scanHistory: TestScanResult[] = [];

  async findProductByUpc(upc: string): Promise<TestProduct | null> {
    const product = Array.from(this.products.values()).find(p => p.upc === upc);
    return product || null;
  }

  async saveProduct(product: TestProduct): Promise<TestProduct> {
    this.products.set(product.id, product);
    return product;
  }

  async getUserProfile(userId: string): Promise<TestUserProfile | null> {
    return this.users.get(userId) || null;
  }

  async saveUserProfile(profile: TestUserProfile): Promise<TestUserProfile> {
    this.users.set(profile.id, profile);
    return profile;
  }

  async saveScanResult(result: TestScanResult): Promise<TestScanResult> {
    this.scanHistory.push(result);
    return result;
  }

  async getUserScanHistory(userId: string): Promise<TestScanResult[]> {
    return this.scanHistory.filter(scan => scan.userId === userId);
  }

  // Test helpers
  seedProduct(product: TestProduct): void {
    this.products.set(product.id, product);
  }

  seedUser(user: TestUserProfile): void {
    this.users.set(user.id, user);
  }

  clear(): void {
    this.products.clear();
    this.users.clear();
    this.scanHistory = [];
  }
}

// Mock AI service
export class MockAIService {
  private responses: Map<string, any> = new Map();

  async analyzeDietaryCompliance(
    product: TestProduct,
    userProfile: TestUserProfile
  ): Promise<{ isCompliant: boolean; violations: string[]; warnings: string[] }> {
    const key = `${product.id}-${userProfile.id}`;
    
    if (this.responses.has(key)) {
      return this.responses.get(key);
    }

    // Default logic: check for allergen matches
    const violations = product.allergens.filter(allergen =>
      userProfile.allergens.includes(allergen)
    );

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings: [],
    };
  }

  async generateRecommendations(userProfile: TestUserProfile): Promise<string[]> {
    const key = `recommendations-${userProfile.id}`;
    return this.responses.get(key) || ['Try organic products', 'Check ingredient lists'];
  }

  // Test helpers
  mockResponse(key: string, response: any): void {
    this.responses.set(key, response);
  }

  clear(): void {
    this.responses.clear();
  }
}

// Mock barcode scanner service
export class MockBarcodeService {
  private shouldSucceed = true;
  private mockBarcode = '1234567890123';

  async scanBarcode(): Promise<string> {
    if (!this.shouldSucceed) {
      throw new Error('Barcode scan failed');
    }
    return this.mockBarcode;
  }

  async requestPermissions(): Promise<boolean> {
    return this.shouldSucceed;
  }

  // Test helpers
  setMockBarcode(barcode: string): void {
    this.mockBarcode = barcode;
  }

  setShouldSucceed(succeed: boolean): void {
    this.shouldSucceed = succeed;
  }
}

// Mock HTTP client for API calls
export class MockHttpClient {
  private responses: Map<string, any> = new Map();
  private shouldFail = false;

  async get<T>(url: string): Promise<T> {
    if (this.shouldFail) {
      throw new Error('Network error');
    }

    const response = this.responses.get(url);
    if (!response) {
      throw new Error(`No mock response for ${url}`);
    }

    return response as T;
  }

  async post<T>(url: string, data: any): Promise<T> {
    if (this.shouldFail) {
      throw new Error('Network error');
    }

    const response = this.responses.get(url);
    if (!response) {
      throw new Error(`No mock response for ${url}`);
    }

    return response as T;
  }

  // Test helpers
  mockResponse(url: string, response: any): void {
    this.responses.set(url, response);
  }

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  clear(): void {
    this.responses.clear();
    this.shouldFail = false;
  }
}

// Export singleton instances for easy use in tests
export const mockAtlasService = new MockAtlasService();
export const mockAIService = new MockAIService();
export const mockBarcodeService = new MockBarcodeService();
export const mockHttpClient = new MockHttpClient();
