/**
 * MongoDB Atlas integration
 * Export Atlas-related services and create service instances
 */

import { DatabaseService, DatabaseConfig } from './database';
import { getAtlasConfig } from '../../config/atlas';

export * from './database';
export * from './collections';

// Create singleton database service instance
let databaseServiceInstance: DatabaseService | null = null;

/**
 * Get or create database service instance
 */
export function getDatabaseService(): DatabaseService {
  if (!databaseServiceInstance) {
    const atlasConfig = getAtlasConfig();
    
    const dbConfig: DatabaseConfig = {
      connectionString: atlasConfig.connectionString,
      databaseName: atlasConfig.databaseName,
      dataApiKey: '',
      retryAttempts: atlasConfig.options.retryAttempts,
      retryDelay: atlasConfig.options.retryDelay,
      timeout: atlasConfig.options.timeout,
    };

    databaseServiceInstance = new DatabaseService(dbConfig);
  }

  return databaseServiceInstance;
}

/**
 * Initialize database connection
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const dbService = getDatabaseService();
    await dbService.connect();
    console.log('✅ Database service initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database service:', error);
    throw error;
  }
}

/**
 * Cleanup database connection
 */
export async function cleanupDatabase(): Promise<void> {
  if (databaseServiceInstance) {
    await databaseServiceInstance.disconnect();
    databaseServiceInstance = null;
    console.log('✅ Database service cleaned up');
  }
}