// MongoDB Atlas Connection Test for SMARTIES Project
// Connection String: mongodb+srv://patrickliekhus77_db_user:S6eB9VEEw7B3Fw4q@cluster0.31pwc7s.mongodb.net/

// Use the smarties_db database
use('smarties_db');

// Test 1: Check if we can connect and list collections
console.log("Testing MongoDB Atlas connection...");

// Test 2: Create a test document to verify write permissions
db.connection_test.insertOne({
  test: "SMARTIES MongoDB Atlas Setup",
  timestamp: new Date(),
  status: "connected",
  cluster: "cluster0",
  user: "patrickliekhus77_db_user"
});

console.log("✅ Test document inserted successfully");

// Test 3: Read the test document back
const testDoc = db.connection_test.findOne({ test: "SMARTIES MongoDB Atlas Setup" });
console.log("✅ Test document retrieved:", testDoc);

// Test 4: List all collections in the database
const collections = db.runCommand("listCollections").cursor.firstBatch;
console.log("📋 Available collections:", collections.map(c => c.name));

// Test 5: Get database stats
const stats = db.runCommand("dbStats");
console.log("📊 Database stats:", {
  collections: stats.collections,
  objects: stats.objects,
  dataSize: stats.dataSize,
  storageSize: stats.storageSize
});

// Clean up test data
db.connection_test.deleteMany({ test: "SMARTIES MongoDB Atlas Setup" });
console.log("🧹 Test data cleaned up");

console.log("🎉 MongoDB Atlas connection test completed successfully!");
console.log("Ready for Task 2.2: Configure database structure");