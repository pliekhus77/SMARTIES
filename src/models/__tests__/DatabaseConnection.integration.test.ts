/**
 * Integration tests for MongoDB Atlas Database Connection
 * Tests Requirements 1.5 and 5.5 implementation
 * 
 * Note: These tests require actual MongoDB connection and are skipped in CI
 */

import { DatabaseConnection, DatabaseManager } from '../DatabaseConnection';

// Skip these tests in CI environment or when MongoDB is not available
const shouldRunIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';

describe('DatabaseConnection Integration Tests', () => {
  let dbConnection: DatabaseConnection;

  beforeAll(async () => {
    if (!shouldRunIntegrationTests) {
      return;
    }
    
    dbConnection = DatabaseManager.getInstance();
  });

  afterAll(async () => {
    if (!shouldRunIntegrationTests) {
      return;
    }
    
    try {
      await DatabaseManager.shutdown();
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  });

  describe('Connection Management', () => {
    it('should connect to MongoDB Atlas', async () => {
      if (!shouldRunIntegrationTests) {
        console.log('Skipping integration test - set RUN_INTEGRATION_TESTS=true to run');
        return;
      }

      await expect(dbConnection.connect()).resolves.not.toThrow();
      
      const status = dbConnection.getConnectionStatus();
      expect(status.isConnected).toBe(true);
      expect(status.database).toBe('smarties');
      expect(status.connectionTime).toBeGreaterThan(0);
    });

    it('should ping database successfully', async () => {
      if (!shouldRunIntegrationTests) {
        return;
      }

      const pingResult = await dbConnection.ping();
      expect(pingResult).toBe(true);
      
      const status = dbConnection.getConnectionStatus();
      expect(status.lastPing).toBeInstanceOf(Date);
    });

    it('should get products collection', async () => {
      if (!shouldRunIntegrationTests) {
        return;
      }

      const collection = dbConnection.getProductsCollection();
      expect(collection).toBeDefined();
    });
  });

  describe('Index Management', () => {
    it('should create required indexes', async () => {
      if (!shouldRunIntegrationTests) {
        return;
      }

      const results = await dbConnection.createIndexes();
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);
      
      const successfulIndexes = results.filter(r => r.success);
      expect(successfulIndexes.length).toBeGreaterThan(0);
    });

    it('should list existing indexes', async () => {
      if (!shouldRunIntegrationTests) {
        return;
      }

      const indexes = await dbConnection.listIndexes();
      expect(indexes).toBeInstanceOf(Array);
      expect(indexes.length).toBeGreaterThan(0);
      
      // Should have at least the default _id index
      const idIndex = indexes.find(idx => idx.name === '_id_');
      expect(idIndex).toBeDefined();
    });
  });

  describe('Storage Monitoring', () => {
    it('should get storage statistics', async () => {
      if (!shouldRunIntegrationTests) {
        return;
      }

      const stats = await dbConnection.getStorageStats();
      
      expect(stats.totalSizeBytes).toBeGreaterThanOrEqual(0);
      expect(stats.documentCount).toBeGreaterThanOrEqual(0);
      expect(stats.utilizationPercentage).toBeGreaterThanOrEqual(0);
      expect(stats.utilizationPercentage).toBeLessThanOrEqual(100);
      expect(stats.availableSpaceBytes).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Setup Validation', () => {
    it('should validate database setup', async () => {
      if (!shouldRunIntegrationTests) {
        return;
      }

      const validation = await dbConnection.validateSetup();
      
      expect(validation.connection).toBe(true);
      expect(validation.issues).toBeInstanceOf(Array);
      
      // Should have minimal issues for a fresh setup
      const criticalIssues = validation.issues.filter(issue => 
        !issue.includes('Vector search') // Vector search setup is manual
      );
      expect(criticalIssues.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      if (!shouldRunIntegrationTests) {
        return;
      }

      // Create a connection with invalid URI
      const invalidConnection = new DatabaseConnection();
      
      // Override connection string to invalid one
      (invalidConnection as any).connectionString = 'mongodb://invalid:27017/test';
      
      await expect(invalidConnection.connect()).rejects.toThrow();
      
      const status = invalidConnection.getConnectionStatus();
      expect(status.isConnected).toBe(false);
      expect(status.error).toBeTruthy();
    });
  });
});

describe('DatabaseManager', () => {
  describe('Singleton Pattern', () => {
    it('should return same instance', () => {
      const instance1 = DatabaseManager.getInstance();
      const instance2 = DatabaseManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should provide optimization recommendations', () => {
      const db = DatabaseManager.getInstance();
      const recommendations = db.getOptimizationRecommendations();
      
      expect(recommendations).toBeInstanceOf(Array);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('M0'))).toBe(true);
      expect(recommendations.some(r => r.includes('512MB'))).toBe(true);
    });
  });
});