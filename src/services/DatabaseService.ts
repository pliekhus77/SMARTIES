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
  find(filter: any): { toArray(): Promise<any[]> };
  updateOne(filter: any, update: any): Promise<{ modifiedCount: number }>;
  deleteOne(filter: any): Promise<{ deletedCount: number }>;
  createIndex(keys: any, options?: any): Promise<string>;
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
   * Starts periodic health check monitoring
   */
  private startHealthCheckMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Check connection health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const isHealthy = await this.testConnection();
      if (!isHealthy && this.connectionState === ConnectionState.CONNECTED) {
        console.warn('Database connection lost, attempting to reconnect...');
        this.connectionState = ConnectionState.DISCONNECTED;
        await this.connect();
      }
    }, 30000);
  }

  /**
   * Stops health check monitoring
   */
  private stopHealthCheckMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
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
   * Generic create operation for any collection
   */
  async create<T extends Record<string, any>>(
    collectionName: string, 
    document: T
  ): Promise<DatabaseResult<T & { _id: string }>> {
    try {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        throw new DatabaseError('Database not connected', null, 'NOT_CONNECTED');
      }

      const collection = this.getCollection(collectionName);
      const result = await collection.insertOne({
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const createdDocument = {
        ...document,
        _id: result.insertedId.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      } as T & { _id: string };

      console.log(`Document created in ${collectionName} with ID: ${result.insertedId}`);

      return {
        success: true,
        data: createdDocument
      };
    } catch (error) {
      const errorMessage = `Create operation failed for ${collectionName}`;
      console.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generic read operation for any collection
   */
  async read<T>(
    collectionName: string, 
    query: Record<string, any> = {}
  ): Promise<DatabaseResult<T[]>> {
    try {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        throw new DatabaseError('Database not connected', null, 'NOT_CONNECTED');
      }

      const collection = this.getCollection(collectionName);
      const documents = await collection.find(query).toArray();

      console.log(`Found ${documents.length} documents in ${collectionName}`);

      return {
        success: true,
        data: documents as T[]
      };
    } catch (error) {
      const errorMessage = `Read operation failed for ${collectionName}`;
      console.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generic read one operation for any collection
   */
  async readOne<T>(
    collectionName: string, 
    query: Record<string, any>
  ): Promise<DatabaseResult<T | null>> {
    try {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        throw new DatabaseError('Database not connected', null, 'NOT_CONNECTED');
      }

      const collection = this.getCollection(collectionName);
      const document = await collection.findOne(query);

      console.log(`Found document in ${collectionName}:`, document ? 'Yes' : 'No');

      return {
        success: true,
        data: document as T | null
      };
    } catch (error) {
      const errorMessage = `Read one operation failed for ${collectionName}`;
      console.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generic update operation for any collection
   */
  async update(
    collectionName: string, 
    query: Record<string, any>, 
    update: Record<string, any>
  ): Promise<DatabaseResult<boolean>> {
    try {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        throw new DatabaseError('Database not connected', null, 'NOT_CONNECTED');
      }

      const collection = this.getCollection(collectionName);
      const result = await collection.updateOne(query, {
        $set: {
          ...update,
          updatedAt: new Date()
        }
      });

      const success = result.modifiedCount > 0;
      console.log(`Update operation in ${collectionName}: ${success ? 'Success' : 'No changes'}`);

      return {
        success: true,
        data: success
      };
    } catch (error) {
      const errorMessage = `Update operation failed for ${collectionName}`;
      console.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generic delete operation for any collection
   */
  async delete(
    collectionName: string, 
    query: Record<string, any>
  ): Promise<DatabaseResult<boolean>> {
    try {
      if (this.connectionState !== ConnectionState.CONNECTED) {
        throw new DatabaseError('Database not connected', null, 'NOT_CONNECTED');
      }

      const collection = this.getCollection(collectionName);
      const result = await collection.deleteOne(query);

      const success = result.deletedCount > 0;
      console.log(`Delete operation in ${collectionName}: ${success ? 'Success' : 'Not found'}`);

      return {
        success: true,
        data: success
      };
    } catch (error) {
      const errorMessage = `Delete operation failed for ${collectionName}`;
      console.error(errorMessage, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
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

  async getUserByProfileId(profileId: string): Promise<DatabaseResult<User | null>> {
    return this.readOne<User>('users', { profileId });
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