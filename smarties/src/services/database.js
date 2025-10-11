/**
 * MongoDB Atlas Database Service for SMARTIES React Native App
 * Handles connection, authentication, and data operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MONGODB_URI, MONGODB_DATABASE } from '@env';

class DatabaseService {
  constructor() {
    this.isConnected = false;
    this.connectionString = MONGODB_URI;
    this.databaseName = MONGODB_DATABASE || 'smarties_db';
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Initialize database connection with retry logic
   */
  async connect() {
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Database connection attempt ${attempt}/${this.retryAttempts}`);
        
        // For React Native, we'll use HTTP API calls to MongoDB Data API
        // This is more suitable for mobile apps than direct MongoDB driver
        const response = await this.testConnection();
        
        if (response.ok) {
          this.isConnected = true;
          console.log('✅ Database connected successfully');
          await this.cacheConnectionStatus(true);
          return true;
        }
        
        throw new Error(`Connection failed with status: ${response.status}`);
        
      } catch (error) {
        console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.retryAttempts) {
          this.isConnected = false;
          await this.cacheConnectionStatus(false);
          throw new Error(`Database connection failed after ${this.retryAttempts} attempts: ${error.message}`);
        }
        
        // Wait before retry
        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  /**
   * Test database connection using MongoDB Data API
   */
  async testConnection() {
    const apiUrl = this.getDataApiUrl();
    
    return fetch(`${apiUrl}/action/findOne`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.getApiKey(),
      },
      body: JSON.stringify({
        collection: 'products',
        database: this.databaseName,
        filter: {},
        limit: 1
      })
    });
  }

  /**
   * Find products by UPC code
   */
  async findProductByUPC(upc) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const apiUrl = this.getDataApiUrl();
      const response = await fetch(`${apiUrl}/action/findOne`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.getApiKey(),
        },
        body: JSON.stringify({
          collection: 'products',
          database: this.databaseName,
          filter: { upc: upc }
        })
      });

      const result = await response.json();
      
      if (result.document) {
        console.log(`✅ Product found for UPC: ${upc}`);
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
      
      throw error;
    }
  }

  /**
   * Save user profile
   */
  async saveUserProfile(userProfile) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const apiUrl = this.getDataApiUrl();
      const response = await fetch(`${apiUrl}/action/replaceOne`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.getApiKey(),
        },
        body: JSON.stringify({
          collection: 'users',
          database: this.databaseName,
          filter: { userId: userProfile.userId },
          replacement: {
            ...userProfile,
            updatedAt: new Date().toISOString()
          },
          upsert: true
        })
      });

      const result = await response.json();
      
      if (result.acknowledged) {
        console.log('✅ User profile saved successfully');
        await this.cacheUserProfile(userProfile);
        return result;
      } else {
        throw new Error('Failed to save user profile');
      }
      
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
      
      // Cache locally for offline sync
      await this.cacheUserProfile(userProfile);
      await this.addToSyncQueue('saveUserProfile', userProfile);
      
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const apiUrl = this.getDataApiUrl();
      const response = await fetch(`${apiUrl}/action/findOne`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.getApiKey(),
        },
        body: JSON.stringify({
          collection: 'users',
          database: this.databaseName,
          filter: { userId: userId }
        })
      });

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
      
      throw error;
    }
  }

  /**
   * Save scan history
   */
  async saveScanHistory(scanData) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const apiUrl = this.getDataApiUrl();
      const response = await fetch(`${apiUrl}/action/insertOne`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.getApiKey(),
        },
        body: JSON.stringify({
          collection: 'scan_history',
          database: this.databaseName,
          document: {
            ...scanData,
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      
      if (result.acknowledged) {
        console.log('✅ Scan history saved successfully');
        await this.cacheScanHistory(scanData);
        return result;
      } else {
        throw new Error('Failed to save scan history');
      }
      
    } catch (error) {
      console.error('❌ Error saving scan history:', error);
      
      // Cache locally for offline sync
      await this.cacheScanHistory(scanData);
      await this.addToSyncQueue('saveScanHistory', scanData);
      
      throw error;
    }
  }

  /**
   * Get scan history for user
   */
  async getScanHistory(userId, limit = 50) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const apiUrl = this.getDataApiUrl();
      const response = await fetch(`${apiUrl}/action/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.getApiKey(),
        },
        body: JSON.stringify({
          collection: 'scan_history',
          database: this.databaseName,
          filter: { userId: userId },
          sort: { timestamp: -1 },
          limit: limit
        })
      });

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
   * Disconnect from database
   */
  async disconnect() {
    this.isConnected = false;
    await this.cacheConnectionStatus(false);
    console.log('📤 Database disconnected');
  }

  /**
   * Check if database is connected
   */
  isConnectedToDatabase() {
    return this.isConnected;
  }

  /**
   * Sync offline data when connection is restored
   */
  async syncOfflineData() {
    try {
      const syncQueue = await AsyncStorage.getItem('syncQueue');
      if (!syncQueue) return;

      const operations = JSON.parse(syncQueue);
      console.log(`🔄 Syncing ${operations.length} offline operations`);

      for (const operation of operations) {
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
        } catch (error) {
          console.error(`Failed to sync operation ${operation.type}:`, error);
        }
      }

      // Clear sync queue after successful sync
      await AsyncStorage.removeItem('syncQueue');
      console.log('✅ Offline data sync completed');

    } catch (error) {
      console.error('❌ Error syncing offline data:', error);
    }
  }

  // Private helper methods

  getDataApiUrl() {
    // Extract cluster URL from connection string
    const match = this.connectionString.match(/mongodb\+srv:\/\/[^@]+@([^\/]+)/);
    if (match) {
      const cluster = match[1];
      return `https://data.mongodb-api.com/app/data-${cluster.split('.')[0]}/endpoint/data/v1`;
    }
    throw new Error('Invalid MongoDB connection string');
  }

  getApiKey() {
    // For production, this should be stored securely
    // For now, we'll extract from connection string or use environment variable
    return process.env.MONGODB_DATA_API_KEY || 'your-data-api-key';
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cacheConnectionStatus(status) {
    await AsyncStorage.setItem('dbConnectionStatus', JSON.stringify(status));
  }

  async cacheProduct(upc, product) {
    await AsyncStorage.setItem(`product_${upc}`, JSON.stringify(product));
  }

  async getCachedProduct(upc) {
    const cached = await AsyncStorage.getItem(`product_${upc}`);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheUserProfile(profile) {
    await AsyncStorage.setItem(`user_${profile.userId}`, JSON.stringify(profile));
  }

  async getCachedUserProfile(userId) {
    const cached = await AsyncStorage.getItem(`user_${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheScanHistory(scanData) {
    const key = `scan_${scanData.userId}_${Date.now()}`;
    await AsyncStorage.setItem(key, JSON.stringify(scanData));
  }

  async cacheScanHistoryList(userId, history) {
    await AsyncStorage.setItem(`scanHistory_${userId}`, JSON.stringify(history));
  }

  async getCachedScanHistory(userId) {
    const cached = await AsyncStorage.getItem(`scanHistory_${userId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async addToSyncQueue(type, data) {
    try {
      const existingQueue = await AsyncStorage.getItem('syncQueue');
      const queue = existingQueue ? JSON.parse(existingQueue) : [];
      
      queue.push({
        type,
        data,
        timestamp: new Date().toISOString()
      });
      
      await AsyncStorage.setItem('syncQueue', JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }
}

// Export singleton instance
export default new DatabaseService();