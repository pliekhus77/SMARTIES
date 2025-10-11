# Design Document

## Architecture Overview

This document defines the core architecture for the SMARTIES application, establishing the foundational data models, database structure, React Native project configuration, and basic connectivity that will support rapid hackathon development. The architecture is designed to meet the specific requirements for efficient data storage, fast queries, secure configuration management, and reliable database connectivity from the mobile application.

### Design Rationale

The architecture follows these key principles:
- **Performance-First**: All data models include proper indexing strategies to achieve sub-100ms query response times
- **Security-by-Design**: Environment variables and secrets management prevent credential exposure
- **Offline-Ready**: Data models support local caching and synchronization patterns
- **Type Safety**: TypeScript throughout the stack ensures compile-time validation and better developer experience

## Data Models

### Product Model
```typescript
interface Product {
  _id: ObjectId;
  upc: string;                    // Unique product identifier
  name: string;                   // Product display name
  brand?: string;                 // Manufacturer/brand name
  ingredients: string[];          // List of ingredients
  allergens: string[];           // Detected allergens (milk, eggs, nuts, etc.)
  dietaryFlags: {                // Religious/lifestyle compliance
    halal?: boolean;
    kosher?: boolean;
    vegan?: boolean;
    vegetarian?: boolean;
    glutenFree?: boolean;
  };
  nutritionalInfo?: {            // Basic nutrition data
    calories?: number;
    sodium?: number;
    sugar?: number;
  };
  imageUrl?: string;             // Product image URL
  source: 'manual' | 'openfoodfacts' | 'usda';
  lastUpdated: Date;
  confidence: number;            // Data quality score (0-1)
}
```

### User Model
```typescript
interface User {
  _id: ObjectId;
  profileId: string;             // Unique profile identifier
  name: string;                  // Display name
  dietaryRestrictions: {
    allergies: string[];         // User's allergies
    religious: string[];         // Religious restrictions
    medical: string[];           // Medical dietary needs
    lifestyle: string[];         // Lifestyle choices (vegan, keto, etc.)
  };
  preferences: {
    alertLevel: 'strict' | 'moderate' | 'flexible';
    notifications: boolean;
    offlineMode: boolean;
  };
  createdAt: Date;
  lastActive: Date;
}
```

### ScanResult Model
```typescript
interface ScanResult {
  _id: ObjectId;
  userId: ObjectId;              // Reference to User
  productId: ObjectId;           // Reference to Product
  upc: string;                   // Scanned barcode
  scanTimestamp: Date;
  complianceStatus: 'safe' | 'caution' | 'violation';
  violations: string[];          // List of detected violations
  aiAnalysis?: {
    recommendation: string;
    alternatives: string[];
    confidence: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}
```

## Database Schema

### Collections Structure

The database design includes three core collections with strategic indexing to meet the sub-100ms query performance requirement:

```javascript
// MongoDB Atlas Collections with Performance-Optimized Indexes

// Products Collection - Optimized for UPC lookups and allergen searches
db.products.createIndex({ "upc": 1 }, { unique: true })           // Primary lookup by barcode
db.products.createIndex({ "allergens": 1 })                      // Fast allergen filtering
db.products.createIndex({ "name": "text", "brand": "text" })     // Text search capability
db.products.createIndex({ "lastUpdated": -1 })                   // Data freshness queries

// Users Collection - Optimized for profile retrieval and dietary restriction queries
db.users.createIndex({ "profileId": 1 }, { unique: true })       // Primary user lookup
db.users.createIndex({ "dietaryRestrictions.allergies": 1 })     // Allergen-based queries
db.users.createIndex({ "lastActive": -1 })                       // User activity tracking

// Scan Results Collection - Optimized for user history and analytics
db.scan_results.createIndex({ "userId": 1, "scanTimestamp": -1 }) // User scan history (compound)
db.scan_results.createIndex({ "upc": 1 })                        // Product-based analytics
db.scan_results.createIndex({ "complianceStatus": 1 })           // Safety analytics
db.scan_results.createIndex({ "scanTimestamp": -1 })             // Recent scans across users
```

**Index Design Rationale:**
- Compound indexes on `userId + scanTimestamp` optimize the most common query pattern (user's recent scans)
- Unique constraints on `upc` and `profileId` ensure data integrity
- Text indexes enable search functionality for product discovery
- Separate indexes on frequently filtered fields (allergens, compliance status) support analytics queries

### Sample Data Structure
```javascript
// Sample Product Document
{
  "_id": ObjectId("..."),
  "upc": "012345678901",
  "name": "Organic Whole Milk",
  "brand": "Horizon",
  "ingredients": ["organic milk", "vitamin d3"],
  "allergens": ["milk"],
  "dietaryFlags": {
    "halal": true,
    "kosher": false,
    "vegan": false,
    "vegetarian": true,
    "glutenFree": true
  },
  "source": "openfoodfacts",
  "lastUpdated": ISODate("2025-01-10T12:00:00Z"),
  "confidence": 0.95
}
```

## React Native Project Structure

### Navigation Architecture
```typescript
// App.tsx - Main navigation setup
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Scanner" component={ScannerScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

### React Native Project Structure

The project structure is organized to support the required screens and navigation patterns while maintaining type safety throughout:

```
src/
├── screens/                   # Core application screens (Requirement 3)
│   ├── ScannerScreen.tsx      # Main barcode scanning interface
│   ├── ProfileScreen.tsx      # User dietary profile management  
│   ├── ResultScreen.tsx       # Scan result display
│   └── SettingsScreen.tsx     # App configuration
├── components/                # Reusable UI components
│   ├── BarcodeScanner.tsx     # Camera-based scanning component
│   ├── ProductCard.tsx        # Product information display
│   ├── AlertBanner.tsx        # Dietary violation alerts
│   └── ProfileForm.tsx        # User profile editing
├── services/                  # Business logic and external integrations
│   ├── DatabaseService.ts     # MongoDB Atlas integration (Requirement 5)
│   ├── ScannerService.ts      # Barcode processing logic
│   ├── AnalysisService.ts     # Dietary compliance checking
│   └── ConfigService.ts       # Environment configuration management
├── types/                     # TypeScript type definitions (Requirement 3)
│   ├── Product.ts             # Product model types
│   ├── User.ts                # User model types
│   ├── ScanResult.ts          # Scan result types
│   └── Config.ts              # Configuration types
├── config/                    # Configuration and environment setup
│   ├── database.ts            # Database connection configuration
│   ├── environment.ts         # Environment variable management
│   └── navigation.ts          # Navigation configuration
└── utils/                     # Utility functions and helpers
    ├── validation.ts          # Data validation utilities
    ├── encryption.ts          # Security utilities
    └── offline.ts             # Offline handling utilities
```

**Structure Design Rationale:**
- **Screen-based organization** aligns with the required navigation structure (Scanner, Profile, Results, Settings)
- **Service layer separation** enables testable business logic and clean architecture
- **Type-first approach** with dedicated types directory ensures TypeScript compliance
- **Configuration isolation** supports secure environment variable management

## Environment Configuration & Secrets Management

The configuration system addresses Requirement 4 by implementing secure environment variable management across different deployment environments.

### Environment Structure

```bash
# .env.development - Development environment settings
MONGODB_URI=mongodb+srv://dev-user:${DEV_PASSWORD}@cluster.mongodb.net/smarties_dev
OPENAI_API_KEY=${OPENAI_DEV_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_DEV_KEY}
API_BASE_URL=http://localhost:3000/api
LOG_LEVEL=debug
OFFLINE_MODE=true
ENABLE_DEBUG_TOOLS=true

# .env.staging - Staging environment settings  
MONGODB_URI=mongodb+srv://staging-user:${STAGING_PASSWORD}@cluster.mongodb.net/smarties_staging
OPENAI_API_KEY=${OPENAI_STAGING_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_STAGING_KEY}
API_BASE_URL=https://staging-api.smarties.app
LOG_LEVEL=info
OFFLINE_MODE=false
ENABLE_DEBUG_TOOLS=false

# .env.production - Production environment settings
MONGODB_URI=${MONGODB_ATLAS_URI}
OPENAI_API_KEY=${OPENAI_PROD_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_PROD_KEY}
API_BASE_URL=https://api.smarties.app
LOG_LEVEL=warn
OFFLINE_MODE=false
ENABLE_DEBUG_TOOLS=false
```

### Secrets Management Strategy

**Security Design Rationale:**
- **Environment Variable Substitution**: Actual secrets are injected at runtime, never stored in files
- **Layered Configuration**: Base settings in .env files, secrets from secure storage
- **Development Safety**: Development keys are separate from production to prevent accidental exposure
- **Build-time Validation**: Configuration validation ensures all required variables are present

### Configuration Service Implementation

```typescript
// config/environment.ts - Type-safe configuration management
export interface AppConfig {
  mongodb: {
    uri: string;
    database: string;
    connectionTimeout: number;
  };
  ai: {
    openaiKey: string;
    anthropicKey: string;
    timeout: number;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  app: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    offlineMode: boolean;
    enableDebugTools: boolean;
  };
}

// Validates all required environment variables are present
export const validateConfig = (config: Partial<AppConfig>): AppConfig => {
  const requiredFields = [
    'mongodb.uri', 'ai.openaiKey', 'ai.anthropicKey', 'api.baseUrl'
  ];
  
  for (const field of requiredFields) {
    if (!getNestedValue(config, field)) {
      throw new Error(`Missing required configuration: ${field}`);
    }
  }
  
  return config as AppConfig;
};
```

## Database Connectivity

### MongoDB Atlas Connection & CRUD Operations

The database service implements Requirement 5 by providing reliable connectivity with comprehensive error handling and offline fallback capabilities.

```typescript
// services/DatabaseService.ts - Enhanced with error handling and CRUD operations
import { MongoClient, Db, Collection } from 'mongodb';
import { AppConfig } from '../config/environment';

export class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connectionRetries = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(private config: AppConfig) {}

  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(this.config.mongodb.uri, {
        connectTimeoutMS: this.config.mongodb.connectionTimeout,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
        retryWrites: true,
      });
      
      await this.client.connect();
      this.db = this.client.db('smarties');
      
      // Verify connection with ping
      await this.testConnection();
      console.log('Successfully connected to MongoDB Atlas');
      this.connectionRetries = 0;
      
    } catch (error) {
      console.error('Database connection failed:', error);
      await this.handleConnectionFailure(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.db) throw new Error('Database not initialized');
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('Database ping failed:', error);
      return false;
    }
  }

  // CRUD Operations Implementation (Requirement 5)
  async create<T>(collectionName: string, document: T): Promise<T & { _id: string }> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.insertOne(document);
      return { ...document, _id: result.insertedId.toString() } as T & { _id: string };
    } catch (error) {
      console.error(`Create operation failed for ${collectionName}:`, error);
      throw new DatabaseError(`Failed to create document in ${collectionName}`, error);
    }
  }

  async read<T>(collectionName: string, query: object): Promise<T[]> {
    try {
      const collection = this.getCollection(collectionName);
      const documents = await collection.find(query).toArray();
      return documents as T[];
    } catch (error) {
      console.error(`Read operation failed for ${collectionName}:`, error);
      throw new DatabaseError(`Failed to read from ${collectionName}`, error);
    }
  }

  async update<T>(collectionName: string, query: object, update: object): Promise<boolean> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.updateOne(query, { $set: update });
      return result.modifiedCount > 0;
    } catch (error) {
      console.error(`Update operation failed for ${collectionName}:`, error);
      throw new DatabaseError(`Failed to update document in ${collectionName}`, error);
    }
  }

  async delete(collectionName: string, query: object): Promise<boolean> {
    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.deleteOne(query);
      return result.deletedCount > 0;
    } catch (error) {
      console.error(`Delete operation failed for ${collectionName}:`, error);
      throw new DatabaseError(`Failed to delete document from ${collectionName}`, error);
    }
  }

  private async handleConnectionFailure(error: any): Promise<void> {
    this.connectionRetries++;
    
    if (this.connectionRetries <= this.maxRetries) {
      console.log(`Retrying connection (${this.connectionRetries}/${this.maxRetries}) in ${this.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      await this.connect();
    } else {
      throw new DatabaseError('Max connection retries exceeded', error);
    }
  }

  getCollection(name: string): Collection {
    if (!this.db) {
      throw new DatabaseError('Database not connected');
    }
    return this.db.collection(name);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}

// Custom error class for database operations
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const dbService = new DatabaseService(appConfig);
```

**Connection Design Rationale:**
- **Retry Logic**: Automatic reconnection with exponential backoff handles temporary network issues
- **Connection Pooling**: Optimized for mobile app usage patterns with appropriate pool size
- **Timeout Configuration**: Prevents hanging connections that would block the UI
- **CRUD Abstraction**: Provides type-safe database operations with consistent error handling

### React Native Integration with Navigation

The main application component integrates database connectivity with the required navigation structure:

```typescript
// App.tsx - Complete application setup with navigation and database
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { dbService, DatabaseError } from './services/DatabaseService';
import { validateConfig } from './config/environment';

// Screen imports (Requirement 3)
import ScannerScreen from './screens/ScannerScreen';
import ProfileScreen from './screens/ProfileScreen';
import ResultScreen from './screens/ResultScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigator for scan flow
function ScanStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
    </Stack.Navigator>
  );
}

// Main tab navigator (Requirement 3)
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="Scan" 
        component={ScanStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Validate configuration (Requirement 4)
        const config = validateConfig(process.env);
        
        // Initialize database connection (Requirement 5)
        await dbService.connect();
        const isConnected = await dbService.testConnection();
        
        if (isConnected) {
          console.log('Database ready for use');
          setIsDbReady(true);
        } else {
          throw new DatabaseError('Connection test failed');
        }
        
      } catch (error) {
        console.error('App initialization failed:', error);
        
        // Graceful fallback to offline mode (Requirement 5)
        console.log('Falling back to offline mode');
        setIsOfflineMode(true);
        setIsDbReady(true); // Allow app to continue in offline mode
      }
    };

    initializeApp();
    
    // Cleanup on app unmount
    return () => {
      dbService.disconnect();
    };
  }, []);

  // Show loading screen while initializing
  if (!isDbReady) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <MainTabs />
      {isOfflineMode && <OfflineBanner />}
    </NavigationContainer>
  );
}

// Loading component for initialization
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Initializing SMARTIES...</Text>
    </View>
  );
}

// Offline mode indicator
function OfflineBanner() {
  return (
    <View style={{ backgroundColor: 'orange', padding: 8 }}>
      <Text style={{ textAlign: 'center', color: 'white' }}>
        Offline Mode - Limited functionality available
      </Text>
    </View>
  );
}
```

**Integration Design Rationale:**
- **Navigation Structure**: Tab navigator with nested stack supports the required screen flow
- **Initialization Sequence**: Configuration validation before database connection ensures security
- **Offline Fallback**: Graceful degradation when database connection fails
- **Deep Linking Ready**: Navigation structure supports future deep linking requirements

## Security Considerations

### Secrets Management
- Use React Native Config for environment variables
- Store sensitive credentials in device keychain
- Implement certificate pinning for API calls
- Use MongoDB connection string with restricted permissions

### Data Protection
- Encrypt local storage using react-native-keychain
- Implement proper authentication for user data
- Use HTTPS for all API communications
- Validate all inputs before database operations

## Performance Optimization

### Database Optimization
- Use appropriate indexes for common queries
- Implement connection pooling
- Cache frequently accessed data locally
- Use aggregation pipelines for complex queries

### Mobile App Optimization
- Implement lazy loading for screens
- Use React Native's built-in performance monitoring
- Optimize image loading and caching
- Minimize bundle size with code splitting

## Testing Strategy

The testing approach ensures all requirements are validated through comprehensive test coverage:

### Unit Tests
- **Data Model Validation** (Requirement 1): Test TypeScript interfaces and validation logic
- **Database Service Methods** (Requirement 5): Test CRUD operations with mocked connections
- **Navigation Flow** (Requirement 3): Test screen transitions and deep linking
- **Component Rendering** (Requirement 3): Test TypeScript components render correctly
- **Configuration Management** (Requirement 4): Test environment variable validation and secrets handling

### Integration Tests  
- **Database Connectivity** (Requirement 5): Test actual MongoDB Atlas connection and operations
- **Performance Validation** (Requirement 2): Verify sub-100ms query response times with real indexes
- **Cross-Platform Building** (Requirement 3): Test iOS and Android simulator builds
- **Environment Configuration** (Requirement 4): Test different environment configurations load correctly
- **Offline/Online Mode Switching** (Requirement 5): Test graceful fallback behavior

### Test Data Strategy
- **Mock Data Sets**: Realistic product, user, and scan result data for testing
- **Performance Test Data**: Large datasets to validate index performance
- **Error Scenarios**: Network failures, invalid data, missing configurations
- **Security Test Cases**: Attempt to access secrets, validate encryption

## Deployment Considerations

### Development Deployment
- Use MongoDB Atlas free tier
- Deploy to local simulators
- Use development API keys with rate limits
- Enable debug logging and error reporting

### Production Deployment
- Scale MongoDB Atlas cluster appropriately
- Use production API keys with higher limits
- Implement proper error handling and logging
- Set up monitoring and alerting
