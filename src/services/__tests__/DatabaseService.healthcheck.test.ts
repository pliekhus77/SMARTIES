/**
 * Unit tests for DatabaseService health check functionality
 * Tests requirements 5.1 and 5.5 for connection testing and health monitoring
 */

// Mock the config module before importing DatabaseService
jest.mock('../../config/config', () => ({
  config: {
    mongodb: {
      uri: 'mongodb://test-uri',
      database: 'test-database'
    },
    ai: {
      openaiApiKey: 'test-openai-key',
      anthropicApiKey: 'test-anthropic-key'
    },
    apis: {
      openFoodFactsUrl: 'https://test-api.com',
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

import { DatabaseService, ConnectionState, DatabaseHealthStatus, ConnectionStatus } from '../DatabaseService';
import { MongoClientInterface, DatabaseInterface, CollectionInterface, AdminInterface } from '../DatabaseService';

// Mock implementations for testing
class MockAdmin implements AdminInterface {
  private shouldFail: boolean;

  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
  }

  async ping(): Promise<any> {
    if (this.shouldFail) {
      throw new Error('Ping failed');
    }
    return { ok: 1 };
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }
}

class MockCollection implements CollectionInterface {
  private shouldFail: boolean;

  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
  }

  async insertOne(doc: any): Promise<{ insertedId: any }> {
    if (this.shouldFail) throw new Error('Insert failed');
    return { insertedId: 'mock-id' };
  }

  async findOne(filter: any): Promise<any> {
    if (this.shouldFail) throw new Error('FindOne failed');
    return { _id: 'mock-id', ...filter };
  }

  find(filter: any): { toArray(): Promise<any[]> } {
    return {
      toArray: async () => {
        if (this.shouldFail) throw new Error('Find failed');
        return [{ _id: 'mock-id', ...filter }];
      }
    };
  }

  async updateOne(filter: any, update: any): Promise<{ modifiedCount: number }> {
    if (this.shouldFail) throw new Error('Update failed');
    return { modifiedCount: 1 };
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    if (this.shouldFail) throw new Error('Delete failed');
    return { deletedCount: 1 };
  }

  async createIndex(keys: any, options?: any): Promise<string> {
    if (this.shouldFail) throw new Error('CreateIndex failed');
    return 'mock-index';
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }
}

class MockDatabase implements DatabaseInterface {
  private mockAdmin: MockAdmin;
  private mockCollections: Map<string, MockCollection>;

  constructor() {
    this.mockAdmin = new MockAdmin();
    this.mockCollections = new Map();
    
    // Initialize core collections
    ['products', 'users', 'scan_results'].forEach(name => {
      this.mockCollections.set(name, new MockCollection());
    });
  }

  collection(name: string): CollectionInterface {
    if (!this.mockCollections.has(name)) {
      this.mockCollections.set(name, new MockCollection());
    }
    return this.mockCollections.get(name)!;
  }

  admin(): AdminInterface {
    return this.mockAdmin;
  }

  setAdminShouldFail(shouldFail: boolean): void {
    this.mockAdmin.setShouldFail(shouldFail);
  }

  setCollectionShouldFail(collectionName: string, shouldFail: boolean): void {
    const collection = this.mockCollections.get(collectionName);
    if (collection instanceof MockCollection) {
      collection.setShouldFail(shouldFail);
    }
  }

  setAllCollectionsShouldFail(shouldFail: boolean): void {
    this.mockCollections.forEach(collection => {
      if (collection instanceof MockCollection) {
        collection.setShouldFail(shouldFail);
      }
    });
  }
}

class MockMongoClient implements MongoClientInterface {
  private mockDatabase: MockDatabase;
  private shouldFailConnect: boolean;

  constructor() {
    this.mockDatabase = new MockDatabase();
    this.shouldFailConnect = false;
  }

  async connect(): Promise<void> {
    if (this.shouldFailConnect) {
      throw new Error('Connection failed');
    }
  }

  async close(): Promise<void> {
    // Mock close operation
  }

  db(name?: string): DatabaseInterface {
    return this.mockDatabase;
  }

  setShouldFailConnect(shouldFail: boolean): void {
    this.shouldFailConnect = shouldFail;
  }

  getMockDatabase(): MockDatabase {
    return this.mockDatabase;
  }
}

describe('DatabaseService Health Check Tests', () => {
  let databaseService: DatabaseService;
  let mockClient: MockMongoClient;

  beforeEach(() => {
    mockClient = new MockMongoClient();
    databaseService = new DatabaseService(
      mockClient,
      {
        uri: 'mongodb://test',
        database: 'test-db',
        connectionTimeout: 5000,
        serverSelectionTimeout: 3000,
        maxPoolSize: 5,
        retryWrites: true
      },
      {
        maxRetries: 2,
        initialDelay: 100,
        maxDelay: 1000,
        backoffMultiplier: 2
      }
    );
  });

  afterEach(async () => {
    await databaseService.stopConnectionMonitoring();
    await databaseService.disconnect();
  });

  describe('testConnection', () => {
    it('should return true when database ping succeeds', async () => {
      // Arrange
      await databaseService.connect();

      // Act
      const result = await databaseService.testConnection();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when database ping fails', async () => {
      // Arrange
      await databaseService.connect();
      mockClient.getMockDatabase().setAdminShouldFail(true);

      // Act
      const result = await databaseService.testConnection();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when database is not initialized', async () => {
      // Act (without connecting)
      const result = await databaseService.testConnection();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('performHealthCheck', () => {
    it('should return healthy status when all checks pass', async () => {
      // Arrange
      await databaseService.connect();

      // Act
      const healthStatus = await databaseService.performHealthCheck();

      // Assert
      expect(healthStatus.isHealthy).toBe(true);
      expect(healthStatus.status).toBe('healthy');
      expect(healthStatus.checks.connectivity.status).toBe('pass');
      expect(healthStatus.checks.responseTime.status).toBe('pass');
      expect(healthStatus.checks.collections.status).toBe('pass');
      expect(healthStatus.connectionState).toBe(ConnectionState.CONNECTED);
      expect(healthStatus.timestamp).toBeInstanceOf(Date);
    });

    it('should return unhealthy status when connectivity fails', async () => {
      // Arrange
      await databaseService.connect();
      mockClient.getMockDatabase().setAdminShouldFail(true);

      // Act
      const healthStatus = await databaseService.performHealthCheck();

      // Assert
      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.status).toBe('unhealthy');
      expect(healthStatus.checks.connectivity.status).toBe('fail');
      expect(healthStatus.checks.responseTime.status).toBe('fail');
      expect(healthStatus.checks.collections.status).toBe('skip');
    });

    it('should return degraded status when collections fail but connectivity passes', async () => {
      // Arrange
      await databaseService.connect();
      mockClient.getMockDatabase().setAllCollectionsShouldFail(true);

      // Act
      const healthStatus = await databaseService.performHealthCheck();

      // Assert
      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.status).toBe('degraded');
      expect(healthStatus.checks.connectivity.status).toBe('pass');
      expect(healthStatus.checks.collections.status).toBe('fail');
    });

    it('should include response time in health check', async () => {
      // Arrange
      await databaseService.connect();

      // Act
      const healthStatus = await databaseService.performHealthCheck();

      // Assert
      expect(healthStatus.checks.responseTime.responseTime).toBeGreaterThanOrEqual(0);
      expect(healthStatus.checks.responseTime.responseTime).toBeLessThan(5000);
    });

    it('should handle health check errors gracefully', async () => {
      // Arrange - don't connect to simulate error condition

      // Act
      const healthStatus = await databaseService.performHealthCheck();

      // Assert
      expect(healthStatus.isHealthy).toBe(false);
      expect(healthStatus.status).toBe('unhealthy');
      expect(healthStatus.checks.connectivity.status).toBe('fail');
    });
  });

  describe('getConnectionStatus', () => {
    it('should return comprehensive connection status when connected', async () => {
      // Arrange
      await databaseService.connect();

      // Act
      const connectionStatus = await databaseService.getConnectionStatus();

      // Assert
      expect(connectionStatus.isConnected).toBe(true);
      expect(connectionStatus.state).toBe(ConnectionState.CONNECTED);
      expect(connectionStatus.retryCount).toBe(0);
      expect(connectionStatus.lastConnectionAttempt).toBeInstanceOf(Date);
      expect(connectionStatus.lastHealthCheck).toBeInstanceOf(Date);
      expect(connectionStatus.healthStatus).toBeDefined();
      expect(connectionStatus.uptime).toBeGreaterThanOrEqual(0);
      expect(connectionStatus.configuration).toEqual({
        database: 'test-db',
        maxPoolSize: 5,
        connectionTimeout: 5000,
        serverSelectionTimeout: 3000
      });
    });

    it('should return disconnected status when not connected', async () => {
      // Act (without connecting)
      const connectionStatus = await databaseService.getConnectionStatus();

      // Assert
      expect(connectionStatus.isConnected).toBe(false);
      expect(connectionStatus.state).toBe(ConnectionState.DISCONNECTED);
      expect(connectionStatus.lastConnectionAttempt).toBeNull();
    });
  });

  describe('startConnectionMonitoring', () => {
    it('should start monitoring with default interval', async () => {
      // Arrange
      await databaseService.connect();
      await databaseService.stopConnectionMonitoring(); // Ensure clean state
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await databaseService.startConnectionMonitoring();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Starting connection monitoring with 30000ms interval');

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should start monitoring with custom interval', async () => {
      // Arrange
      await databaseService.connect();
      await databaseService.stopConnectionMonitoring(); // Ensure clean state
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await databaseService.startConnectionMonitoring(10000);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Starting connection monitoring with 10000ms interval');

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should not start multiple monitoring instances', async () => {
      // Arrange
      await databaseService.connect();
      await databaseService.stopConnectionMonitoring(); // Ensure clean state
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await databaseService.startConnectionMonitoring();
      await databaseService.startConnectionMonitoring(); // Second call

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Connection monitoring already active');

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('stopConnectionMonitoring', () => {
    it('should stop active monitoring', async () => {
      // Arrange
      await databaseService.connect();
      await databaseService.startConnectionMonitoring();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await databaseService.stopConnectionMonitoring();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Connection monitoring stopped');

      // Cleanup
      consoleSpy.mockRestore();
    });

    it('should handle stopping when not monitoring', async () => {
      // Act (without starting monitoring)
      await databaseService.stopConnectionMonitoring();

      // Assert - should not throw error
      expect(true).toBe(true); // Test passes if no error thrown
    });
  });

  describe('collection access testing', () => {
    it('should test all core collections', async () => {
      // Arrange
      await databaseService.connect();

      // Act
      const healthStatus = await databaseService.performHealthCheck();

      // Assert
      expect(healthStatus.checks.collections.details).toEqual({
        products: true,
        users: true,
        scan_results: true
      });
      expect(healthStatus.checks.collections.message).toBe('3/3 collections accessible');
    });

    it('should handle partial collection failures', async () => {
      // Arrange
      await databaseService.connect();
      mockClient.getMockDatabase().setCollectionShouldFail('products', true);

      // Act
      const healthStatus = await databaseService.performHealthCheck();

      // Assert
      expect(healthStatus.checks.collections.details).toEqual({
        products: false,
        users: true,
        scan_results: true
      });
      expect(healthStatus.checks.collections.message).toBe('2/3 collections accessible');
      expect(healthStatus.checks.collections.status).toBe('fail');
    });
  });
});