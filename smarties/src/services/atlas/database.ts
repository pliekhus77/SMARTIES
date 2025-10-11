/**
 * MongoDB Atlas database connection service
 * Handles database connections, retry logic, and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../../models/Product';
import { UserProfile } from '../../models/UserProfile';
import { ScanHistory } from '../../models/ScanHistory';

export interface DatabaseConfig {
  connectionString: string;
  databaseName: string;
  dataApiKey: string;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

export interface DatabaseError extends Error {
  code?: string;
  isNetworkError?: boolean;
  isAuthError?: boolean;
}

export interface SyncOperation {
  type: 'saveUserProfile' | 'saveScanHistory' | 'saveProduct';
  data: any;
  timestamp: string;
  retryCount?: number;
}

export class DatabaseService {
  private config: DatabaseConfig;
  private isConnected: boolean = false;
  private dataApiUrl: string = '';

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.dataApiUrl = this.buildDataApiUrl();
  }

  /**
   * Establish connection to MongoDB Atlas using Data API
   */
  async connect(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Database connection attempt ${attempt}/${this.config.retryAttempts}`);
        
        const isConnected = await this.testConnection();
        
        if (isConnected) {
          this.isConnected = true;
          console.log('✅ Database connected successfully');
          await this.cacheConnectionStatus(true);
          
          // Sync any offline data
          await this.syncOfflineData();
          
          return;
        }
        
        throw new Error('Connection test failed');
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Connection attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.retryAttempts) {
          // Wait before retry with exponential backoff
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.delay(delay);
        }
      }
    }

    this.isConnected = false;
    await this.cacheConnectionStatus(false);
    
    const dbError: DatabaseError = new Error(
      `Database connection failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`
    );
    dbError.isNetworkError = true;
    throw dbError;
  }

  /**
   * Disconnect from MongoDB Atlas
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    await this.cacheConnectionStatus(false);
    console.log('📤 Database disconnected');
  }

  /**
   * Check if database is connected
   */
  isConnectionActive(): boolean {
    return this.isConnected;
  }

  /**
   * Test database connection using a simple query
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeDataApiRequest('findOne', 'products', {
        filter: {},
        limit: 1
      });

      return response.ok;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Find product by UPC code
   */
  async findProductByUPC(upc: string): Promise<Product | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const response = await this.makeDataApiRequest('findOne', 'products', {
        filter: { upc: upc }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.document) {
        console.log(`✅ Product found for UPC: ${upc}`);
        await this.cacheProduct(upc, result.document);
        return result.document;
      } else {
        console.log(`ℹ️ No product found for UPC: ${upc}`);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error finding product:', error);
      
      // Try to get cached data if available
      const cachedProduct = await this.getCachedProduct(upc);
      if (cachedProduct) {
        console.log('📱 Using cached product data');
        return cachedProduct;
      }
      
      throw this.createDatabaseError(error as Error);
    }
  }

  /**
   * Save or update user profile
   */
  async saveUserProfile(userProfile: UserProfile): Promise<UserProfile> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const profileData: UserProfile = {
        ...userProfile,
        last_active: new Date()
      };

      const response = await this.makeDataApiRequest('replaceOne', 'users', {
        filter: { user_id: userProfile.user_id },
        replacement: profileData,
        upsert: true
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.acknowledged) {
        console.log('✅ User profile saved successfully');
        await this.cacheUserProfile(profileData);
        return profileData;
      } else {
        throw new Error('Failed to save user profile');
      }
      
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
      
      // Cache locally for offline sync
      await this.cacheUserProfile(userProfile);
      await this.addToSyncQueue('saveUserProfile', userProfile);
      
      throw this.createDatabaseError(error as Error);
    }
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const response = await this.makeDataApiRequest('findOne', 'users', {
        filter: { user_id: userId }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.document) {
        console.log(`✅ User profile found for: ${userId}`);
        await this.cacheUserProfile(result.document);
        return result.document;
      } else {
        console.log(`ℹ️ No user profile found for: ${userId}`);
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      
      // Try to get cached profile
      const cachedProfile = await this.getCachedUserProfile(userId);
      if (cachedProfile) {
        console.log('📱 Using cached user profile');
        return cachedProfile;
      }
      
      throw this.createDatabaseError(error as Error);
    }
  }

  /**
   * Save scan history record
   */
  async saveScanHistory(scanData: ScanHistory): Promise<ScanHistory> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const scanRecord: ScanHistory = {
        ...scanData,
        scan_timestamp: new Date()
      };

      const response = await this.makeDataApiRequest('insertOne', 'scan_history', {
        document: scanRecord
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.acknowledged) {
        console.log('✅ Scan history saved successfully');
        await this.cacheScanHistory(scanRecord);
        return scanRecord;
      } else {
        throw new Error('Failed to save scan history');
      }
      
    } catch (error) {
      console.error('❌ Error saving scan history:', error);
      
      // Cache locally for offline sync
      await this.cacheScanHistory(scanData);
      await this.addToSyncQueue('saveScanHistory', scanData);
      
      throw this.createDatabaseError(error as Error);
    }
  }

  /**
   * Get scan history for user
   */
  async getScanHistory(userId: string, limit: number = 50): Promise<ScanHistory[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const response = await this.makeDataApiRequest('find', 'scan_history', {
        filter: { user_id: userId },
        sort: { scan_timestamp: -1 },
        limit: limit
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.documents) {
        console.log(`✅ Found ${result.documents.length} scan history records`);
        await this.cacheScanHistoryList(userId, result.documents);
        return result.documents;
      } else {
        console.log('ℹ️ No scan history found');
        return [];
      }
      
    } catch (error) {
      console.error('❌ Error getting scan history:', error);
      
      // Try to get cached history
      const cachedHistory = await this.getCachedScanHistory(userId);
      if (cachedHistory) {
        console.log('📱 Using cached scan history');
        return cachedHistory;
      }
      
      return [];
    }
  }

  /**
   * Sync offline data when connection is restored
   */
  async syncOfflineData(): Promise<void> {
    try {
      const syncQueueData = await AsyncStorage.getItem('syncQueue');
      if (!syncQueueData) return;

      const operations: SyncOperation[] = JSON.parse(syncQueueData);
      console.log(`🔄 Syncing ${operations.length} offline operations`);

      const successfulOperations: number[] = [];

      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        
        if (!operation) continue;
        
        try {
          switch (operation.type) {
            case 'saveUserProfile':
              await this.saveUserProfile(operation.data);
              break;
            case 'saveScanHistory':
              await this.saveScanHistory(operation.data);
              break;
            default:
              console.warn(`Unknown sync operation: ${operation.type}`);
          }
          
          successfulOperations.push(i);
        } catch (error) {
          console.error(`Failed to sync operation ${operation.type}:`, error);
          
          // Increment retry count
          operation.retryCount = (operation.retryCount || 0) + 1;
          
          // Remove operation if it has failed too many times
          if (operation.retryCount >= 3) {
            console.warn(`Removing failed operation after 3 retries: ${operation.type}`);
            successfulOperations.push(i);
          }
        }
      }

      // Remove successful operations from queue
      const remainingOperations = operations.filter((_, index) => 
        !successfulOperations.includes(index)
      );

      if (remainingOperations.length === 0) {
        await AsyncStorage.removeItem('syncQueue');
        console.log('✅ All offline data synced successfully');
      } else {
        await AsyncStorage.setItem('syncQueue', JSON.stringify(remainingOperations));
        console.log(`⚠️ ${remainingOperations.length} operations still pending sync`);
      }

    } catch (error) {
      console.error('❌ Error syncing offline data:', error);
    }
  }

  // Private helper methods

  private buildDataApiUrl(): string {
    try {
      // Extract cluster information from connection string
      const match = this.config.connectionString.match(/mongodb\+srv:\/\/[^@]+@([^/]+)/);
      if (!match) {
        throw new Error('Invalid MongoDB connection string format');
      }
      
      const cluster = match[1];
      if (!cluster) {
        throw new Error('Could not extract cluster information from connection string');
      }
      const clusterName = cluster.split('.')[0];
      
      return `https://data.mongodb-api.com/app/data-${clusterName}/endpoint/data/v1`;
    } catch (error) {
      throw new Error(`Failed to build Data API URL: ${error}`);
    }
  }

  private async makeDataApiRequest(
    action: string, 
    collection: string, 
    payload: any
  ): Promise<Response> {
    const url = `${this.dataApiUrl}/action/${action}`;
    
    const requestBody = {
      collection,
      database: this.config.databaseName,
      ...payload
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.dataApiKey,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private createDatabaseError(error: Error): DatabaseError {
    const dbError: DatabaseError = new Error(error.message);
    dbError.name = 'DatabaseError';
    
    // Classify error types
    if (error.message.includes('network') || error.message.includes('fetch')) {
      dbError.isNetworkError = true;
    }
    
    if (error.message.includes('401') || error.message.includes('403')) {
      dbError.isAuthError = true;
    }
    
    return dbError;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Caching methods for offline support

  private async cacheConnectionStatus(status: boolean): Promise<void> {
    await AsyncStorage.setItem('dbConnectionStatus', JSON.stringify(status));
  }

  private async cacheProduct(upc: string, product: Product): Promise<void> {
    await AsyncStorage.setItem(`product_${upc}`, JSON.stringify(product));
  }

  private async getCachedProduct(upc: string): Promise<Product | null> {
    const cached = await AsyncStorage.getItem(`product_${upc}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async cacheUserProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(`user_${profile.user_id}`, JSON.stringify(profile));
  }

  private async getCachedUserProfile(userId: string): Promise<UserProfile | null> {
    const cached = await AsyncStorage.getItem(`user_${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async cacheScanHistory(scanData: ScanHistory): Promise<void> {
    const key = `scan_${scanData.user_id}_${Date.now()}`;
    await AsyncStorage.setItem(key, JSON.stringify(scanData));
  }

  private async cacheScanHistoryList(userId: string, history: ScanHistory[]): Promise<void> {
    await AsyncStorage.setItem(`scanHistory_${userId}`, JSON.stringify(history));
  }

  private async getCachedScanHistory(userId: string): Promise<ScanHistory[] | null> {
    const cached = await AsyncStorage.getItem(`scanHistory_${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  private async addToSyncQueue(type: SyncOperation['type'], data: any): Promise<void> {
    try {
      const existingQueueData = await AsyncStorage.getItem('syncQueue');
      const queue: SyncOperation[] = existingQueueData ? JSON.parse(existingQueueData) : [];
      
      queue.push({
        type,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0
      });
      
      await AsyncStorage.setItem('syncQueue', JSON.stringify(queue));
      console.log(`📝 Added ${type} operation to sync queue`);
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }
}