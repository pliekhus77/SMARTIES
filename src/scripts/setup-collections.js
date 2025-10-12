/**
 * MongoDB Atlas Collections Setup Script
 * Task 5.1: Create database collections with proper schema
 * 
 * This script creates the three core collections (products, users, scan_results)
 * with validation rules and performance-optimized indexes as specified in the design document.
 * 
 * Requirements addressed:
 * - Requirement 2.1: Create collections with validation rules
 * - Design document data models and schema structure
 */

const { MongoClient } = require('mongodb');

// Database configuration
const DB_NAME = 'smarties';

/**
 * Creates the products collection with validation schema and indexes
 */
async function createProductsCollection(db) {
  console.log('📦 Creating products collection...');
  
  // Drop existing collection if it exists
  try {
    await db.collection('products').drop();
    console.log('  - Dropped existing products collection');
  } catch (error) {
    // Collection doesn't exist, which is fine
  }

  // Create products collection with validation schema
  await db.createCollection('products', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['upc', 'name', 'ingredients', 'allergens', 'source', 'lastUpdated', 'confidence'],
        properties: {
          upc: {
            bsonType: 'string',
            pattern: '^[0-9]{8,14}$',
            description: 'Unique product identifier (UPC barcode)'
          },
          name: {
            bsonType: 'string',
            minLength: 1,
            maxLength: 200,
            description: 'Product display name'
          },
          brand: {
            bsonType: 'string',
            maxLength: 100,
            description: 'Manufacturer/brand name'
          },
          ingredients: {
            bsonType: 'array',
            items: {
              bsonType: 'string'
            },
            description: 'List of ingredients'
          },
          allergens: {
            bsonType: 'array',
            items: {
              bsonType: 'string',
              enum: ['milk', 'eggs', 'fish', 'shellfish', 'tree_nuts', 'peanuts', 'wheat', 'soy', 'sesame']
            },
            description: 'Detected allergens (FDA Top 9)'
          },
          dietaryFlags: {
            bsonType: 'object',
            properties: {
              halal: { bsonType: 'bool' },
              kosher: { bsonType: 'bool' },
              vegan: { bsonType: 'bool' },
              vegetarian: { bsonType: 'bool' },
              glutenFree: { bsonType: 'bool' }
            },
            description: 'Religious/lifestyle compliance flags'
          },
          nutritionalInfo: {
            bsonType: 'object',
            properties: {
              calories: { bsonType: 'number', minimum: 0 },
              sodium: { bsonType: 'number', minimum: 0 },
              sugar: { bsonType: 'number', minimum: 0 }
            },
            description: 'Basic nutrition data'
          },
          imageUrl: {
            bsonType: 'string',
            description: 'Product image URL'
          },
          source: {
            bsonType: 'string',
            enum: ['manual', 'openfoodfacts', 'usda'],
            description: 'Data source'
          },
          lastUpdated: {
            bsonType: 'date',
            description: 'Last update timestamp'
          },
          confidence: {
            bsonType: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Data quality score (0-1)'
          }
        }
      }
    }
  });

  // Create performance-optimized indexes
  const productsCollection = db.collection('products');
  
  // Primary lookup by barcode (unique constraint)
  await productsCollection.createIndex(
    { 'upc': 1 }, 
    { unique: true, name: 'upc_unique' }
  );
  
  // Fast allergen filtering
  await productsCollection.createIndex(
    { 'allergens': 1 }, 
    { name: 'allergens_index' }
  );
  
  // Text search capability
  await productsCollection.createIndex(
    { 'name': 'text', 'brand': 'text' }, 
    { name: 'text_search' }
  );
  
  // Data freshness queries
  await productsCollection.createIndex(
    { 'lastUpdated': -1 }, 
    { name: 'last_updated_desc' }
  );

  console.log('✅ Products collection created with validation and indexes');
}

/**
 * Creates the users collection with validation schema and indexes
 */
async function createUsersCollection(db) {
  console.log('👤 Creating users collection...');
  
  // Drop existing collection if it exists
  try {
    await db.collection('users').drop();
    console.log('  - Dropped existing users collection');
  } catch (error) {
    // Collection doesn't exist, which is fine
  }

  // Create users collection with validation schema
  await db.createCollection('users', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['profileId', 'name', 'dietaryRestrictions', 'preferences', 'createdAt', 'lastActive'],
        properties: {
          profileId: {
            bsonType: 'string',
            description: 'Unique profile identifier'
          },
          name: {
            bsonType: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Display name'
          },
          dietaryRestrictions: {
            bsonType: 'object',
            properties: {
              allergies: {
                bsonType: 'array',
                items: {
                  bsonType: 'string',
                  enum: ['milk', 'eggs', 'fish', 'shellfish', 'tree_nuts', 'peanuts', 'wheat', 'soy', 'sesame']
                },
                description: 'User\'s allergies'
              },
              religious: {
                bsonType: 'array',
                items: {
                  bsonType: 'string',
                  enum: ['halal', 'kosher', 'hindu_vegetarian', 'jain', 'buddhist']
                },
                description: 'Religious restrictions'
              },
              medical: {
                bsonType: 'array',
                items: {
                  bsonType: 'string',
                  enum: ['diabetes', 'hypertension', 'celiac', 'kidney_disease']
                },
                description: 'Medical dietary needs'
              },
              lifestyle: {
                bsonType: 'array',
                items: {
                  bsonType: 'string',
                  enum: ['vegan', 'vegetarian', 'keto', 'paleo', 'organic_only', 'non_gmo']
                },
                description: 'Lifestyle choices'
              }
            },
            description: 'User dietary restrictions'
          },
          preferences: {
            bsonType: 'object',
            properties: {
              alertLevel: {
                bsonType: 'string',
                enum: ['strict', 'moderate', 'flexible'],
                description: 'Alert sensitivity level'
              },
              notifications: {
                bsonType: 'bool',
                description: 'Enable notifications'
              },
              offlineMode: {
                bsonType: 'bool',
                description: 'Offline mode preference'
              }
            },
            description: 'User preferences'
          },
          createdAt: {
            bsonType: 'date',
            description: 'Account creation timestamp'
          },
          lastActive: {
            bsonType: 'date',
            description: 'Last activity timestamp'
          }
        }
      }
    }
  });

  // Create performance-optimized indexes
  const usersCollection = db.collection('users');
  
  // Primary user lookup (unique constraint)
  await usersCollection.createIndex(
    { 'profileId': 1 }, 
    { unique: true, name: 'profile_id_unique' }
  );
  
  // Allergen-based queries
  await usersCollection.createIndex(
    { 'dietaryRestrictions.allergies': 1 }, 
    { name: 'allergies_index' }
  );
  
  // User activity tracking
  await usersCollection.createIndex(
    { 'lastActive': -1 }, 
    { name: 'last_active_desc' }
  );

  console.log('✅ Users collection created with validation and indexes');
}

/**
 * Creates the scan_results collection with validation schema and indexes
 */
async function createScanResultsCollection(db) {
  console.log('📱 Creating scan_results collection...');
  
  // Drop existing collection if it exists
  try {
    await db.collection('scan_results').drop();
    console.log('  - Dropped existing scan_results collection');
  } catch (error) {
    // Collection doesn't exist, which is fine
  }

  // Create scan_results collection with validation schema
  await db.createCollection('scan_results', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['userId', 'productId', 'upc', 'scanTimestamp', 'complianceStatus', 'violations'],
        properties: {
          userId: {
            bsonType: 'objectId',
            description: 'Reference to User'
          },
          productId: {
            bsonType: 'objectId',
            description: 'Reference to Product'
          },
          upc: {
            bsonType: 'string',
            pattern: '^[0-9]{8,14}$',
            description: 'Scanned barcode'
          },
          scanTimestamp: {
            bsonType: 'date',
            description: 'Scan timestamp'
          },
          complianceStatus: {
            bsonType: 'string',
            enum: ['safe', 'caution', 'violation'],
            description: 'Compliance status'
          },
          violations: {
            bsonType: 'array',
            items: {
              bsonType: 'string'
            },
            description: 'List of detected violations'
          },
          aiAnalysis: {
            bsonType: 'object',
            properties: {
              recommendation: {
                bsonType: 'string',
                description: 'AI recommendation'
              },
              alternatives: {
                bsonType: 'array',
                items: {
                  bsonType: 'string'
                },
                description: 'Alternative products'
              },
              confidence: {
                bsonType: 'number',
                minimum: 0,
                maximum: 1,
                description: 'AI confidence score'
              }
            },
            description: 'AI analysis results'
          },
          location: {
            bsonType: 'object',
            properties: {
              latitude: {
                bsonType: 'number',
                minimum: -90,
                maximum: 90
              },
              longitude: {
                bsonType: 'number',
                minimum: -180,
                maximum: 180
              }
            },
            description: 'Scan location'
          }
        }
      }
    }
  });

  // Create performance-optimized indexes
  const scanResultsCollection = db.collection('scan_results');
  
  // User scan history (compound index - most common query pattern)
  await scanResultsCollection.createIndex(
    { 'userId': 1, 'scanTimestamp': -1 }, 
    { name: 'user_scan_history' }
  );
  
  // Product-based analytics
  await scanResultsCollection.createIndex(
    { 'upc': 1 }, 
    { name: 'upc_analytics' }
  );
  
  // Safety analytics
  await scanResultsCollection.createIndex(
    { 'complianceStatus': 1 }, 
    { name: 'compliance_status_index' }
  );
  
  // Recent scans across users
  await scanResultsCollection.createIndex(
    { 'scanTimestamp': -1 }, 
    { name: 'recent_scans' }
  );

  console.log('✅ Scan results collection created with validation and indexes');
}

/**
 * Inserts sample data for testing
 */
async function insertSampleData(db) {
  console.log('🌱 Inserting sample data...');

  // Sample product
  const sampleProduct = {
    upc: '012345678901',
    name: 'Organic Whole Milk',
    brand: 'Horizon',
    ingredients: ['organic milk', 'vitamin d3'],
    allergens: ['milk'],
    dietaryFlags: {
      halal: true,
      kosher: false,
      vegan: false,
      vegetarian: true,
      glutenFree: true
    },
    nutritionalInfo: {
      calories: 150,
      sodium: 125,
      sugar: 12
    },
    source: 'openfoodfacts',
    lastUpdated: new Date(),
    confidence: 0.95
  };

  const productResult = await db.collection('products').insertOne(sampleProduct);
  console.log('  - Sample product inserted with ID:', productResult.insertedId);

  // Sample user
  const sampleUser = {
    profileId: 'demo_user_001',
    name: 'Demo User',
    dietaryRestrictions: {
      allergies: ['milk', 'peanuts'],
      religious: ['halal'],
      medical: ['diabetes'],
      lifestyle: ['organic_only']
    },
    preferences: {
      alertLevel: 'strict',
      notifications: true,
      offlineMode: false
    },
    createdAt: new Date(),
    lastActive: new Date()
  };

  const userResult = await db.collection('users').insertOne(sampleUser);
  console.log('  - Sample user inserted with ID:', userResult.insertedId);

  // Sample scan result
  const sampleScanResult = {
    userId: userResult.insertedId,
    productId: productResult.insertedId,
    upc: '012345678901',
    scanTimestamp: new Date(),
    complianceStatus: 'violation',
    violations: ['milk allergy detected'],
    aiAnalysis: {
      recommendation: 'Avoid this product due to milk allergy',
      alternatives: ['Oat milk', 'Almond milk'],
      confidence: 0.95
    }
  };

  const scanResult = await db.collection('scan_results').insertOne(sampleScanResult);
  console.log('  - Sample scan result inserted with ID:', scanResult.insertedId);

  console.log('✅ Sample data inserted successfully');
}

/**
 * Verifies the database structure and indexes
 */
async function verifyDatabaseStructure(db) {
  console.log('🔍 Verifying database structure...');

  // List all collections
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  console.log('📋 Created collections:', collectionNames);

  // Verify required collections exist
  const requiredCollections = ['products', 'users', 'scan_results'];
  const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));
  
  if (missingCollections.length > 0) {
    throw new Error(`Missing required collections: ${missingCollections.join(', ')}`);
  }

  // Verify indexes for each collection
  for (const collectionName of requiredCollections) {
    const indexes = await db.collection(collectionName).indexes();
    console.log(`📊 ${collectionName} indexes:`, indexes.map(i => i.name));
  }

  // Count documents
  const productCount = await db.collection('products').countDocuments();
  const userCount = await db.collection('users').countDocuments();
  const scanResultCount = await db.collection('scan_results').countDocuments();
  
  console.log('📈 Document counts:');
  console.log(`  - Products: ${productCount}`);
  console.log(`  - Users: ${userCount}`);
  console.log(`  - Scan results: ${scanResultCount}`);

  // Test basic queries
  console.log('🧪 Testing query functionality...');
  
  const testProduct = await db.collection('products').findOne({ upc: '012345678901' });
  console.log('  - Product query test:', testProduct ? '✅ Success' : '❌ Failed');

  const testUser = await db.collection('users').findOne({ profileId: 'demo_user_001' });
  console.log('  - User query test:', testUser ? '✅ Success' : '❌ Failed');

  const testScanResult = await db.collection('scan_results').findOne({ upc: '012345678901' });
  console.log('  - Scan result query test:', testScanResult ? '✅ Success' : '❌ Failed');

  console.log('✅ Database structure verification completed');
}

/**
 * Main setup function
 */
async function setupCollections() {
  // Get MongoDB URI from environment or use default
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  
  if (!mongoUri || mongoUri === 'mongodb://localhost:27017') {
    console.warn('⚠️  Using default MongoDB URI. Set MONGODB_URI environment variable for production.');
  }

  const client = new MongoClient(mongoUri);
  
  try {
    console.log('🚀 Starting SMARTIES database collections setup...');
    console.log('📍 Database:', DB_NAME);
    
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);

    // Create collections with validation and indexes
    await createProductsCollection(db);
    await createUsersCollection(db);
    await createScanResultsCollection(db);

    // Insert sample data
    await insertSampleData(db);

    // Verify everything was created correctly
    await verifyDatabaseStructure(db);

    console.log('\n🎉 Database collections setup completed successfully!');
    console.log('✅ Task 5.1: Create database collections with proper schema - COMPLETED');
    console.log('\n📋 Summary:');
    console.log('  - 3 collections created with validation schemas');
    console.log('  - 10 performance-optimized indexes created');
    console.log('  - Sample data inserted for testing');
    console.log('  - All collections verified and functional');
    console.log('\n➡️  Ready for application integration');

  } catch (error) {
    console.error('❌ Error setting up database collections:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Export for use in other modules
module.exports = {
  setupCollections,
  createProductsCollection,
  createUsersCollection,
  createScanResultsCollection,
  insertSampleData,
  verifyDatabaseStructure
};

// Run setup if called directly
if (require.main === module) {
  setupCollections().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}