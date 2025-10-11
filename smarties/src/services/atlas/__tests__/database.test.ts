/**
 * Database service tests
 * Tests for MongoDB Atlas connection and CRUD operations
 */

import { DatabaseService, DatabaseConfig } from '../database';
import { Product } from '../../../models/Product';
import { UserProfile } from '../../../models/UserProfile';
import { ScanHistory } from '../../../models/ScanHistory';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  let mockConfig: DatabaseConfig;

  beforeEach(() => {
    mockConfig = {
      connectionString: 'mongodb+srv://test@cluster.mongodb.net',
      databaseName: 'test_db',
      dataApiKey: 'test-api-key',
      retryAttempts: 2,
      retryDelay: 100,
      timeout: 5000,
    };

    databaseService = new DatabaseService(mockConfig);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect successfully on first attempt', async () => {
      // Mock successful connection test
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ document: null }),
      });

      await databaseService.connect();

      expect(databaseService.isConnectionActive()).toBe(true);
    });

    it('should retry on connection failure and eventually succeed', async () => {
      // Mock first attempt failure, second attempt success
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ document: null }),
        });

      await databaseService.connect();

      expect(databaseService.isConnectionActive()).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retry attempts', async () => {
      // Mock all attempts failing
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(databaseService.connect()).rejects.toThrow(
        'Database connection failed after 2 attempts'
      );

      expect(databaseService.isConnectionActive()).toBe(false);
    });
  });

  describe('findProductByUPC', () => {
    beforeEach(async () => {
      // Mock successful connection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ document: null }),
      });
      await databaseService.connect();
      jest.clearAllMocks();
    });

    it('should find product by UPC', async () => {
      const mockProduct: Product = {
        upc: '123456789',
        name: 'Test Product',
        brand: 'Test Brand',
        ingredients: ['ingredient1', 'ingredient2'],
        allergens: ['milk'],
        nutritional_info: { calories: 100 },
        dietary_flags: { vegan: false },
        source: 'test',
        last_updated: new Date(),
        confidence_score: 0.9,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ document: mockProduct }),
      });

      const result = await databaseService.findProductByUPC('123456789');

      expect(result).toEqual(mockProduct);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/action/findOne'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'api-key': 'test-api-key',
          }),
        })
      );
    });

    it('should return null when product not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ document: null }),
      });

      const result = await databaseService.findProductByUPC('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('saveUserProfile', () => {
    beforeEach(async () => {
      // Mock successful connection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ document: null }),
      });
      await databaseService.connect();
      jest.clearAllMocks();
    });

    it('should save user profile successfully', async () => {
      const mockProfile: UserProfile = {
        user_id: 'test-user',
        dietary_restrictions: {
          allergies: ['milk'],
          medical: [],
          religious: [],
          lifestyle: ['vegan'],
        },
        preferences: {
          strict_mode: true,
          notification_level: 'high',
          language: 'en',
        },
        created_at: new Date(),
        last_active: new Date(),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ acknowledged: true }),
      });

      const result = await databaseService.saveUserProfile(mockProfile);

      expect(result).toEqual(expect.objectContaining({
        user_id: 'test-user',
        dietary_restrictions: mockProfile.dietary_restrictions,
      }));
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/action/replaceOne'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('saveScanHistory', () => {
    beforeEach(async () => {
      // Mock successful connection
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ document: null }),
      });
      await databaseService.connect();
      jest.clearAllMocks();
    });

    it('should save scan history successfully', async () => {
      const mockScanHistory: ScanHistory = {
        user_id: 'test-user',
        product_upc: '123456789',
        scan_timestamp: new Date(),
        compliance_result: {
          safe: true,
          violations: [],
          warnings: [],
          confidence: 0.9,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ acknowledged: true }),
      });

      const result = await databaseService.saveScanHistory(mockScanHistory);

      expect(result).toEqual(expect.objectContaining({
        user_id: 'test-user',
        product_upc: '123456789',
      }));
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/action/insertOne'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await databaseService.disconnect();

      expect(databaseService.isConnectionActive()).toBe(false);
    });
  });
});