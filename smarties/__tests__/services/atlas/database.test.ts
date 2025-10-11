import { DatabaseService } from '../../../src/services/atlas/database';

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeEach(() => {
    const config = {
      connectionString: 'mongodb://test',
      databaseName: 'test_db',
      dataApiKey: 'test-api-key',
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 5000,
    };
    databaseService = new DatabaseService(config);
  });

  describe('connection management', () => {
    it('should initialize with disconnected state', () => {
      expect(databaseService.isConnectionActive()).toBe(false);
    });

    it('should connect successfully', async () => {
      await databaseService.connect();
      expect(databaseService.isConnectionActive()).toBe(true);
    });

    it('should disconnect successfully', async () => {
      await databaseService.connect();
      await databaseService.disconnect();
      expect(databaseService.isConnectionActive()).toBe(false);
    });
  });

  describe('connection testing', () => {
    it('should test connection successfully', async () => {
      const result = await databaseService.testConnection();
      expect(typeof result).toBe('boolean');
    });
  });
});