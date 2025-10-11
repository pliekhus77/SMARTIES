// Integration test setup for SMARTIES

// Mock configuration before importing
jest.mock('../../config/config', () => ({
  config: {
    mongodb: {
      uri: 'mongodb://localhost:27017/test',
      database: 'smarties_integration_test',
    },
    ai: {
      openaiApiKey: 'sk-test-key',
      anthropicApiKey: 'sk-ant-test-key',
    },
    apis: {
      openFoodFactsUrl: 'https://world.openfoodfacts.org/api/v0',
    },
    app: {
      nodeEnv: 'test',
      logLevel: 'info',
    },
  },
}));

// Integration test configuration
export const integrationConfig = {
  mongodb: {
    uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/test',
    database: process.env.TEST_MONGODB_DATABASE || 'smarties_integration_test',
  },
  ai: {
    openaiApiKey: process.env.TEST_OPENAI_API_KEY || 'sk-test-key',
    anthropicApiKey: process.env.TEST_ANTHROPIC_API_KEY || 'sk-ant-test-key',
  },
  timeout: 30000, // 30 seconds for integration tests
};

// Test data cleanup utilities
export class IntegrationTestUtils {
  static async cleanupTestData(collectionName: string): Promise<void> {
    // In a real implementation, this would connect to MongoDB and clean up test data
    console.log(`Cleaning up test data from ${collectionName}`);
  }

  static async seedTestData(collectionName: string, data: any[]): Promise<void> {
    // In a real implementation, this would seed test data
    console.log(`Seeding ${data.length} records to ${collectionName}`);
  }

  static generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async waitForCondition(
    condition: () => Promise<boolean>,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    throw new Error(`Condition not met within ${timeoutMs}ms`);
  }
}

// Mock external services for integration tests
export class IntegrationMockServices {
  private static responses = new Map<string, any>();

  static mockOpenFoodFactsResponse(upc: string, response: any): void {
    this.responses.set(`openfoodfacts_${upc}`, response);
  }

  static mockOpenAIResponse(prompt: string, response: any): void {
    this.responses.set(`openai_${prompt}`, response);
  }

  static mockResponse(key: string, response: any): void {
    this.responses.set(key, response);
  }

  static getResponse(key: string): any {
    return this.responses.get(key);
  }

  static clear(): void {
    this.responses.clear();
  }
}

// Setup and teardown for integration tests
beforeAll(async () => {
  console.log('Setting up integration test environment...');
  // In a real implementation, this would set up test database connections
});

afterAll(async () => {
  console.log('Tearing down integration test environment...');
  IntegrationMockServices.clear();
});

beforeEach(async () => {
  IntegrationMockServices.clear();
});

afterEach(async () => {
  // Cleanup any test data created during the test
  await IntegrationTestUtils.cleanupTestData('products');
  await IntegrationTestUtils.cleanupTestData('users');
  await IntegrationTestUtils.cleanupTestData('scan_history');
});
