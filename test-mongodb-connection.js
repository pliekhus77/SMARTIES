#!/usr/bin/env node

/**
 * MongoDB Atlas Connection Test Script
 * Tests network access and authentication for SMARTIES application
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testMongoDBConnection() {
  log('\n🔍 MongoDB Atlas Connection Test Starting...', colors.bold);
  log('=' .repeat(50), colors.blue);

  // Check environment variables
  const uri = process.env.MONGODB_URI;
  const database = process.env.MONGODB_DATABASE || 'smarties_db';

  if (!uri) {
    log('❌ MONGODB_URI environment variable not found', colors.red);
    log('💡 Please create a .env file with your MongoDB connection string', colors.yellow);
    process.exit(1);
  }

  // Mask password in URI for logging
  const maskedUri = uri.replace(/:([^:@]+)@/, ':***@');
  log(`📡 Connection URI: ${maskedUri}`, colors.blue);
  log(`🗄️  Database: ${database}`, colors.blue);

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    retryWrites: true,
  });

  try {
    // Test 1: Basic Connection
    log('\n1️⃣ Testing basic connection...', colors.yellow);
    await client.connect();
    log('✅ Successfully connected to MongoDB Atlas', colors.green);

    // Test 2: Database Access
    log('\n2️⃣ Testing database access...', colors.yellow);
    const db = client.db(database);
    const collections = await db.listCollections().toArray();
    log(`✅ Database access verified - Found ${collections.length} collections`, colors.green);
    
    if (collections.length > 0) {
      log('📁 Available collections:', colors.blue);
      collections.forEach(collection => {
        log(`   - ${collection.name}`, colors.blue);
      });
    }

    // Test 3: Read Permissions
    log('\n3️⃣ Testing read permissions...', colors.yellow);
    const productsCollection = db.collection('products');
    const productCount = await productsCollection.countDocuments();
    log(`✅ Read permissions verified - Found ${productCount} products`, colors.green);

    // Test 4: Write Permissions
    log('\n4️⃣ Testing write permissions...', colors.yellow);
    const testCollection = db.collection('connection_test');
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Connection test successful',
      version: '1.0.0'
    };
    
    const insertResult = await testCollection.insertOne(testDoc);
    log(`✅ Write permissions verified - Document inserted with ID: ${insertResult.insertedId}`, colors.green);

    // Test 5: Update Permissions
    log('\n5️⃣ Testing update permissions...', colors.yellow);
    const updateResult = await testCollection.updateOne(
      { _id: insertResult.insertedId },
      { $set: { updated: true, updatedAt: new Date() } }
    );
    log(`✅ Update permissions verified - Modified ${updateResult.modifiedCount} document`, colors.green);

    // Test 6: Delete Permissions
    log('\n6️⃣ Testing delete permissions...', colors.yellow);
    const deleteResult = await testCollection.deleteOne({ _id: insertResult.insertedId });
    log(`✅ Delete permissions verified - Removed ${deleteResult.deletedCount} document`, colors.green);

    // Test 7: Index Operations
    log('\n7️⃣ Testing index operations...', colors.yellow);
    const indexes = await productsCollection.listIndexes().toArray();
    log(`✅ Index access verified - Found ${indexes.length} indexes on products collection`, colors.green);

    // Test 8: Aggregation Pipeline
    log('\n8️⃣ Testing aggregation pipeline...', colors.yellow);
    const pipeline = [
      { $group: { _id: null, count: { $sum: 1 } } }
    ];
    const aggregationResult = await productsCollection.aggregate(pipeline).toArray();
    log('✅ Aggregation pipeline verified', colors.green);

    // Connection Health Summary
    log('\n' + '=' .repeat(50), colors.blue);
    log('🎉 All connection tests passed successfully!', colors.bold + colors.green);
    log('\n📊 Connection Summary:', colors.bold);
    log(`   • Database: ${database}`, colors.blue);
    log(`   • Collections: ${collections.length}`, colors.blue);
    log(`   • Products: ${productCount}`, colors.blue);
    log(`   • Indexes: ${indexes.length}`, colors.blue);
    log(`   • Connection Pool: ${client.options.maxPoolSize}`, colors.blue);
    log(`   • Timeout: ${client.options.serverSelectionTimeoutMS}ms`, colors.blue);

  } catch (error) {
    log('\n❌ Connection test failed:', colors.red);
    log(`Error: ${error.message}`, colors.red);
    
    // Provide troubleshooting guidance
    log('\n🔧 Troubleshooting Tips:', colors.yellow);
    
    if (error.message.includes('Authentication failed')) {
      log('   • Check username and password in connection string', colors.yellow);
      log('   • Verify database user exists and has proper roles', colors.yellow);
    }
    
    if (error.message.includes('connection timed out')) {
      log('   • Check network access rules in MongoDB Atlas', colors.yellow);
      log('   • Verify your IP address is whitelisted', colors.yellow);
      log('   • Check firewall settings', colors.yellow);
    }
    
    if (error.message.includes('Invalid connection string')) {
      log('   • Verify MONGODB_URI format', colors.yellow);
      log('   • Check for special characters in password', colors.yellow);
      log('   • Ensure proper URL encoding', colors.yellow);
    }

    process.exit(1);
  } finally {
    await client.close();
    log('\n📤 Connection closed', colors.blue);
  }
}

// Performance monitoring
async function performanceTest() {
  log('\n⚡ Performance Test Starting...', colors.bold);
  
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  
  try {
    const startTime = Date.now();
    await client.connect();
    const connectionTime = Date.now() - startTime;
    
    const db = client.db('smarties_db');
    const collection = db.collection('products');
    
    // Test query performance
    const queryStart = Date.now();
    await collection.findOne({});
    const queryTime = Date.now() - queryStart;
    
    log(`⏱️  Connection Time: ${connectionTime}ms`, colors.blue);
    log(`⏱️  Query Time: ${queryTime}ms`, colors.blue);
    
    if (connectionTime < 1000) {
      log('✅ Connection performance: Excellent', colors.green);
    } else if (connectionTime < 3000) {
      log('⚠️  Connection performance: Good', colors.yellow);
    } else {
      log('❌ Connection performance: Slow', colors.red);
    }
    
  } catch (error) {
    log(`❌ Performance test failed: ${error.message}`, colors.red);
  } finally {
    await client.close();
  }
}

// Main execution
async function main() {
  try {
    await testMongoDBConnection();
    await performanceTest();
    
    log('\n🎯 Next Steps:', colors.bold);
    log('   1. Configure AI service accounts (Task 2.4)', colors.blue);
    log('   2. Test cloud service integrations (Task 2.5)', colors.blue);
    log('   3. Initialize React Native project (Task 3.1)', colors.blue);
    
  } catch (error) {
    log(`\n💥 Unexpected error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n\n👋 Connection test interrupted', colors.yellow);
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  log('\n💥 Unhandled Rejection:', colors.red);
  log(reason, colors.red);
  process.exit(1);
});

// Run the test
main();