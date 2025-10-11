/**
 * Database service usage examples
 * Demonstrates how to use the MongoDB Atlas database service
 */

import { getDatabaseService, initializeDatabase } from '../index';
import { ProductRepository, UserRepository, ScanHistoryRepository } from '../collections';
import { UserProfile } from '../../models/UserProfile';
import { ScanHistory } from '../../models/ScanHistory';

/**
 * Example: Initialize database and perform basic operations
 */
export async function exampleDatabaseUsage(): Promise<void> {
  try {
    // Initialize database connection
    console.log('🔄 Initializing database connection...');
    await initializeDatabase();

    // Get database service instance
    const dbService = getDatabaseService();

    // Create repository instances
    const productRepo = new ProductRepository(dbService);
    const userRepo = new UserRepository(dbService);
    const scanHistoryRepo = new ScanHistoryRepository(dbService);

    // Example 1: Look up a product by UPC
    console.log('🔍 Looking up product...');
    const product = await productRepo.findByUPC('123456789012');
    
    if (product) {
      console.log('✅ Product found:', product.name);
    } else {
      console.log('ℹ️ Product not found in database');
    }

    // Example 2: Create or update user profile
    console.log('👤 Managing user profile...');
    const userProfile: UserProfile = {
      user_id: 'example-user-123',
      dietary_restrictions: {
        allergies: ['milk', 'eggs'],
        medical: ['diabetes'],
        religious: ['halal'],
        lifestyle: ['vegetarian']
      },
      preferences: {
        strict_mode: true,
        notification_level: 'high',
        language: 'en',
        theme: 'auto',
        sound_enabled: true,
        vibration_enabled: true
      },
      created_at: new Date(),
      last_active: new Date()
    };

    const savedProfile = await userRepo.create(userProfile);
    console.log('✅ User profile saved:', savedProfile.user_id);

    // Example 3: Retrieve user profile
    const retrievedProfile = await userRepo.findByUserId('example-user-123');
    if (retrievedProfile) {
      console.log('✅ User profile retrieved:', retrievedProfile.user_id);
      console.log('   Allergies:', retrievedProfile.dietary_restrictions.allergies);
    }

    // Example 4: Save scan history
    console.log('📱 Saving scan history...');
    const scanResult: ScanHistory = {
      user_id: 'example-user-123',
      product_upc: '123456789012',
      product_name: 'Example Product',
      product_brand: 'Example Brand',
      scan_timestamp: new Date(),
      compliance_result: {
        safe: false,
        violations: ['Contains milk (dairy allergy)'],
        warnings: ['High sugar content'],
        confidence: 0.95
      },
      scan_method: 'barcode',
      scan_duration: 1500
    };

    const savedScan = await scanHistoryRepo.create(scanResult);
    console.log('✅ Scan history saved');

    // Example 5: Retrieve scan history
    const scanHistory = await scanHistoryRepo.findByUserId('example-user-123', 10);
    console.log(`✅ Retrieved ${scanHistory.length} scan history records`);

    console.log('🎉 Database operations completed successfully');

  } catch (error) {
    console.error('❌ Database operation failed:', error);
    
    // Handle specific error types
    if (error.isNetworkError) {
      console.log('💡 Suggestion: Check internet connection and MongoDB Atlas status');
    } else if (error.isAuthError) {
      console.log('💡 Suggestion: Verify MongoDB Data API key and permissions');
    } else {
      console.log('💡 Suggestion: Check MongoDB Atlas configuration and logs');
    }
  }
}

/**
 * Example: Handle offline scenarios
 */
export async function exampleOfflineHandling(): Promise<void> {
  try {
    const dbService = getDatabaseService();
    
    // Check connection status
    if (!dbService.isConnectionActive()) {
      console.log('📱 Database offline - using cached data');
      
      // Operations will automatically use cached data and queue for sync
      const userRepo = new UserRepository(dbService);
      
      // This will use cached data if available
      const cachedProfile = await userRepo.findByUserId('example-user-123');
      
      if (cachedProfile) {
        console.log('✅ Using cached user profile');
      } else {
        console.log('ℹ️ No cached profile available');
      }
    }

    // When connection is restored, sync will happen automatically
    await dbService.connect();
    console.log('🔄 Connection restored - syncing offline data...');
    await dbService.syncOfflineData();
    
  } catch (error) {
    console.error('❌ Offline handling failed:', error);
  }
}

/**
 * Example: Error handling and retry logic
 */
export async function exampleErrorHandling(): Promise<void> {
  const dbService = getDatabaseService();
  const productRepo = new ProductRepository(dbService);

  try {
    // This might fail due to network issues
    const product = await productRepo.findByUPC('123456789012');
    console.log('✅ Product lookup successful');
    
  } catch (error) {
    console.error('❌ Product lookup failed:', error.message);
    
    // Implement custom retry logic if needed
    console.log('🔄 Retrying with exponential backoff...');
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        const product = await productRepo.findByUPC('123456789012');
        console.log(`✅ Product lookup successful on attempt ${attempt}`);
        break;
      } catch (retryError) {
        console.error(`❌ Retry attempt ${attempt} failed:`, retryError.message);
        
        if (attempt === 3) {
          console.log('💡 All retry attempts exhausted - using fallback strategy');
          // Implement fallback strategy (cached data, default values, etc.)
        }
      }
    }
  }
}

/**
 * Example: Batch operations for better performance
 */
export async function exampleBatchOperations(): Promise<void> {
  const dbService = getDatabaseService();
  const scanHistoryRepo = new ScanHistoryRepository(dbService);

  // Simulate multiple scan operations
  const scanResults: ScanHistory[] = [
    {
      user_id: 'batch-user-123',
      product_upc: '111111111111',
      scan_timestamp: new Date(),
      compliance_result: { safe: true, violations: [], warnings: [], confidence: 0.9 }
    },
    {
      user_id: 'batch-user-123',
      product_upc: '222222222222',
      scan_timestamp: new Date(),
      compliance_result: { safe: false, violations: ['Contains nuts'], warnings: [], confidence: 0.95 }
    },
    {
      user_id: 'batch-user-123',
      product_upc: '333333333333',
      scan_timestamp: new Date(),
      compliance_result: { safe: true, violations: [], warnings: ['High sodium'], confidence: 0.85 }
    }
  ];

  try {
    // Save scan results individually (could be optimized with batch operations)
    console.log('💾 Saving batch scan results...');
    
    const savedScans = await Promise.all(
      scanResults.map(scan => scanHistoryRepo.create(scan))
    );

    console.log(`✅ Saved ${savedScans.length} scan results`);

  } catch (error) {
    console.error('❌ Batch operation failed:', error);
  }
}