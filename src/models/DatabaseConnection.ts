/**
 * MongoDB Atlas Database Connection Management
 * Implements Requirements 1.5 and 5.5 for reliable database connectivity
 * 
 * Features:
 * - Connection management with retry logic
 * - Health monitoring and error handling
 * - Index creation and management
 * - Storage optimization for M0 tier
 */

// MongoDB types - will be available when mongodb package is installed
interface MongoClientInterface {
  connect(): Promise<MongoClientInterface>;
  close(): Promise<void>;
  db(name?: string): DbInterface;
}

interface DbInterface {
  collection(name: string): CollectionInterface;
  admin(): { ping(): Promise<any> };
  stats(): Promise<any>;
}

interface CollectionInterface {
  createIndex(keys: any, options?: any): Promise<string>;
  indexes(): Promise<any[]>;
  countDocuments(filter?: any): Promise<number>;
}

interface CreateIndexesOptions {
  name?: string;
  unique?: boolean;
  background?: boolean;
  sparse?: boolean;
}
import { config } from '../config/config';
import { ProductIndexes, VectorSearchIndexes, PRODUCTS_COLLECTION } from './Product';

/**
 * Database connection status
 */
export interface ConnectionStatus {
  isConnected: boolean;
  database: string;
  cluster: string;
  lastPing: Date | null;
  connectionTime: number;
  error: string | null;
}

/**
 * Index creation result
 */
export interface IndexCreationResult {
  indexName: string;
  success: boolean;
  error?: string;
  creationTime?: number;
}

/**
 * Storage usage statistics for MongoDB Atlas M0
 */
export interface StorageStats {
  totalSizeBytes: number;
  documentCount: number;
  averageDocumentSize: number;
  indexSizeBytes: number;
  availableSpaceBytes: number;
  utilizationPercentage: number;
  estimatedMaxDocuments: number;
}

/**
 * MongoDB Atlas Database Connection Manager
 * Optimized for M0 free tier with 512MB storage limit
 */
export class DatabaseConnection {
  private client: MongoClientInterface | null = null;
  private db: DbInterface | null = null;
  private connectionStatus: ConnectionStatus;
  private readonly connectionString: string;
  private readonly databaseName: string;
  
  // M0 tier limitations
  private readonly MAX_STORAGE_BYTES = 512 * 1024 * 1024; // 512MB
  private readonly MAX_CONNECTIONS = 500;
  private readonly CONNECTION_TIMEOUT = 10000; // 10 seconds
  
  constructor() {
    this.connectionString = config.mongodb.uri;
    this.databaseName = config.mongodb.database;
    
    this.connectionStatus = {
      isConnected: false,
      database: this.databaseName,
      cluster: this.extractClusterName(this.connectionString),
      lastPing: null,
      connectionTime: 0,
      error: null
    };
  }
  
  /**
   * Establishes connection to MongoDB Atlas with optimized settings for M0
   */
  async connect(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log(`Connecting to MongoDB Atlas cluster: ${this.connectionStatus.cluster}`);
      console.log(`Database: ${this.databaseName}`);
      
      // MongoDB client options optimized for M0 tier
      const clientOptions = {
        maxPoolSize: 10,                    // Reduced pool size for M0
        serverSelectionTimeoutMS: this.CONNECTION_TIMEOUT,
        connectTimeoutMS: this.CONNECTION_TIMEOUT,
        socketTimeoutMS: 30000,             // 30 seconds
        retryWrites: true,
        retryReads: true,
        compressors: ['zlib' as const],     // Enable compression to save bandwidth
        maxIdleTimeMS: 30000,               // Close idle connections quickly
        heartbeatFrequencyMS: 10000,        // Monitor connection health
      };
      
      // Import MongoDB client dynamically to handle missing dependency gracefully
      try {
        const { MongoClient } = await import('mongodb');
        const mongoClient = new MongoClient(this.connectionString, clientOptions);
        this.client = await mongoClient.connect();
      } catch (error) {
        throw new Error('MongoDB driver not installed. Run: npm install mongodb');
      }
      
      this.db = this.client.db(this.databaseName);
      
      // Verify connection with ping
      await this.ping();
      
      this.connectionStatus = {
        isConnected: true,
        database: this.databaseName,
        cluster: this.connectionStatus.cluster,
        lastPing: new Date(),
        connectionTime: Date.now() - startTime,
        error: null
      };
      
      console.log(`Successfully connected to MongoDB Atlas in ${this.connectionStatus.connectionTime}ms`);
      
    } catch (error) {
      this.connectionStatus.error = error instanceof Error ? error.message : String(error);
      console.error('Failed to connect to MongoDB Atlas:', error);
      throw new Error(`Database connection failed: ${this.connectionStatus.error}`);
    }
  }
  
  /**
   * Closes the database connection
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
      }
      
      this.connectionStatus.isConnected = false;
      this.connectionStatus.lastPing = null;
      this.connectionStatus.error = null;
      
      console.log('Disconnected from MongoDB Atlas');
      
    } catch (error) {
      console.error('Error during disconnect:', error);
      throw error;
    }
  }
  
  /**
   * Tests database connectivity with ping
   */
  async ping(): Promise<boolean> {
    try {
      if (!this.db) {
        throw new Error('Database not connected');
      }
      
      await this.db.admin().ping();
      this.connectionStatus.lastPing = new Date();
      return true;
      
    } catch (error) {
      console.error('Database ping failed:', error);
      this.connectionStatus.error = error instanceof Error ? error.message : String(error);
      return false;
    }
  }
  
  /**
   * Gets the products collection with type safety
   */
  getProductsCollection(): CollectionInterface {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection(PRODUCTS_COLLECTION);
  }
  
  /**
   * Gets any collection by name
   */
  getCollection(name: string): CollectionInterface {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection(name);
  }
  
  /**
   * Creates all required indexes for optimal performance
   * Implements Requirements 1.3 and 5.2 for sub-100ms UPC lookup
   */
  async createIndexes(): Promise<IndexCreationResult[]> {
    console.log('Creating database indexes for optimal performance...');
    
    const results: IndexCreationResult[] = [];
    
    try {
      const collection = this.getProductsCollection();
      
      // Create standard indexes
      for (const indexSpec of ProductIndexes) {
        const startTime = Date.now();
        
        try {
          const indexName = await collection.createIndex(
            indexSpec.key,
            {
              name: indexSpec.name,
              unique: indexSpec.name === 'code_1', // Only UPC index is unique
              background: true, // Create in background to avoid blocking
              sparse: indexSpec.name.includes('dietary') // Sparse for optional fields
            } as CreateIndexesOptions
          );
          
          results.push({
            indexName,
            success: true,
            creationTime: Date.now() - startTime
          });
          
          console.log(`✓ Created index: ${indexName} (${Date.now() - startTime}ms)`);
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          results.push({
            indexName: indexSpec.name,
            success: false,
            error: errorMessage
          });
          
          console.error(`✗ Failed to create index ${indexSpec.name}:`, errorMessage);
        }
      }
      
      // Log vector search index requirements
      console.log('\nVector Search Indexes (must be created via MongoDB Atlas UI):');
      VectorSearchIndexes.forEach(index => {
        console.log(`- ${index.name}: ${index.definition.fields.length} fields`);
      });
      
      const successCount = results.filter(r => r.success).length;
      console.log(`\nIndex creation completed: ${successCount}/${results.length} successful`);
      
      return results;
      
    } catch (error) {
      console.error('Index creation failed:', error);
      throw error;
    }
  }
  
  /**
   * Lists all existing indexes
   */
  async listIndexes(): Promise<any[]> {
    try {
      const collection = this.getProductsCollection();
      const indexes = await collection.indexes();
      
      console.log('Existing indexes:');
      indexes.forEach(index => {
        console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
      });
      
      return indexes;
      
    } catch (error) {
      console.error('Failed to list indexes:', error);
      throw error;
    }
  }
  
  /**
   * Gets storage usage statistics for M0 tier monitoring
   */
  async getStorageStats(): Promise<StorageStats> {
    try {
      if (!this.db) {
        throw new Error('Database not connected');
      }
      
      const stats = await this.db.stats();
      const collection = this.getProductsCollection();
      const documentCount = await collection.countDocuments();
      
      const totalSizeBytes = stats.dataSize || 0;
      const indexSizeBytes = stats.indexSize || 0;
      const averageDocumentSize = documentCount > 0 ? totalSizeBytes / documentCount : 0;
      const availableSpaceBytes = Math.max(0, this.MAX_STORAGE_BYTES - totalSizeBytes - indexSizeBytes);
      const utilizationPercentage = ((totalSizeBytes + indexSizeBytes) / this.MAX_STORAGE_BYTES) * 100;
      const estimatedMaxDocuments = availableSpaceBytes > 0 ? 
        Math.floor(availableSpaceBytes / Math.max(averageDocumentSize, 1000)) : 0;
      
      const storageStats: StorageStats = {
        totalSizeBytes,
        documentCount,
        averageDocumentSize,
        indexSizeBytes,
        availableSpaceBytes,
        utilizationPercentage,
        estimatedMaxDocuments
      };
      
      console.log('Storage Statistics (MongoDB Atlas M0):');
      console.log(`- Total Size: ${(totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
      console.log(`- Index Size: ${(indexSizeBytes / 1024 / 1024).toFixed(2)} MB`);
      console.log(`- Documents: ${documentCount.toLocaleString()}`);
      console.log(`- Average Doc Size: ${averageDocumentSize.toFixed(0)} bytes`);
      console.log(`- Available Space: ${(availableSpaceBytes / 1024 / 1024).toFixed(2)} MB`);
      console.log(`- Utilization: ${utilizationPercentage.toFixed(1)}%`);
      console.log(`- Estimated Max Docs: ${estimatedMaxDocuments.toLocaleString()}`);
      
      return storageStats;
      
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw error;
    }
  }
  
  /**
   * Validates connection and database setup
   */
  async validateSetup(): Promise<{
    connection: boolean;
    indexes: boolean;
    vectorSearchReady: boolean;
    storageOptimal: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // Test connection
    const connectionOk = await this.ping();
    if (!connectionOk) {
      issues.push('Database connection failed');
    }
    
    // Check indexes
    let indexesOk = false;
    try {
      const indexes = await this.listIndexes();
      const requiredIndexes = ProductIndexes.map(idx => idx.name);
      const existingIndexNames = indexes.map(idx => idx.name);
      const missingIndexes = requiredIndexes.filter(name => !existingIndexNames.includes(name));
      
      if (missingIndexes.length > 0) {
        issues.push(`Missing indexes: ${missingIndexes.join(', ')}`);
      } else {
        indexesOk = true;
      }
    } catch (error) {
      issues.push('Failed to check indexes');
    }
    
    // Check storage utilization
    let storageOptimal = false;
    try {
      const stats = await this.getStorageStats();
      if (stats.utilizationPercentage > 90) {
        issues.push(`Storage utilization high: ${stats.utilizationPercentage.toFixed(1)}%`);
      } else {
        storageOptimal = true;
      }
    } catch (error) {
      issues.push('Failed to check storage stats');
    }
    
    // Vector search readiness (placeholder - would check via Atlas API)
    const vectorSearchReady = false; // Would be determined by actual Atlas API check
    if (!vectorSearchReady) {
      issues.push('Vector search indexes not configured (create via MongoDB Atlas UI)');
    }
    
    return {
      connection: connectionOk,
      indexes: indexesOk,
      vectorSearchReady,
      storageOptimal,
      issues
    };
  }
  
  /**
   * Gets current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }
  
  /**
   * Extracts cluster name from connection string for logging
   */
  private extractClusterName(connectionString: string): string {
    try {
      const match = connectionString.match(/mongodb\+srv:\/\/[^@]+@([^.]+)/);
      return match ? match[1] : 'unknown';
    } catch {
      return 'unknown';
    }
  }
  
  /**
   * Gets optimization recommendations for M0 tier
   */
  getOptimizationRecommendations(): string[] {
    return [
      'Monitor storage usage regularly - M0 has 512MB limit',
      'Use selective data import - prioritize popular products',
      'Implement data archiving for unused products',
      'Optimize document size by limiting text field lengths',
      'Use compound indexes to reduce total index count',
      'Enable compression for network efficiency',
      'Monitor connection pool usage - M0 has 500 connection limit',
      'Create vector search indexes via MongoDB Atlas UI for AI features'
    ];
  }
}

/**
 * Database connection singleton for application use
 */
export class DatabaseManager {
  private static instance: DatabaseConnection | null = null;
  
  /**
   * Gets the singleton database connection instance
   */
  static getInstance(): DatabaseConnection {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseConnection();
    }
    return DatabaseManager.instance;
  }
  
  /**
   * Initializes the database connection and creates indexes
   */
  static async initialize(): Promise<void> {
    const db = DatabaseManager.getInstance();
    
    try {
      await db.connect();
      await db.createIndexes();
      
      const validation = await db.validateSetup();
      if (validation.issues.length > 0) {
        console.warn('Database setup issues detected:');
        validation.issues.forEach(issue => console.warn(`- ${issue}`));
      } else {
        console.log('✓ Database setup validation passed');
      }
      
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Closes the database connection
   */
  static async shutdown(): Promise<void> {
    if (DatabaseManager.instance) {
      await DatabaseManager.instance.disconnect();
      DatabaseManager.instance = null;
    }
  }
}