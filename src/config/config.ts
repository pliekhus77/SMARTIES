import { z } from 'zod';

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
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
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

// Load and validate configuration
function loadConfig(): Config {
  try {
    const rawConfig = {
      mongodb: {
        uri: process.env.MONGODB_URI || '',
        database: process.env.MONGODB_DATABASE || 'smarties',
      },
      ai: {
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
      },
      apis: {
        openFoodFactsUrl: process.env.OPEN_FOOD_FACTS_API_URL || 'https://world.openfoodfacts.org/api/v0',
        usdaApiKey: process.env.USDA_API_KEY,
      },
      app: {
        nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
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
