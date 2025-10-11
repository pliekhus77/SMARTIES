import { SecretsManager, SecretsError } from '../secrets';

// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  // Reset singleton instance
  (SecretsManager as any).instance = undefined;
});

afterAll(() => {
  process.env = originalEnv;
});

describe('SecretsManager', () => {
  it('should load valid secrets', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

    const secretsManager = SecretsManager.getInstance();
    const secrets = secretsManager.loadSecrets();
    
    expect(secrets.mongodb.uri).toBe('mongodb://localhost:27017/test');
    expect(secrets.ai.openaiApiKey).toBe('sk-test-key');
    expect(secrets.ai.anthropicApiKey).toBe('sk-ant-test-key');
  });

  it('should throw error for missing required secrets', () => {
    delete process.env.MONGODB_URI;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const secretsManager = SecretsManager.getInstance();
    
    expect(() => {
      secretsManager.loadSecrets();
    }).toThrow(SecretsError);
  });

  it('should validate secrets correctly', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

    const secretsManager = SecretsManager.getInstance();
    
    expect(secretsManager.validateSecrets()).toBe(true);
  });

  it('should return false for invalid secrets validation', () => {
    delete process.env.MONGODB_URI;

    const secretsManager = SecretsManager.getInstance();
    
    expect(secretsManager.validateSecrets()).toBe(false);
  });

  it('should clear secrets from memory', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

    const secretsManager = SecretsManager.getInstance();
    secretsManager.loadSecrets();
    secretsManager.clearSecrets();
    
    // Should reload secrets when accessed again
    const secrets = secretsManager.getSecrets();
    expect(secrets.mongodb.uri).toBe('mongodb://localhost:27017/test');
  });

  it('should be a singleton', () => {
    const instance1 = SecretsManager.getInstance();
    const instance2 = SecretsManager.getInstance();
    
    expect(instance1).toBe(instance2);
  });
});
