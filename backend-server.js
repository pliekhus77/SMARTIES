/**
 * SMARTIES Backend API Server
 * Connects React Native app to MongoDB Atlas
 */

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db = null;
let client = null;

async function connectToMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DATABASE;

    if (!uri || !dbName) {
      throw new Error('MongoDB URI or database name not configured');
    }

    console.log('Connecting to MongoDB Atlas...');
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB Atlas successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({
        status: 'unhealthy',
        database: 'disconnected',
        message: 'Database not connected'
      });
    }

    // Ping the database
    await db.admin().ping();
    res.json({
      status: 'healthy',
      database: 'connected',
      message: 'Backend API and MongoDB are healthy'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'error',
      message: error.message
    });
  }
});

// Generic CRUD endpoints for any collection
app.post('/api/:collection/findOne', async (req, res) => {
  try {
    const { collection } = req.params;
    const { query } = req.body;
    
    const result = await db.collection(collection).findOne(query);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/:collection/find', async (req, res) => {
  try {
    const { collection } = req.params;
    const { query, limit } = req.body;
    
    let cursor = db.collection(collection).find(query || {});
    if (limit) {
      cursor = cursor.limit(limit);
    }
    
    const results = await cursor.toArray();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const data = req.body;
    
    const result = await db.collection(collection).insertOne(data);
    res.json({ 
      success: true, 
      data: { ...data, _id: result.insertedId } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/:collection/update', async (req, res) => {
  try {
    const { collection } = req.params;
    const { query, data } = req.body;
    
    const result = await db.collection(collection).findOneAndUpdate(
      query,
      { $set: data },
      { returnDocument: 'after' }
    );
    
    res.json({ success: true, data: result.value });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/:collection/delete', async (req, res) => {
  try {
    const { collection } = req.params;
    const { query } = req.body;
    
    const result = await db.collection(collection).deleteOne(query);
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Specific endpoints for SMARTIES functionality
app.get('/api/products/:upc', async (req, res) => {
  try {
    const { upc } = req.params;
    const product = await db.collection('products').findOne({ upc });
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/scan-results', async (req, res) => {
  try {
    const scanData = {
      ...req.body,
      scanTimestamp: new Date(),
      _id: undefined // Let MongoDB generate the ID
    };
    
    const result = await db.collection('scan_results').insertOne(scanData);
    res.json({ 
      success: true, 
      data: { ...scanData, _id: result.insertedId } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
async function startServer() {
  await connectToMongoDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 SMARTIES Backend API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
  process.exit(0);
});

startServer().catch(console.error);