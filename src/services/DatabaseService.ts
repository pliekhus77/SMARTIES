/**
 * MongoDB Atlas Database Service for SMARTIES application
 * Implements Requirements 5.1 and 5.3 from core architecture specification
 * 
 * Features:
 * - Connection management with retry logic and exponential backoff
 * - Connection pooling and timeout configuration
 * - Type-safe CRUD operations for all collections
 * - Comprehensive error handling and logging
 * - Health checks and connection monitoring
 */

import { config, ConfigurationError } from '../config/config';
import { Product } from '../types/Product';
import { User } from '../types/User';
import { ScanResult } from '../types/ScanResult';
import { 
  OfflineManager, 
  OfflineCacheManager, 
  OfflineUtils, 
  CacheEntry 
} from '../utils/offline';

/**
 * MongoDB client interface for dependency injection and testing
 */
export interface MongoClientInterface {
  connect(): Promise<void>;
  close(): Promise<void>;
  db(name?: string): DatabaseInterface;
}

/**
 * MongoDB database interface for dependency injection and testing
 */
export interface DatabaseInterface {
  collection(name: string): CollectionInterface;
  admin(): AdminInterface;
}

/**
 * MongoDB collection interface for dependency injection and testing
 */
export interface CollectionInterface {
  insertOne(doc: any): Promise<{ insertedId: any }>;
  findOne(filter: any): Promise<any>;
  find(filter: any): { 
    toArray(): Promise<any[]>;
    sort(sort: any): { 
      toArray(): Promise<any[]>;
      limit(limit: number): { toArray(): Promise<any[]> };
    };
    limit(limit: number): { 
      toArray(): Promise<any[]>;
      sort(sort: any): { toArray(): Promise<any[]> };
    };
  };
  updateOne(filter: any, update: any): Promise<{ modifiedCount: number }>;
  deleteOne(filter: any): Promise<{ deletedCount: number }>;
  createIndex(keys: any, options?: any): Promise<string>;
  indexes(): Promise<any[]>;
  dropIndex(indexName: string): Promise<any>;
}

/**
 * MongoDB admin interface for health checks
 */
export interface AdminInterface {
  ping(): Promise<any>;
}

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  uri: string;
  database: string;
  connectionTimeout: number;
  serverSelectionTimeout: number;
  maxPoolSize: number;
  retryWrites: boolean;
}

/**
 * Connection retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Database operation result
 */
export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Health check status for individual checks
 */
export interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
}

/**
 * Comprehensive database health status
 */
export interface DatabaseHealthStatus {
  isHealthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    connectivity: HealthCheckResult;
    responseTime: HealthCheckResult;
    collections: HealthCheckResult;
  };
  timestamp: Date;
  connectionState: ConnectionState;
}

/**
 * Detailed connection status information
 */
export interface ConnectionStatus {
  isConnected: boolean;
  state: ConnectionState;
  retryCount: number;
  lastConnectionAttempt: Date | null;
  lastHealthCheck: Date;
  healthStatus: DatabaseHealthStatus;
  uptime: number;
  configuration: {
    database: string;
    maxPoolSize: number;
    connectionTimeout: number;
    serverSelectionTimeout: number;
  };
}

/**
 * Custom error class for database operations
 */
export class DatabaseError extends Error {
  public readonly code?: string;
  public readonly originalError?: any;

  constructor(message: string, originalError?: any, code?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
    this.code = code;
  }
}

/**
 * Database connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

/**
 * MongoDB Atlas Database Service
 * Provides reliable connectivity with comprehensive error handling and offline fallback capabilities
 */
export class DatabaseService {
  private client: MongoClientInterface | null = null;
  private db: DatabaseInterface | null = null;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private connectionRetries = 0;
  private lastConnectionAttempt: Date | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private offlineManager: OfflineManager;
  private cacheManager: OfflineCacheManager;

  private readonly dbConfig: DatabaseConfig;
  private readonly retryConfig: RetryConfig;

  constructor(
    mongoClient?: MongoClientInterface,
    customDbConfig?: Partial<DatabaseConfig>,
    customRetryConfig?: Partial<RetryConfig>
  ) {
    // Initialize database configuration
    this.dbConfig = {
      uri: config.mongodb.uri,
      database: config.mongodb.database,
      connectionTimeout: 10000, // 10 seconds
      serverSelectionTimeout: 5000, // 5 seconds
      maxPoolSize: 10,
      retryWrites: true,
      ...customDbConfig
    };

    // Initialize retry configuration with exponential backoff
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
      ...customRetryConfig
    };

    // Use provided client or create default (for testing)
    this.client = mongoClient || null;

    // Initialize offline management
    this.offlineManager = OfflineManager.getInstance();
    this.cacheManager = OfflineCacheManager.getInstance({
      enableOfflineMode: true,
      maxCacheSize: 50,
      cacheExpirationHours: 24,
      syncRetryAttempts: this.retryConfig.maxRetries,
      syncRetryDelayMs: this.retryConfig.initialDelay
    });

    // Set up offline mode listener
    this.offlineManager.addOfflineListener((isOffline) => {
      if (isOffline) {
        console.log('Database service entering offline mode');
        this.connectionState = ConnectionState.DISCONNECTED;
      } else {
        console.log('Database service coming back online, attempting reconnection');
        this.connect().catch(error => {
          console.error('Failed to reconnect after coming online:', error);
        });
      }
    });
  }

  /**
   * Establishes connection to MongoDB Atlas with retry logic
   * Implements exponential backoff for connection failures
   */
  async connect(): Promise<void> {
    if (this.connectionState === ConnectionState.CONNECTED) {
      console.log('Database already connected');
      return;
    }

    if (this.connectionState === ConnectionState.CONNECTING) {
      console.log('Connection already in progress');
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;
    this.lastConnectionAttempt = new Date();

    try {
      // Validate configuration before attempting connection
      this.validateConfiguration();

      // Create MongoDB client if not provided (production mode)
      if (!this.client) {
        this.client = await this.createMongoClient();
      }

      // Establish connection
      await this.client.connect();
      this.db = this.client.db(this.dbConfig.database);

      // Verify connection with ping
      const isHealthy = await this.testConnection();
      if (!isHealthy) {
        throw new DatabaseError('Connection test failed after successful connect');
      }

      this.connectionState = ConnectionState.CONNECTED;
      this.connectionRetries = 0;
      
      console.log(`Successfully connected to MongoDB Atlas database: ${this.dbConfig.database}`);
      
      // Start health check monitoring
      this.startHealthCheckMonitoring();

    } catch (error) {
      console.error('Database connection failed:', error);
      this.connectionState = ConnectionState.FAILED;
      await this.handleConnectionFailure(error);
    }
  }

  /**
   * Creates MongoDB client with optimized configuration for mobile apps
   */
  private async createMongoClient(): Promise<MongoClientInterface> {
    // In a real implementation, this would import and create MongoClient
    // For now, we'll throw an error to indicate MongoDB driver is needed
    throw new DatabaseError(
      'MongoDB driver not available. Please install mongodb package: npm install mongodb',
      null,
      'MISSING_DEPENDENCY'
    );
  }

  /**
   * Validates database configuration
   */
  private validateConfiguration(): void {
    if (!this.dbConfig.uri) {
      throw new ConfigurationError('MongoDB URI is required');
    }

    if (!this.dbConfig.database) {
      throw new ConfigurationError('MongoDB database name is required');
    }

    if (this.dbConfig.connectionTimeout <= 0) {
      throw new ConfigurationError('Connection timeout must be positive');
    }

    if (this.dbConfig.maxPoolSize <= 0) {
      throw new ConfigurationError('Max pool size must be positive');
    }
  }

  /**
   * Tests database connection with ping command
   * Implements requirement 5.1 for connection testing
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.db) {
        console.error('Database not initialized');
        return false;
      }

      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('Database ping failed:', error);
      return false;
    }
  }

  /**
   * Performs comprehensive database health check
   * Implements requirement 5.5 for health monitoring
   */
  async performHealthCheck(): Promise<DatabaseHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Test basic connectivity
      const pingResult = await this.testConnection();
      if (!pingResult) {
        return {
          isHealthy: false,
          status: 'unhealthy',
          checks: {
            connectivity: { status: 'fail', message: 'Database ping failed' },
            responseTime: { status: 'fail', responseTime: Date.now() - startTime, message: 'Response time check failed due to connectivity issue' },
            collections: { status: 'skip', message: 'Skipped due to connectivity failure' }
          },
          timestamp: new Date(),
          connectionState: this.connectionState
        };
      }

      // Test collection access
      const collectionsCheck = await this.testCollectionAccess();
      const responseTime = Date.now() - startTime;

      // Determine overall health
      const isHealthy = pingResult && collectionsCheck.success && responseTime < 5000; // 5 second threshold

      return {
        isHealthy,
        status: isHealthy ? 'healthy' : 'degraded',
        checks: {
          connectivity: { status: 'pass', message: 'Database ping successful' },
          responseTime: { 
            status: responseTime < 5000 ? 'pass' : 'warn', 
            responseTime,
            message: responseTime < 5000 ? 'Response time acceptable' : 'Response time slow'
          },
          collections: {
            status: collectionsCheck.success ? 'pass' : 'fail',
            message: collectionsCheck.message,
            details: collectionsCheck.details
          }
        },
        timestamp: new Date(),
        connectionState: this.connectionState
      };

    } catch (error) {
      return {
        isHealthy: false,
        status: 'unhealthy',
        checks: {
          connectivity: { status: 'fail', message: `Health check failed: ${error}` },
          responseTime: { status: 'fail', responseTime: Date.now() - startTime, message: 'Response time check failed due to error' },
          collections: { status: 'skip', message: 'Skipped due to error' }
        },
        timestamp: new Date(),
        connectionState: this.connectionState
      };
    }
  }

  /**
   * Tests access to core collections
   * Private helper for health checks
   */
  private async testCollectionAccess(): Promise<{
    success: boolean;
    message: string;
    details: Record<string, boolean>;
  }> {
    const collections = ['products', 'users', 'scan_results'];
    const results: Record<string, boolean> = {};
    let successCount = 0;

    for (const collectionName of collections) {
      try {
        const collection = this.getCollection(collectionName);
        // Test collection access with a simple count operation (limit 1 for performance)
        await collection.find({}).toArray();
        results[collectionName] = true;
        successCount++;
      } catch (error) {
        console.error(`Collection access test failed for ${collectionName}:`, error);
        results[collectionName] = false;
      }
    }

    return {
      success: successCount === collections.length,
      message: `${successCount}/${collections.length} collections accessible`,
      details: results
    };
  }

  /**
   * Gets detailed connection status information
   * Implements requirement 5.5 for connection monitoring
   */
  async getConnectionStatus(): Promise<ConnectionStatus> {
    const stats = this.getConnectionStats();
    const healthCheck = await this.performHealthCheck();

    return {
      isConnected: this.connectionState === ConnectionState.CONNECTED,
      state: this.connectionState,
      retryCount: stats.retries,
      lastConnectionAttempt: stats.lastAttempt,
      lastHealthCheck: healthCheck.timestamp,
      healthStatus: healthCheck,
      uptime: this.lastConnectionAttempt ? Date.now() - this.lastConnectionAttempt.getTime() : 0,
      configuration: {
        database: this.dbConfig.database,
        maxPoolSize: this.dbConfig.maxPoolSize,
        connectionTimeout: this.dbConfig.connectionTimeout,
        serverSelectionTimeout: this.dbConfig.serverSelectionTimeout
      }
    };
  }

  /**
   * Monitors connection status with periodic health checks
   * Implements requirement 5.5 for continuous monitoring
   */
  async startConnectionMonitoring(intervalMs: number = 30000): Promise<void> {
    if (this.healthCheckInterval) {
      console.log('Connection monitoring already active');
      return;
    }

    console.log(`Starting connection monitoring with ${intervalMs}ms interval`);

    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthStatus = await this.performHealthCheck();
        
        if (!healthStatus.isHealthy) {
          console.warn('Database health check failed:', healthStatus);
          
          // Attempt reconnection if connection is lost
          if (this.connectionState === ConnectionState.CONNECTED && 
              healthStatus.checks.connectivity.status === 'fail') {
            console.log('Connection lost, attempting to reconnect...');
            this.connectionState = ConnectionState.DISCONNECTED;
            await this.connect();
          }
        } else {
          console.debug('Database health check passed');
        }
      } catch (error) {
        console.error('Error during connection monitoring:', error);
      }
    }, intervalMs);
  }

  /**
   * Stops connection monitoring
   */
  async stopConnectionMonitoring(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('Connection monitoring stopped');
    }
  }

  /**
   * Handles connection failures with exponential backoff retry logic
   */
  private async handleConnectionFailure(error: any): Promise<void> {
    // Don't retry on configuration errors or missing dependencies
    if (error instanceof ConfigurationError || 
        (error instanceof DatabaseError && error.code === 'MISSING_DEPENDENCY')) {
      this.connectionState = ConnectionState.FAILED;
      throw error;
    }

    this.connectionRetries++;
    
    if (this.connectionRetries <= this.retryConfig.maxRetries) {
      const delay = Math.min(
        this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, this.connectionRetries - 1),
        this.retryConfig.maxDelay
      );

      console.log(
        `Retrying connection (${this.connectionRetries}/${this.retryConfig.maxRetries}) in ${delay}ms...`
      );

      this.connectionState = ConnectionState.RECONNECTING;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      await this.connect();
    } else {
      this.connectionState = ConnectionState.FAILED;
      throw new DatabaseError(
        `Max connection retries (${this.retryConfig.maxRetries}) exceeded`,
        error,
        'MAX_RETRIES_EXCEEDED'
      );
    }
  }

  /**
   * Starts periodic health check monitoring (private method for internal use)
   */
  private startHealthCheckMonitoring(): void {
    // Use the public method for consistency
    this.startConnectionMonitoring(30000);
  }

  /**
   * Stops health check monitoring (private method for internal use)
   */
  private stopHealthCheckMonitoring(): void {
    // Use the public method for consistency
    this.stopConnectionMonitoring();
  }

  /**
   * Gets a collection with type safety
   */
  private getCollection(name: string): CollectionInterface {
    if (!this.db) {
      throw new DatabaseError('Database not connected', null, 'NOT_CONNECTED');
    }
    return this.db.collection(name);
  }

  /**
   * Generic create operation for any collection with offline support
   */
  async create<T extends Record<string, any>>(
    collectionName: string, 
    document: T
  ): Promise<DatabaseResult<T & { _id: string }>> {
    try {
      // Check if we're offline
      if (this.offlineManager.isOffline() || this.connectionState !== ConnectionState.CONNECTED) {
        return this.handleOfflineCreate(collectionName, document);
      }

      const collection = this.getCollection(collectionName);
      const documentWithTimestamps = {
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(documentWithTimestamps);

      const createdDocument = {
        ...documentWithTimestamps,
        _id: result.insertedId.toString()
      } as T & { _id: string };

      // Cache the created document
      const cacheKey = OfflineUtils.createCacheKey(collectionName, { _id: createdDocument._id });
      this.cacheManager.set(cacheKey, createdDocument, 'network');

      console.log(`Document created in ${collectionName} with ID: ${result.insertedId}`);

      return {
        success: true,
        data: createdDocument
      };
    } catch (error) {
      const errorMessage = `Create operation failed for ${collectionName}`;
      console.error(errorMessage, error);
      
      // If network error, try offline fallback
      if (this.isNetworkError(error)) {
        return this.handleOfflineCreate(collectionName, document);
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Handle create operation when offline
   */
  private async handleOfflineCreate<T extends Record<string, any>>(
    collectionName: string,
    document: T
  ): Promise<DatabaseResult<T & { _id: string }>> {
    // Generate temporary ID for offline document
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineDocument = {
      ...document,
      _id: tempId,
      createdAt: new Date(),
      updatedAt: new Date(),
      _isOfflineCreated: true
    } as T & { _id: string };

    // Cache the document locally
    const cacheKey = OfflineUtils.createCacheKey(collectionName, { _id: tempId });
    this.cacheManager.set(cacheKey, offlineDocument, 'cache');

    // Queue for synchronization when online
    this.offlineManager.queueForSync({
      operation: 'create',
      collection: collectionName,
      data: document,
      maxRetries: 3
    });

    console.log(`Document queued for creation in ${collectionName} with temp ID: ${tempId}`);

    return {
      success: true,
      data: offlineDocument
    };
  }

  /**
   * Generic read operation for any collection with offline support
   */
  async read<T>(
    collectionName: string, 
    query: Record<string, any> = {}
  ): Promise<DatabaseResult<T[]>> {
    const cacheKey = OfflineUtils.createCacheKey(collectionName, query);
    const cachedData = this.cacheManager.get<T[]>(cacheKey);

    try {
      // Check if we should use cache
      if (OfflineUtils.shouldUseCache(this.offlineManager.isOffline(), cachedData)) {
        console.log(`Using cached data for ${collectionName} query`);
        return {
          success: true,
          data: cachedData!.data
        };
      }

      // If offline and no cache, return empty result with appropriate message
      if (this.offlineManager.isOffline() || this.connectionState !== ConnectionState.CONNECTED) {
        return this.handleOfflineRead<T>(collectionName, query, cachedData);
      }

      const collection = this.getCollection(collectionName);
      const documents = await collection.find(query).toArray();

      // Cache the results
      this.cacheManager.set(cacheKey, documents as T[], 'network');

      console.log(`Found ${documents.length} documents in ${collectionName}`);

      return {
        success: true,
        data: documents as T[]
      };
    } catch (error) {
      const errorMessage = `Read operation failed for ${collectionName}`;
      console.error(errorMessage, error);
      
      // If network error and we have cached data, use it
      if (this.isNetworkError(error) && cachedData) {
        console.log(`Using cached data due to network error for ${collectionName}`);
        return {
          success: true,
          data: cachedData.data
        };
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Handle read operation when offline
   */
  private async handleOfflineRead<T>(
    collectionName: string,
    query: Record<string, any>,
    cachedData: CacheEntry<T[]> | null
  ): Promise<DatabaseResult<T[]>> {
    if (cachedData) {
      console.log(`Using cached data for offline ${collectionName} query`);
      return {
        success: true,
        data: cachedData.data
      };
    }

    console.log(`No cached data available for offline ${collectionName} query`);
    return {
      success: false,
      error: OfflineUtils.createOfflineErrorMessage(`read from ${collectionName}`)
    };
  }

  /**
   * Generic read one operation for any collection with offline support
   */
  async readOne<T>(
    collectionName: string, 
    query: Record<string, any>
  ): Promise<DatabaseResult<T | null>> {
    const cacheKey = OfflineUtils.createCacheKey(collectionName, query);
    const cachedData = this.cacheManager.get<T>(cacheKey);

    try {
      // Check if we should use cache
      if (OfflineUtils.shouldUseCache(this.offlineManager.isOffline(), cachedData)) {
        console.log(`Using cached document for ${collectionName} query`);
        return {
          success: true,
          data: cachedData!.data
        };
      }

      // If offline and no cache, return null
      if (this.offlineManager.isOffline() || this.connectionState !== ConnectionState.CONNECTED) {
        return this.handleOfflineReadOne<T>(collectionName, query, cachedData);
      }

      const collection = this.getCollection(collectionName);
      const document = await collection.findOne(query);

      // Cache the result if found
      if (document) {
        this.cacheManager.set(cacheKey, document as T, 'network');
      }

      console.log(`Found document in ${collectionName}:`, document ? 'Yes' : 'No');

      return {
        success: true,
        data: document as T | null
      };
    } catch (error) {
      const errorMessage = `Read one operation failed for ${collectionName}`;
      console.error(errorMessage, error);
      
      // If network error and we have cached data, use it
      if (this.isNetworkError(error) && cachedData) {
        console.log(`Using cached document due to network error for ${collectionName}`);
        return {
          success: true,
          data: cachedData.data
        };
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Handle read one operation when offline
   */
  private async handleOfflineReadOne<T>(
    collectionName: string,
    query: Record<string, any>,
    cachedData: CacheEntry<T> | null
  ): Promise<DatabaseResult<T | null>> {
    if (cachedData) {
      console.log(`Using cached document for offline ${collectionName} query`);
      return {
        success: true,
        data: cachedData.data
      };
    }

    console.log(`No cached document available for offline ${collectionName} query`);
    return {
      success: true,
      data: null // Return null for not found, not an error
    };
  }

  /**
   * Generic update operation for any collection with offline support
   */
  async update(
    collectionName: string, 
    query: Record<string, any>, 
    update: Record<string, any>
  ): Promise<DatabaseResult<boolean>> {
    try {
      // Check if we're offline
      if (this.offlineManager.isOffline() || this.connectionState !== ConnectionState.CONNECTED) {
        return this.handleOfflineUpdate(collectionName, query, update);
      }

      const collection = this.getCollection(collectionName);
      const updateWithTimestamp = {
        $set: {
          ...update,
          updatedAt: new Date()
        }
      };

      const result = await collection.updateOne(query, updateWithTimestamp);
      const success = result.modifiedCount > 0;

      // Update cache if successful
      if (success) {
        this.updateCache(collectionName, query, update);
      }

      console.log(`Update operation in ${collectionName}: ${success ? 'Success' : 'No changes'}`);

      return {
        success: true,
        data: success
      };
    } catch (error) {
      const errorMessage = `Update operation failed for ${collectionName}`;
      console.error(errorMessage, error);
      
      // If network error, try offline fallback
      if (this.isNetworkError(error)) {
        return this.handleOfflineUpdate(collectionName, query, update);
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Handle update operation when offline
   */
  private async handleOfflineUpdate(
    collectionName: string,
    query: Record<string, any>,
    update: Record<string, any>
  ): Promise<DatabaseResult<boolean>> {
    // Update local cache if document exists
    this.updateCache(collectionName, query, update);

    // Queue for synchronization when online
    this.offlineManager.queueForSync({
      operation: 'update',
      collection: collectionName,
      data: { query, update },
      maxRetries: 3
    });

    console.log(`Update operation queued for ${collectionName}`);

    return {
      success: true,
      data: true // Assume success for offline operations
    };
  }

  /**
   * Generic delete operation for any collection with offline support
   */
  async delete(
    collectionName: string, 
    query: Record<string, any>
  ): Promise<DatabaseResult<boolean>> {
    try {
      // Check if we're offline
      if (this.offlineManager.isOffline() || this.connectionState !== ConnectionState.CONNECTED) {
        return this.handleOfflineDelete(collectionName, query);
      }

      const collection = this.getCollection(collectionName);
      const result = await collection.deleteOne(query);
      const success = result.deletedCount > 0;

      // Remove from cache if successful
      if (success) {
        this.removeFromCache(collectionName, query);
      }

      console.log(`Delete operation in ${collectionName}: ${success ? 'Success' : 'Not found'}`);

      return {
        success: true,
        data: success
      };
    } catch (error) {
      const errorMessage = `Delete operation failed for ${collectionName}`;
      console.error(errorMessage, error);
      
      // If network error, try offline fallback
      if (this.isNetworkError(error)) {
        return this.handleOfflineDelete(collectionName, query);
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Handle delete operation when offline
   */
  private async handleOfflineDelete(
    collectionName: string,
    query: Record<string, any>
  ): Promise<DatabaseResult<boolean>> {
    // Remove from local cache
    this.removeFromCache(collectionName, query);

    // Queue for synchronization when online
    this.offlineManager.queueForSync({
      operation: 'delete',
      collection: collectionName,
      data: { query },
      maxRetries: 3
    });

    console.log(`Delete operation queued for ${collectionName}`);

    return {
      success: true,
      data: true // Assume success for offline operations
    };
  }

  /**
   * Type-safe operations for Products collection
   */
  async createProduct(product: Omit<Product, '_id'>): Promise<DatabaseResult<Product>> {
    return this.create<Product>('products', product as Product);
  }

  async getProductByUPC(upc: string): Promise<DatabaseResult<Product | null>> {
    return this.readOne<Product>('products', { upc });
  }

  async getUserByProfileId(profileId: string): Promise<DatabaseResult<User | null>> {
    return this.readOne<User>('users', { profileId });
  }

  async getUserScanHistory(userId: string, limit: number = 50): Promise<DatabaseResult<ScanResult[]>> {
    try {
      // Check if we're offline
      if (this.offlineManager.isOffline() || this.connectionState !== ConnectionState.CONNECTED) {
        return this.handleOfflineRead<ScanResult>('scan_results', { userId }, null);
      }

      const collection = this.getCollection('scan_results');
      const query = { userId };
      
      // Use compound index (userId + scanTimestamp) for optimal performance
      const documents = await collection.find(query)
        .sort({ scanTimestamp: -1 }) // Most recent first
        .limit(limit)
        .toArray();

      console.log(`Found ${documents.length} scan results for user ${userId}`);

      return {
        success: true,
        data: documents as ScanResult[]
      };
    } catch (error) {
      const errorMessage = `Get user scan history failed for user ${userId}`;
      console.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getProductsByAllergen(allergen: string): Promise<DatabaseResult<Product[]>> {
    try {
      // Check if we're offline
      if (this.offlineManager.isOffline() || this.connectionState !== ConnectionState.CONNECTED) {
        return this.handleOfflineRead<Product>('products', { allergens: allergen }, null);
      }

      const collection = this.getCollection('products');
      const query = { allergens: allergen };
      
      // Use allergen index for optimal performance
      const documents = await collection.find(query).toArray();

      console.log(`Found ${documents.length} products with allergen ${allergen}`);

      return {
        success: true,
        data: documents as Product[]
      };
    } catch (error) {
      const errorMessage = `Get products by allergen failed for allergen ${allergen}`;
      console.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async searchProducts(searchTerm: string): Promise<DatabaseResult<Product[]>> {
    try {
      // Check if we're offline
      if (this.offlineManager.isOffline() || this.connectionState !== ConnectionState.CONNECTED) {
        return this.handleOfflineRead<Product>('products', { $text: { $search: searchTerm } }, null);
      }

      const collection = this.getCollection('products');
      const query = { $text: { $search: searchTerm } };
      
      // Use text index for optimal performance
      const documents = await collection.find(query)
        .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
        .toArray();

      console.log(`Found ${documents.length} products matching search term "${searchTerm}"`);

      return {
        success: true,
        data: documents as Product[]
      };
    } catch (error) {
      const errorMessage = `Search products failed for term "${searchTerm}"`;
      console.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getProducts(query: Record<string, any> = {}): Promise<DatabaseResult<Product[]>> {
    return this.read<Product>('products', query);
  }

  async updateProduct(upc: string, update: Partial<Product>): Promise<DatabaseResult<boolean>> {
    return this.update('products', { upc }, update);
  }

  async deleteProduct(upc: string): Promise<DatabaseResult<boolean>> {
    return this.delete('products', { upc });
  }

  /**
   * Type-safe operations for Users collection
   */
  async createUser(user: Omit<User, '_id'>): Promise<DatabaseResult<User>> {
    return this.create<User>('users', user as User);
  }

  async getUsers(query: Record<string, any> = {}): Promise<DatabaseResult<User[]>> {
    return this.read<User>('users', query);
  }

  async updateUser(profileId: string, update: Partial<User>): Promise<DatabaseResult<boolean>> {
    return this.update('users', { profileId }, update);
  }

  async deleteUser(profileId: string): Promise<DatabaseResult<boolean>> {
    return this.delete('users', { profileId });
  }

  /**
   * Type-safe operations for ScanResults collection
   */
  async createScanResult(scanResult: Omit<ScanResult, '_id'>): Promise<DatabaseResult<ScanResult>> {
    return this.create<ScanResult>('scan_results', scanResult as ScanResult);
  }

  async getScanResultsByUserId(userId: string): Promise<DatabaseResult<ScanResult[]>> {
    return this.read<ScanResult>('scan_results', { userId });
  }

  async getScanResults(query: Record<string, any> = {}): Promise<DatabaseResult<ScanResult[]>> {
    return this.read<ScanResult>('scan_results', query);
  }

  async updateScanResult(id: string, update: Partial<ScanResult>): Promise<DatabaseResult<boolean>> {
    return this.update('scan_results', { _id: id }, update);
  }

  async deleteScanResult(id: string): Promise<DatabaseResult<boolean>> {
    return this.delete('scan_results', { _id: id });
  }

  /**
   * Gets current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Gets connection statistics
   */
  getConnectionStats(): {
    state: ConnectionState;
    retries: number;
    lastAttempt: Date | null;
    isHealthy: boolean;
  } {
    return {
      state: this.connectionState,
      retries: this.connectionRetries,
      lastAttempt: this.lastConnectionAttempt,
      isHealthy: this.connectionState === ConnectionState.CONNECTED
    };
  }

  /**
   * Update cache with new data
   */
  private updateCache(collectionName: string, query: Record<string, any>, update: Record<string, any>): void {
    const cacheKey = OfflineUtils.createCacheKey(collectionName, query);
    const cachedData = this.cacheManager.get(cacheKey);
    
    if (cachedData && typeof cachedData.data === 'object' && cachedData.data !== null) {
      const updatedData = { ...cachedData.data, ...update, updatedAt: new Date() };
      this.cacheManager.set(cacheKey, updatedData, 'cache');
    }
  }

  /**
   * Remove data from cache
   */
  private removeFromCache(collectionName: string, query: Record<string, any>): void {
    const cacheKey = OfflineUtils.createCacheKey(collectionName, query);
    this.cacheManager.delete(cacheKey);
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const networkErrorCodes = [
      'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET',
      'NETWORK_ERROR', 'CONNECTION_FAILED', 'TIMEOUT'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toUpperCase() || '';
    
    return networkErrorCodes.some(code => 
      errorCode.includes(code) || errorMessage.includes(code.toLowerCase())
    );
  }

  /**
   * Initialize offline manager
   */
  async initializeOfflineSupport(): Promise<void> {
    try {
      await this.offlineManager.initialize();
      console.log('Offline support initialized successfully');
    } catch (error) {
      console.error('Failed to initialize offline support:', error);
    }
  }

  /**
   * Get offline status information
   */
  getOfflineStatus(): {
    isOffline: boolean;
    networkState: any;
    syncQueueStatus: any;
    cacheStats: any;
  } {
    return {
      isOffline: this.offlineManager.isOffline(),
      networkState: this.offlineManager.getNetworkState(),
      syncQueueStatus: this.offlineManager.getSyncQueueStatus(),
      cacheStats: this.cacheManager.getStats()
    };
  }

  /**
   * Force sync of queued operations (when connection is restored)
   */
  async forceSyncQueuedOperations(): Promise<void> {
    if (!this.offlineManager.isOffline() && this.connectionState === ConnectionState.CONNECTED) {
      // The offline manager will automatically process the sync queue
      // when it detects the connection is restored
      console.log('Triggering sync of queued operations');
    } else {
      console.log('Cannot sync: either offline or database not connected');
    }
  }

  /**
   * Clear offline cache (use with caution)
   */
  clearOfflineCache(): void {
    this.cacheManager.clear();
    console.log('Offline cache cleared');
  }

  /**
   * Creates performance-optimized indexes for all collections
   * Implements Requirements 2.2, 2.3, 2.4, 2.5 from core architecture specification
   */
  async createPerformanceIndexes(): Promise<DatabaseResult<boolean>> {
    try {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        throw new DatabaseError('Database not connected', null, 'NOT_CONNECTED');
      }

      console.log('Creating performance-optimized indexes...');

      // Create indexes for products collection
      await this.createProductsIndexes();
      
      // Create indexes for users collection
      await this.createUsersIndexes();
      
      // Create indexes for scan_results collection
      await this.createScanResultsIndexes();

      console.log('✅ All performance-optimized indexes created successfully');

      return {
        success: true,
        data: true
      };
    } catch (error) {
      const errorMessage = 'Failed to create performance indexes';
      console.error(errorMessage, error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Creates indexes for products collection
   * Implements Requirements 2.2, 2.4 for fast product lookups and allergen filtering
   */
  private async createProductsIndexes(): Promise<void> {
    const collection = this.getCollection('products');
    
    console.log('Creating products collection indexes...');

    // Unique index on UPC for fast product lookups (Requirement 2.2)
    await collection.createIndex(
      { "upc": 1 }, 
      { unique: true, name: "upc_unique_lookup" }
    );
    console.log('  ✅ Created unique index on products.upc');

    // Index on allergens for fast allergen filtering (Requirement 2.4)
    await collection.createIndex(
      { "allergens": 1 }, 
      { name: "allergens_filter" }
    );
    console.log('  ✅ Created index on products.allergens');

    // Text index for product search functionality (Requirement 2.4)
    await collection.createIndex(
      { "name": "text", "brand": "text" }, 
      { name: "product_text_search" }
    );
    console.log('  ✅ Created text index on products.name and products.brand');

    // Index on dietary flags for filtering (Requirement 2.4)
    await collection.createIndex(
      { "dietaryFlags.halal": 1 }, 
      { name: "dietary_halal_filter", sparse: true }
    );
    await collection.createIndex(
      { "dietaryFlags.kosher": 1 }, 
      { name: "dietary_kosher_filter", sparse: true }
    );
    await collection.createIndex(
      { "dietaryFlags.vegan": 1 }, 
      { name: "dietary_vegan_filter", sparse: true }
    );
    await collection.createIndex(
      { "dietaryFlags.vegetarian": 1 }, 
      { name: "dietary_vegetarian_filter", sparse: true }
    );
    await collection.createIndex(
      { "dietaryFlags.glutenFree": 1 }, 
      { name: "dietary_gluten_free_filter", sparse: true }
    );
    console.log('  ✅ Created indexes on products.dietaryFlags');

    // Index on data freshness for cache management (Requirement 2.5)
    await collection.createIndex(
      { "lastUpdated": -1 }, 
      { name: "last_updated_desc" }
    );
    console.log('  ✅ Created index on products.lastUpdated');

    // Index on source for data quality queries
    await collection.createIndex(
      { "source": 1 }, 
      { name: "data_source_filter" }
    );
    console.log('  ✅ Created index on products.source');
  }

  /**
   * Creates indexes for users collection
   * Implements Requirements 2.3 for efficient user profile queries
   */
  private async createUsersIndexes(): Promise<void> {
    const collection = this.getCollection('users');
    
    console.log('Creating users collection indexes...');

    // Unique index on profileId for primary user lookup (Requirement 2.3)
    await collection.createIndex(
      { "profileId": 1 }, 
      { unique: true, name: "profile_id_unique" }
    );
    console.log('  ✅ Created unique index on users.profileId');

    // Index on dietary restrictions for allergen-based queries (Requirement 2.3)
    await collection.createIndex(
      { "dietaryRestrictions.allergies": 1 }, 
      { name: "user_allergies_filter" }
    );
    console.log('  ✅ Created index on users.dietaryRestrictions.allergies');

    // Index on religious restrictions for filtering
    await collection.createIndex(
      { "dietaryRestrictions.religious": 1 }, 
      { name: "user_religious_filter" }
    );
    console.log('  ✅ Created index on users.dietaryRestrictions.religious');

    // Index on medical restrictions for filtering
    await collection.createIndex(
      { "dietaryRestrictions.medical": 1 }, 
      { name: "user_medical_filter" }
    );
    console.log('  ✅ Created index on users.dietaryRestrictions.medical');

    // Index on lifestyle restrictions for filtering
    await collection.createIndex(
      { "dietaryRestrictions.lifestyle": 1 }, 
      { name: "user_lifestyle_filter" }
    );
    console.log('  ✅ Created index on users.dietaryRestrictions.lifestyle');

    // Index on user activity tracking (Requirement 2.3)
    await collection.createIndex(
      { "lastActive": -1 }, 
      { name: "last_active_desc" }
    );
    console.log('  ✅ Created index on users.lastActive');

    // Index on alert level for notification queries
    await collection.createIndex(
      { "preferences.alertLevel": 1 }, 
      { name: "alert_level_filter" }
    );
    console.log('  ✅ Created index on users.preferences.alertLevel');
  }

  /**
   * Creates indexes for scan_results collection
   * Implements Requirements 2.3, 2.5 for user scan history and analytics
   */
  private async createScanResultsIndexes(): Promise<void> {
    const collection = this.getCollection('scan_results');
    
    console.log('Creating scan_results collection indexes...');

    // Compound index on userId + scanTimestamp for user scan history (Requirement 2.3, 2.5)
    await collection.createIndex(
      { "userId": 1, "scanTimestamp": -1 }, 
      { name: "user_scan_history" }
    );
    console.log('  ✅ Created compound index on scan_results.userId + scanTimestamp');

    // Index on UPC for product-based analytics (Requirement 2.5)
    await collection.createIndex(
      { "upc": 1 }, 
      { name: "scan_upc_analytics" }
    );
    console.log('  ✅ Created index on scan_results.upc');

    // Index on compliance status for safety analytics (Requirement 2.5)
    await collection.createIndex(
      { "complianceStatus": 1 }, 
      { name: "compliance_status_analytics" }
    );
    console.log('  ✅ Created index on scan_results.complianceStatus');

    // Index on scan timestamp for recent scans across users (Requirement 2.5)
    await collection.createIndex(
      { "scanTimestamp": -1 }, 
      { name: "recent_scans_global" }
    );
    console.log('  ✅ Created index on scan_results.scanTimestamp');

    // Index on violations for violation analysis
    await collection.createIndex(
      { "violations": 1 }, 
      { name: "violations_analysis" }
    );
    console.log('  ✅ Created index on scan_results.violations');

    // Index on productId for product-scan relationship queries
    await collection.createIndex(
      { "productId": 1 }, 
      { name: "product_scan_relationship" }
    );
    console.log('  ✅ Created index on scan_results.productId');

    // Compound index for location-based queries (if location data is available)
    await collection.createIndex(
      { "location.latitude": 1, "location.longitude": 1 }, 
      { name: "location_geo_queries", sparse: true }
    );
    console.log('  ✅ Created compound index on scan_results.location');
  }

  /**
   * Validates index performance by running test queries
   * Implements Requirement 2.5 for sub-100ms query response times
   */
  async validateIndexPerformance(): Promise<DatabaseResult<{
    products: { avgResponseTime: number; passed: boolean };
    users: { avgResponseTime: number; passed: boolean };
    scanResults: { avgResponseTime: number; passed: boolean };
  }>> {
    try {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        throw new DatabaseError('Database not connected', null, 'NOT_CONNECTED');
      }

      console.log('Validating index performance...');

      const results = {
        products: await this.testProductsIndexPerformance(),
        users: await this.testUsersIndexPerformance(),
        scanResults: await this.testScanResultsIndexPerformance()
      };

      const allPassed = results.products.passed && results.users.passed && results.scanResults.passed;

      console.log('Index performance validation results:');
      console.log(`  Products: ${results.products.avgResponseTime}ms (${results.products.passed ? 'PASS' : 'FAIL'})`);
      console.log(`  Users: ${results.users.avgResponseTime}ms (${results.users.passed ? 'PASS' : 'FAIL'})`);
      console.log(`  Scan Results: ${results.scanResults.avgResponseTime}ms (${results.scanResults.passed ? 'PASS' : 'FAIL'})`);
      console.log(`  Overall: ${allPassed ? 'PASS' : 'FAIL'}`);

      return {
        success: true,
        data: results
      };
    } catch (error) {
      const errorMessage = 'Failed to validate index performance';
      console.error(errorMessage, error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Tests products collection index performance
   */
  private async testProductsIndexPerformance(): Promise<{ avgResponseTime: number; passed: boolean }> {
    const collection = this.getCollection('products');
    const testQueries = [
      () => collection.findOne({ upc: "123456789012" }),
      () => collection.find({ allergens: "milk" }).toArray(),
      () => collection.find({ $text: { $search: "organic" } }).toArray(),
      () => collection.find({ "dietaryFlags.vegan": true }).toArray()
    ];

    let totalTime = 0;
    const iterations = testQueries.length;

    for (const query of testQueries) {
      const startTime = Date.now();
      await query();
      const endTime = Date.now();
      totalTime += (endTime - startTime);
    }

    const avgResponseTime = totalTime / iterations;
    const passed = avgResponseTime < 100; // Sub-100ms requirement

    return { avgResponseTime, passed };
  }

  /**
   * Tests users collection index performance
   */
  private async testUsersIndexPerformance(): Promise<{ avgResponseTime: number; passed: boolean }> {
    const collection = this.getCollection('users');
    const testQueries = [
      () => collection.findOne({ profileId: "demo_user_001" }),
      () => collection.find({ "dietaryRestrictions.allergies": "peanuts" }).toArray(),
      () => collection.find({ "dietaryRestrictions.religious": "halal" }).toArray(),
      () => collection.find({ "preferences.alertLevel": "strict" }).toArray()
    ];

    let totalTime = 0;
    const iterations = testQueries.length;

    for (const query of testQueries) {
      const startTime = Date.now();
      await query();
      const endTime = Date.now();
      totalTime += (endTime - startTime);
    }

    const avgResponseTime = totalTime / iterations;
    const passed = avgResponseTime < 100; // Sub-100ms requirement

    return { avgResponseTime, passed };
  }

  /**
   * Tests scan_results collection index performance
   */
  private async testScanResultsIndexPerformance(): Promise<{ avgResponseTime: number; passed: boolean }> {
    const collection = this.getCollection('scan_results');
    const testQueries = [
      () => collection.find({ userId: "demo_user_001" }).toArray(),
      () => collection.find({ upc: "123456789012" }).toArray(),
      () => collection.find({ complianceStatus: "safe" }).toArray(),
      () => collection.find({ scanTimestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).toArray()
    ];

    let totalTime = 0;
    const iterations = testQueries.length;

    for (const query of testQueries) {
      const startTime = Date.now();
      await query();
      const endTime = Date.now();
      totalTime += (endTime - startTime);
    }

    const avgResponseTime = totalTime / iterations;
    const passed = avgResponseTime < 100; // Sub-100ms requirement

    return { avgResponseTime, passed };
  }

  /**
   * Lists all indexes for a collection
   */
  async listCollectionIndexes(collectionName: string): Promise<DatabaseResult<any[]>> {
    try {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        throw new DatabaseError('Database not connected', null, 'NOT_CONNECTED');
      }

      const collection = this.getCollection(collectionName);
      const indexes = await collection.indexes();

      console.log(`Indexes for ${collectionName}:`, indexes.map(i => i.name));

      return {
        success: true,
        data: indexes
      };
    } catch (error) {
      const errorMessage = `Failed to list indexes for ${collectionName}`;
      console.error(errorMessage, error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Drops and recreates all indexes (use with caution)
   */
  async recreateAllIndexes(): Promise<DatabaseResult<boolean>> {
    try {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        throw new DatabaseError('Database not connected', null, 'NOT_CONNECTED');
      }

      console.log('Recreating all indexes...');

      // Drop existing indexes (except _id)
      const collections = ['products', 'users', 'scan_results'];
      
      for (const collectionName of collections) {
        const collection = this.getCollection(collectionName);
        const indexes = await collection.indexes();
        
        for (const index of indexes) {
          if (index.name !== '_id_') {
            try {
              await collection.dropIndex(index.name);
              console.log(`  Dropped index ${index.name} from ${collectionName}`);
            } catch (error) {
              console.warn(`  Failed to drop index ${index.name} from ${collectionName}:`, error);
            }
          }
        }
      }

      // Recreate all indexes
      await this.createPerformanceIndexes();

      console.log('✅ All indexes recreated successfully');

      return {
        success: true,
        data: true
      };
    } catch (error) {
      const errorMessage = 'Failed to recreate indexes';
      console.error(errorMessage, error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Disconnects from MongoDB Atlas
   */
  async disconnect(): Promise<void> {
    try {
      this.stopHealthCheckMonitoring();
      
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
      }
      
      this.connectionState = ConnectionState.DISCONNECTED;
      this.connectionRetries = 0;
      
      console.log('Successfully disconnected from MongoDB Atlas');
    } catch (error) {
      console.error('Error during disconnect:', error);
      throw new DatabaseError('Failed to disconnect from database', error);
    }
  }
}

// Export singleton instance for application use
export const databaseService = new DatabaseService();

// Initialize offline support
databaseService.initializeOfflineSupport().catch(error => {
  console.error('Failed to initialize offline support for database service:', error);
});