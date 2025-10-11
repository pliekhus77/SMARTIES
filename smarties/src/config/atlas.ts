/**
 * MongoDB Atlas configuration
 * Database connection and configuration settings
 */

export interface AtlasConfig {
  connectionString: string;
  databaseName: string;
  dataApiKey: string;
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
  // Get configuration from environment variables
  const connectionString = process.env.MONGODB_CONNECTION_STRING || process.env.MONGODB_URI;
  const dataApiKey = process.env.MONGODB_DATA_API_KEY;
  
  if (!connectionString || connectionString === 'mongodb+srv://placeholder') {
    console.warn('⚠️ MongoDB connection string not configured properly');
  }
  
  if (!dataApiKey) {
    console.warn('⚠️ MongoDB Data API key not configured');
  }
  
  return {
    connectionString: connectionString || 'mongodb+srv://placeholder',
    databaseName: process.env.MONGODB_DATABASE_NAME || process.env.MONGODB_DATABASE || 'smarties_db',
    dataApiKey: dataApiKey || '',
    collections: {
      products: getCollectionName('products'),
      users: getCollectionName('users'),
      scanHistory: getCollectionName('scan_history'),
    },
    options: {
      retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000'),
      timeout: parseInt(process.env.DB_TIMEOUT || '10000'),
    },
  };
}

/**
 * Validate Atlas configuration
 */
export function validateAtlasConfig(config: AtlasConfig): boolean {
  const errors: string[] = [];
  
  if (!config.connectionString || config.connectionString === 'mongodb+srv://placeholder') {
    errors.push('MongoDB connection string not configured');
  }
  
  if (!config.databaseName) {
    errors.push('MongoDB database name not configured');
  }
  
  if (!config.dataApiKey) {
    errors.push('MongoDB Data API key not configured');
  }
  
  if (config.options.retryAttempts < 1) {
    errors.push('Retry attempts must be at least 1');
  }
  
  if (config.options.retryDelay < 100) {
    errors.push('Retry delay must be at least 100ms');
  }
  
  if (config.options.timeout < 1000) {
    errors.push('Timeout must be at least 1000ms');
  }
  
  if (errors.length > 0) {
    console.error('❌ Atlas configuration validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    return false;
  }
  
  console.log('✅ Atlas configuration validated successfully');
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