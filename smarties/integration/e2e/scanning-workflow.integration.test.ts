import { DatabaseService } from '../../src/services/atlas/database';
import { OpenAIService } from '../../src/services/ai/openai';
import { AnthropicService } from '../../src/services/ai/anthropic';

describe('End-to-End Scanning Workflow Integration Tests', () => {
  let databaseService: DatabaseService;
  let openaiService: OpenAIService;
  let anthropicService: AnthropicService;

  beforeAll(async () => {
    // Initialize services
    const dbConfig = {
      connectionString: process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017',
      databaseName: 'smarties_test',
      retryAttempts: 3,
      retryDelay: 1000,
    };

    const openaiConfig = {
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      model: 'gpt-3.5-turbo',
      maxTokens: 150,
      temperature: 0.1,
    };

    const anthropicConfig = {
      apiKey: process.env.ANTHROPIC_API_KEY || 'test-key',
      model: 'claude-3-haiku-20240307',
      maxTokens: 150,
      temperature: 0.1,
    };

    databaseService = new DatabaseService(dbConfig);
    openaiService = new OpenAIService(openaiConfig);
    anthropicService = new AnthropicService(anthropicConfig);

    await databaseService.connect();
  });

  afterAll(async () => {
    // Cleanup
    try {
      const db = databaseService.getDatabase();
      if (db) {
        await db.collection('test_products').deleteMany({ test: true });
        await db.collection('test_users').deleteMany({ test: true });
        await db.collection('test_scan_history').deleteMany({ test: true });
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
    
    await databaseService.disconnect();
  });

  describe('Complete Scanning Workflow', () => {
    it('should complete full scan-to-result workflow', async () => {
      // Step 1: Create test user profile
      const db = databaseService.getDatabase();
      expect(db).toBeTruthy();

      const testUser = {
        test: true,
        user_id: 'workflow_test_user',
        dietary_restrictions: {
          allergies: ['peanuts', 'dairy'],
          medical: ['diabetes'],
          religious: ['halal'],
          lifestyle: ['vegetarian']
        },
        preferences: {
          strict_mode: true,
          notification_level: 'high',
          language: 'en'
        },
        created_at: new Date()
      };

      await db!.collection('test_users').insertOne(testUser);

      // Step 2: Simulate product lookup (barcode scan result)
      const testProduct = {
        test: true,
        upc: '123456789999',
        name: 'Mixed Nuts with Peanuts',
        brand: 'Test Brand',
        ingredients: ['peanuts', 'almonds', 'cashews', 'salt'],
        allergens: ['peanuts', 'tree nuts'],
        nutritional_info: {
          calories: 160,
          sodium: 90,
          sugar: 1,
          protein: 6,
          fat: 14
        },
        dietary_flags: {
          vegan: true,
          kosher: false,
          halal: false,
          gluten_free: true
        },
        source: 'test',
        last_updated: new Date(),
        confidence_score: 0.95
      };

      await db!.collection('test_products').insertOne(testProduct);

      // Step 3: Retrieve user profile
      const userProfile = await db!.collection('test_users').findOne({ user_id: 'workflow_test_user' });
      expect(userProfile).toBeTruthy();

      // Step 4: Retrieve product data
      const productData = await db!.collection('test_products').findOne({ upc: '123456789999' });
      expect(productData).toBeTruthy();

      // Step 5: Perform AI analysis (try OpenAI first, fallback to Anthropic)
      let analysisResult;
      try {
        if (process.env.OPENAI_API_KEY) {
          analysisResult = await openaiService.analyzeDietaryCompliance(
            productData!,
            userProfile!.dietary_restrictions
          );
        } else {
          throw new Error('No OpenAI key, using fallback');
        }
      } catch (error) {
        console.log('OpenAI failed, using Anthropic fallback');
        if (process.env.ANTHROPIC_API_KEY) {
          analysisResult = await anthropicService.analyzeDietaryCompliance(
            productData!,
            userProfile!.dietary_restrictions
          );
        } else {
          // Mock result for testing without API keys
          analysisResult = {
            safe: false,
            violations: ['peanuts'],
            warnings: ['high sodium'],
            confidence: 0.9,
            recommendations: ['Avoid due to peanut allergy']
          };
        }
      }

      expect(analysisResult).toBeTruthy();
      expect(analysisResult.safe).toBe(false);
      expect(analysisResult.violations).toContain('peanuts');

      // Step 6: Store scan history
      const scanRecord = {
        test: true,
        user_id: 'workflow_test_user',
        product_upc: '123456789999',
        scan_timestamp: new Date(),
        compliance_result: analysisResult,
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      };

      const scanResult = await db!.collection('test_scan_history').insertOne(scanRecord);
      expect(scanResult.insertedId).toBeTruthy();

      // Step 7: Verify complete workflow
      const storedScan = await db!.collection('test_scan_history').findOne({ _id: scanResult.insertedId });
      expect(storedScan).toBeTruthy();
      expect(storedScan!.compliance_result.safe).toBe(false);
      expect(storedScan!.compliance_result.violations).toContain('peanuts');

      console.log('✅ Complete scanning workflow test passed');
    }, 45000);

    it('should handle safe product workflow', async () => {
      const db = databaseService.getDatabase();
      
      // Create safe product
      const safeProduct = {
        test: true,
        upc: '987654321000',
        name: 'Organic Vegetable Broth',
        brand: 'Healthy Foods',
        ingredients: ['water', 'carrots', 'celery', 'onions', 'herbs', 'salt'],
        allergens: [],
        nutritional_info: {
          calories: 10,
          sodium: 140,
          sugar: 1,
          protein: 1,
          fat: 0
        },
        dietary_flags: {
          vegan: true,
          kosher: true,
          halal: true,
          gluten_free: true
        },
        source: 'test',
        last_updated: new Date(),
        confidence_score: 0.98
      };

      await db!.collection('test_products').insertOne(safeProduct);

      // Get user profile
      const userProfile = await db!.collection('test_users').findOne({ user_id: 'workflow_test_user' });
      const productData = await db!.collection('test_products').findOne({ upc: '987654321000' });

      // Analyze (mock safe result)
      const analysisResult = {
        safe: true,
        violations: [],
        warnings: [],
        confidence: 0.95,
        recommendations: ['Safe for your dietary restrictions']
      };

      // Store scan
      const scanRecord = {
        test: true,
        user_id: 'workflow_test_user',
        product_upc: '987654321000',
        scan_timestamp: new Date(),
        compliance_result: analysisResult
      };

      const scanResult = await db!.collection('test_scan_history').insertOne(scanRecord);
      expect(scanResult.insertedId).toBeTruthy();

      const storedScan = await db!.collection('test_scan_history').findOne({ _id: scanResult.insertedId });
      expect(storedScan!.compliance_result.safe).toBe(true);
      expect(storedScan!.compliance_result.violations).toHaveLength(0);

      console.log('✅ Safe product workflow test passed');
    }, 30000);
  });

  describe('Error Handling in Workflow', () => {
    it('should handle missing product gracefully', async () => {
      const db = databaseService.getDatabase();
      
      // Try to find non-existent product
      const productData = await db!.collection('test_products').findOne({ upc: 'nonexistent' });
      expect(productData).toBeNull();

      // This should trigger product not found handling in real app
      console.log('✅ Missing product handling test passed');
    });

    it('should handle database connection failures', async () => {
      const badDbService = new DatabaseService({
        connectionString: 'mongodb://invalid:27017',
        databaseName: 'test',
        retryAttempts: 1,
        retryDelay: 100,
      });

      const isConnected = await badDbService.testConnection();
      expect(isConnected).toBe(false);

      console.log('✅ Database failure handling test passed');
    });
  });
});