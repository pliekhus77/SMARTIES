/**
 * Configuration for React Native App
 * Simplified version for development
 */

export interface Config {
  mongodb: {
    uri: string;
    database: string;
  };
  ai: {
    openaiApiKey: string;
    anthropicApiKey: string;
  };
  apis: {
    openFoodFactsUrl: string;
    usdaApiKey?: string;
  };
  app: {
    nodeEnv: 'development' | 'staging' | 'production' | 'test';
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

// Load configuration from environment variables
export const config: Config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smarties_local',
    database: process.env.MONGODB_DATABASE || 'smarties_local',
  },
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY || 'sk-mock-openai-key-for-development',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-mock-anthropic-key-for-development',
  },
  apis: {
    openFoodFactsUrl: process.env.OPEN_FOOD_FACTS_API_URL || 'https://world.openfoodfacts.org/api/v0',
    usdaApiKey: process.env.USDA_API_KEY,
  },
  app: {
    nodeEnv: (process.env.NODE_ENV as any) || 'development',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  },
};