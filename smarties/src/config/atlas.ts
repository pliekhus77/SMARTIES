/**
 * MongoDB Atlas configuration
 * Database connection and configuration settings
 */

export interface AtlasConfig {
  connectionString: string;
  databaseName: string;
  collections: {
    products: string;
    users: string;
    scanHistory: string;
  };
  options: {
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
  };
}

/**
 * Get Atlas configuration from environment variables
 */
export function getAtlasConfig(): AtlasConfig {
  // In a real implementation, these would come from environment variables
  // For now, using placeholder values
  return {
    connectionString: process.env.MONGODB_CONNECTION_STRING || 'mongodb+srv://placeholder',
    databaseName: process.env.MONGODB_DATABASE_NAME || 'smarties_db',
    collections: {
      products: 'products',
      users: 'users',
      scanHistory: 'scan_history',
    },
    options: {
      retryAttempts: 3,
      retryDelay: 1000, // milliseconds
      timeout: 10000, // milliseconds
    },
  };
}

/**
 * Validate Atlas configuration
 */
export function validateAtlasConfig(config: AtlasConfig): boolean {
  if (!config.connectionString || config.connectionString === 'mongodb+srv://placeholder') {
    console.error('MongoDB connection string not configured');
    return false;
  }
  
  if (!config.databaseName) {
    console.error('MongoDB database name not configured');
    return false;
  }
  
  return true;
}

/**
 * Get collection name with environment prefix
 */
export function getCollectionName(baseName: string, environment?: string): string {
  const env = environment || process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return baseName;
  }
  
  return `${env}_${baseName}`;
}