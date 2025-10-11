import { z } from 'zod';
import { SecretsManager } from './secrets';

// Configuration schema with validation
const configSchema = z.object({
  mongodb: z.object({
    uri: z.string().min(1, 'MongoDB URI is required'),
    database: z.string().min(1, 'MongoDB database name is required'),
  }),
  ai: z.object({
    openaiApiKey: z.string().min(1, 'OpenAI API key is required'),
    anthropicApiKey: z.string().min(1, 'Anthropic API key is required'),
  }),
  apis: z.object({
    openFoodFactsUrl: z.string().url('Invalid Open Food Facts URL'),
    usdaApiKey: z.string().optional(),
  }),
  app: z.object({
    nodeEnv: z.enum(['development', 'staging', 'production', 'test']).default('development'),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  }),
});

export type Config = z.infer<typeof configSchema>;

class ConfigurationError extends Error {
  constructor(message: string) {
    super(`Configuration Error: ${message}`);
    this.name = 'ConfigurationError';
  }
}

// Load and validate configuration with secure secrets management
function loadConfig(): Config {
  try {
    const secretsManager = SecretsManager.getInstance();
    const secrets = secretsManager.getSecrets();

    const rawConfig = {
      mongodb: {
        uri: secrets.mongodb.uri,
        database: process.env.MONGODB_DATABASE || 'smarties',
      },
      ai: {
        openaiApiKey: secrets.ai.openaiApiKey,
        anthropicApiKey: secrets.ai.anthropicApiKey,
      },
      apis: {
        openFoodFactsUrl: process.env.OPEN_FOOD_FACTS_API_URL || 'https://world.openfoodfacts.org/api/v0',
        usdaApiKey: secrets.apis.usdaApiKey,
      },
      app: {
        nodeEnv: (process.env.NODE_ENV as 'development' | 'staging' | 'production' | 'test') || 'development',
        logLevel: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') || 'info',
      },
    };

    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new ConfigurationError(`Invalid configuration:\n${errorMessages.join('\n')}`);
    }
    throw new ConfigurationError(`Failed to load configuration: ${error}`);
  }
}

// Export singleton configuration instance
export const config = loadConfig();
export { ConfigurationError };
