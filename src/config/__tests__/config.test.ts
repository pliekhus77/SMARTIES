// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Configuration', () => {
  it('should load valid configuration', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.MONGODB_DATABASE = 'smarties_test';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

    const { config } = require('../config');
    
    expect(config.mongodb.uri).toBe('mongodb://localhost:27017/test');
    expect(config.mongodb.database).toBe('smarties_test');
    expect(config.ai.openaiApiKey).toBe('sk-test-key');
    expect(config.ai.anthropicApiKey).toBe('sk-ant-test-key');
  });

  it('should throw error for missing required configuration', () => {
    delete process.env.MONGODB_URI;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => {
      jest.resetModules();
      require('../config');
    }).toThrow('Configuration Error');
  });

  it('should use default values for optional configuration', () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
    process.env.NODE_ENV = 'development';

    const { config } = require('../config');
    
    expect(config.mongodb.database).toBe('smarties');
    expect(config.app.nodeEnv).toBe('development');
    expect(config.app.logLevel).toBe('info');
  });
});
