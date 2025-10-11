import { DatabaseService } from '../../src/services/atlas/database';

describe('MongoDB Atlas Integration Tests', () => {
  let databaseService: DatabaseService;
  
  beforeAll(async () => {
    const config = {
      connectionString: process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017',
      databaseName: 'smarties_test',
      retryAttempts: 3,
      retryDelay: 1000,
    };
    
    databaseService = new DatabaseService(config);
  });

  afterAll(async () => {
    if (databaseService) {
      await databaseService.disconnect();
    }
  });

  describe('Database Connection', () => {
    it('should connect to MongoDB Atlas successfully', async () => {
      const isConnected = await databaseService.testConnection();
      expect(isConnected).toBe(true);
    }, 15000);

    it('should handle connection failures gracefully', async () => {
      const badConfig = {
        connectionString: 'mongodb://invalid:27017',
        databaseName: 'test',
        retryAttempts: 1,
        retryDelay: 100,
      };
      
      const badService = new DatabaseService(badConfig);
      const isConnected = await badService.testConnection();
      expect(isConnected).toBe(false);
    }, 10000);
  });

  describe('CRUD Operations', () => {
    beforeEach(async () => {
      await databaseService.connect();
    });

    afterEach(async () => {
      // Clean up test data
      try {
        const db = databaseService.getDatabase();
        if (db) {
          await db.collection('test_products').deleteMany({ test: true });
          await db.collection('test_users').deleteMany({ test: true });
        }
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }
    });

    it('should create and retrieve a product', async () => {
      const db = databaseService.getDatabase();
      expect(db).toBeTruthy();

      const testProduct = {
        test: true,
        upc: '123456789012',
        name: 'Test Product',
        brand: 'Test Brand',
        ingredients: ['water', 'sugar'],
        allergens: ['none'],
        created_at: new Date()
      };

      const result = await db!.collection('test_products').insertOne(testProduct);
      expect(result.insertedId).toBeTruthy();

      const retrieved = await db!.collection('test_products').findOne({ _id: result.insertedId });
      expect(retrieved).toBeTruthy();
      expect(retrieved!.name).toBe('Test Product');
    });

    it('should create and retrieve a user profile', async () => {
      const db = databaseService.getDatabase();
      expect(db).toBeTruthy();

      const testUser = {
        test: true,
        user_id: 'test_user_123',
        dietary_restrictions: {
          allergies: ['peanuts', 'dairy'],
          medical: [],
          religious: ['halal'],
          lifestyle: ['vegan']
        },
        preferences: {
          strict_mode: true,
          notification_level: 'high',
          language: 'en'
        },
        created_at: new Date()
      };

      const result = await db!.collection('test_users').insertOne(testUser);
      expect(result.insertedId).toBeTruthy();

      const retrieved = await db!.collection('test_users').findOne({ user_id: 'test_user_123' });
      expect(retrieved).toBeTruthy();
      expect(retrieved!.dietary_restrictions.allergies).toContain('peanuts');
    });
  });
});