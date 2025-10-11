/**
 * Example usage of DatabaseService for SMARTIES application
 * Demonstrates connection management, CRUD operations, and error handling
 */

import { DatabaseService, DatabaseError, ConnectionState } from '../DatabaseService';
import { Product } from '../../types/Product';
import { User } from '../../types/User';
import { ScanResult } from '../../types/ScanResult';

/**
 * Example class showing how to use DatabaseService in the SMARTIES application
 */
export class DatabaseServiceExample {
  private dbService: DatabaseService;

  constructor() {
    // Initialize database service (in production, MongoDB client would be provided)
    this.dbService = new DatabaseService();
  }

  /**
   * Example: Initialize database connection with error handling
   */
  async initializeDatabase(): Promise<boolean> {
    try {
      console.log('Initializing database connection...');
      
      // Connect to MongoDB Atlas
      await this.dbService.connect();
      
      // Verify connection health
      const isHealthy = await this.dbService.testConnection();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }

      console.log('Database initialized successfully');
      console.log('Connection stats:', this.dbService.getConnectionStats());
      
      return true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      
      // Check if we can continue in offline mode
      if (error instanceof DatabaseError && error.code === 'MAX_RETRIES_EXCEEDED') {
        console.log('Falling back to offline mode');
        return false; // App can continue with limited functionality
      }
      
      throw error; // Critical error, app cannot start
    }
  }

  /**
   * Example: Product management operations
   */
  async demonstrateProductOperations(): Promise<void> {
    console.log('\n=== Product Operations Demo ===');

    // Create a sample product
    const sampleProduct: Omit<Product, '_id'> = {
      upc: '012345678901',
      name: 'Organic Whole Milk',
      brand: 'Horizon',
      ingredients: ['organic milk', 'vitamin d3'],
      allergens: ['milk'],
      dietaryFlags: {
        halal: true,
        kosher: false,
        vegan: false,
        vegetarian: true,
        glutenFree: true
      },
      source: 'openfoodfacts',
      lastUpdated: new Date(),
      confidence: 0.95
    };

    try {
      // Create product
      const createResult = await this.dbService.createProduct(sampleProduct);
      if (createResult.success) {
        console.log('✅ Product created:', createResult.data?.name);
      } else {
        console.error('❌ Failed to create product:', createResult.error);
        return;
      }

      // Find product by UPC
      const findResult = await this.dbService.getProductByUPC('012345678901');
      if (findResult.success && findResult.data) {
        console.log('✅ Product found:', findResult.data.name);
        console.log('   Allergens:', findResult.data.allergens.join(', '));
      } else {
        console.log('❌ Product not found');
      }

      // Update product
      const updateResult = await this.dbService.updateProduct('012345678901', {
        confidence: 0.98,
        lastUpdated: new Date()
      });
      if (updateResult.success && updateResult.data) {
        console.log('✅ Product updated successfully');
      } else {
        console.log('❌ Failed to update product');
      }

      // List all products
      const listResult = await this.dbService.getProducts();
      if (listResult.success) {
        console.log(`✅ Found ${listResult.data?.length} products in database`);
      }

    } catch (error) {
      console.error('❌ Product operations failed:', error);
    }
  }

  /**
   * Example: User profile management
   */
  async demonstrateUserOperations(): Promise<void> {
    console.log('\n=== User Operations Demo ===');

    const sampleUser: Omit<User, '_id'> = {
      profileId: 'user-123',
      name: 'John Doe',
      dietaryRestrictions: {
        allergies: ['milk', 'eggs'],
        religious: ['halal'],
        medical: ['diabetes'],
        lifestyle: ['vegan']
      },
      preferences: {
        alertLevel: 'strict',
        notifications: true,
        offlineMode: false
      },
      createdAt: new Date(),
      lastActive: new Date()
    };

    try {
      // Create user
      const createResult = await this.dbService.createUser(sampleUser);
      if (createResult.success) {
        console.log('✅ User created:', createResult.data?.name);
        console.log('   Allergies:', createResult.data?.dietaryRestrictions.allergies.join(', '));
      }

      // Find user by profile ID
      const findResult = await this.dbService.getUserByProfileId('user-123');
      if (findResult.success && findResult.data) {
        console.log('✅ User found:', findResult.data.name);
        console.log('   Alert level:', findResult.data.preferences.alertLevel);
      }

      // Update user preferences
      const updateResult = await this.dbService.updateUser('user-123', {
        preferences: {
          alertLevel: 'moderate',
          notifications: true,
          offlineMode: true
        },
        lastActive: new Date()
      });
      if (updateResult.success && updateResult.data) {
        console.log('✅ User preferences updated');
      }

    } catch (error) {
      console.error('❌ User operations failed:', error);
    }
  }

  /**
   * Example: Scan result tracking
   */
  async demonstrateScanOperations(): Promise<void> {
    console.log('\n=== Scan Operations Demo ===');

    const sampleScanResult: Omit<ScanResult, '_id'> = {
      userId: '507f1f77bcf86cd799439011',
      productId: '507f1f77bcf86cd799439012',
      upc: '012345678901',
      scanTimestamp: new Date(),
      complianceStatus: 'violation',
      violations: ['Contains milk - user is allergic'],
      aiAnalysis: {
        recommendation: 'Avoid this product due to milk allergy. Consider plant-based alternatives.',
        alternatives: ['Oat Milk', 'Almond Milk', 'Soy Milk'],
        confidence: 0.92
      },
      location: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    };

    try {
      // Create scan result
      const createResult = await this.dbService.createScanResult(sampleScanResult);
      if (createResult.success) {
        console.log('✅ Scan result recorded');
        console.log('   Status:', createResult.data?.complianceStatus);
        console.log('   Violations:', createResult.data?.violations.join(', '));
      }

      // Get user's scan history
      const historyResult = await this.dbService.getScanResultsByUserId('507f1f77bcf86cd799439011');
      if (historyResult.success) {
        console.log(`✅ Found ${historyResult.data?.length} scan results for user`);
        
        // Show recent violations
        const violations = historyResult.data?.filter(scan => scan.complianceStatus === 'violation');
        console.log(`   Recent violations: ${violations?.length || 0}`);
      }

    } catch (error) {
      console.error('❌ Scan operations failed:', error);
    }
  }

  /**
   * Example: Error handling and recovery
   */
  async demonstrateErrorHandling(): Promise<void> {
    console.log('\n=== Error Handling Demo ===');

    try {
      // Attempt operation when disconnected
      await this.dbService.disconnect();
      
      const result = await this.dbService.getProducts();
      if (!result.success) {
        console.log('✅ Graceful error handling - operation failed safely');
        console.log('   Error:', result.error);
      }

      // Reconnect and retry
      await this.dbService.connect();
      const retryResult = await this.dbService.getProducts();
      if (retryResult.success) {
        console.log('✅ Successfully recovered after reconnection');
      }

    } catch (error) {
      console.error('❌ Error handling demo failed:', error);
    }
  }

  /**
   * Example: Connection monitoring
   */
  async demonstrateConnectionMonitoring(): Promise<void> {
    console.log('\n=== Connection Monitoring Demo ===');

    // Show connection statistics
    const stats = this.dbService.getConnectionStats();
    console.log('Connection Statistics:');
    console.log('  State:', stats.state);
    console.log('  Healthy:', stats.isHealthy);
    console.log('  Retries:', stats.retries);
    console.log('  Last Attempt:', stats.lastAttempt?.toISOString() || 'Never');

    // Test connection health
    const isHealthy = await this.dbService.testConnection();
    console.log('Health Check Result:', isHealthy ? '✅ Healthy' : '❌ Unhealthy');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('\n=== Cleanup ===');
    await this.dbService.disconnect();
    console.log('✅ Database connection closed');
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    try {
      console.log('🚀 SMARTIES Database Service Examples\n');

      // Initialize database
      const initialized = await this.initializeDatabase();
      if (!initialized) {
        console.log('⚠️  Running in offline mode - some examples may not work');
        return;
      }

      // Run demonstrations
      await this.demonstrateProductOperations();
      await this.demonstrateUserOperations();
      await this.demonstrateScanOperations();
      await this.demonstrateErrorHandling();
      await this.demonstrateConnectionMonitoring();

    } catch (error) {
      console.error('❌ Examples failed:', error);
    } finally {
      // Always cleanup
      await this.cleanup();
    }
  }
}

// Export for use in other parts of the application
export default DatabaseServiceExample;

// Example usage:
// const example = new DatabaseServiceExample();
// await example.runAllExamples();