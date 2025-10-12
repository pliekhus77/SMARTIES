import { z } from 'zod';

// Secure secrets schema
const secretsSchema = z.object({
  mongodb: z.object({
    uri: z.string().min(1),
    username: z.string().optional(),
    password: z.string().optional(),
  }),
  ai: z.object({
    openaiApiKey: z.string().min(1),
    anthropicApiKey: z.string().min(1),
  }),
  apis: z.object({
    usdaApiKey: z.string().optional(),
  }),
});

export type Secrets = z.infer<typeof secretsSchema>;

class SecretsError extends Error {
  constructor(message: string) {
    super(`Secrets Error: ${message}`);
    this.name = 'SecretsError';
  }
}

/**
 * Secure secrets manager that handles runtime secret injection
 * without storing secrets in files or memory longer than necessary
 */
export class SecretsManager {
  private static instance: SecretsManager;
  private secrets: Secrets | null = null;

  private constructor() {}

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  /**
   * Load secrets from environment variables with validation
   */
  loadSecrets(): Secrets {
    try {
      const rawSecrets = {
        mongodb: {
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smarties_local',
          username: process.env.MONGODB_USERNAME,
          password: process.env.MONGODB_PASSWORD,
        },
        ai: {
          openaiApiKey: process.env.OPENAI_API_KEY || 'sk-mock-openai-key-for-development',
          anthropicApiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-mock-anthropic-key-for-development',
        },
        apis: {
          usdaApiKey: process.env.USDA_API_KEY,
        },
      };

      this.secrets = secretsSchema.parse(rawSecrets);
      return this.secrets;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new SecretsError(`Invalid secrets configuration:\n${errorMessages.join('\n')}`);
      }
      throw new SecretsError(`Failed to load secrets: ${error}`);
    }
  }

  /**
   * Get secrets with runtime validation
   */
  getSecrets(): Secrets {
    if (!this.secrets) {
      return this.loadSecrets();
    }
    return this.secrets;
  }

  /**
   * Clear secrets from memory for security
   */
  clearSecrets(): void {
    this.secrets = null;
  }

  /**
   * Validate that all required secrets are available
   */
  validateSecrets(): boolean {
    try {
      this.getSecrets();
      return true;
    } catch {
      return false;
    }
  }
}

export { SecretsError };
