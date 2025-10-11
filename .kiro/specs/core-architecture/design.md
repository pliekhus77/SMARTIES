# Design Document

## Architecture Overview

This document defines the core architecture for the SMARTIES application, establishing the foundational data models, database structure, and React Native project configuration that will support rapid hackathon development.

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
```javascript
// MongoDB Atlas Collections
db.products.createIndex({ "upc": 1 }, { unique: true })
db.products.createIndex({ "allergens": 1 })
db.products.createIndex({ "name": "text", "brand": "text" })

db.users.createIndex({ "profileId": 1 }, { unique: true })
db.users.createIndex({ "dietaryRestrictions.allergies": 1 })

db.scan_results.createIndex({ "userId": 1, "scanTimestamp": -1 })
db.scan_results.createIndex({ "upc": 1 })
db.scan_results.createIndex({ "complianceStatus": 1 })
```

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

### Screen Components Structure
```
src/
├── screens/
│   ├── ScannerScreen.tsx      # Main barcode scanning interface
│   ├── ProfileScreen.tsx      # User dietary profile management
│   ├── HistoryScreen.tsx      # Scan history and analytics
│   ├── SettingsScreen.tsx     # App configuration
│   └── ResultScreen.tsx       # Scan result display
├── components/
│   ├── BarcodeScanner.tsx     # Camera-based scanning component
│   ├── ProductCard.tsx        # Product information display
│   ├── AlertBanner.tsx        # Dietary violation alerts
│   └── ProfileForm.tsx        # User profile editing
├── services/
│   ├── DatabaseService.ts     # MongoDB Atlas integration
│   ├── ScannerService.ts      # Barcode processing logic
│   └── AnalysisService.ts     # Dietary compliance checking
└── types/
    ├── Product.ts             # Product type definitions
    ├── User.ts                # User type definitions
    └── ScanResult.ts          # Scan result type definitions
```

## Environment Configuration

### Development Environment Variables
```bash
# .env.development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smarties_dev
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
API_BASE_URL=http://localhost:3000/api
LOG_LEVEL=debug
OFFLINE_MODE=true
```

### Production Environment Variables
```bash
# .env.production
MONGODB_URI=${MONGODB_ATLAS_URI}
OPENAI_API_KEY=${OPENAI_PROD_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_PROD_KEY}
API_BASE_URL=https://api.smarties.app
LOG_LEVEL=info
OFFLINE_MODE=false
```

## Database Connectivity

### MongoDB Atlas Connection
```typescript
// services/DatabaseService.ts
import { MongoClient, Db } from 'mongodb';

class DatabaseService {
  private client: MongoClient;
  private db: Db;

  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI!);
      await this.client.connect();
      this.db = this.client.db('smarties');
      console.log('Connected to MongoDB Atlas');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Failed to connect to database');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.db.admin().ping();
      return true;
    } catch (error) {
      console.error('Database ping failed:', error);
      return false;
    }
  }

  getCollection(name: string) {
    return this.db.collection(name);
  }
}

export const dbService = new DatabaseService();
```

### React Native Integration
```typescript
// App.tsx - Database initialization
import { dbService } from './services/DatabaseService';

export default function App() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        await dbService.connect();
        const isConnected = await dbService.testConnection();
        if (isConnected) {
          console.log('Database ready for use');
        }
      } catch (error) {
        console.error('Database initialization failed:', error);
        // Fallback to offline mode
      }
    };

    initializeDatabase();
  }, []);

  return (
    // Navigation components...
  );
}
```

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

### Unit Tests
- Test data model validation
- Test database service methods
- Test navigation flow
- Test component rendering

### Integration Tests
- Test database connectivity
- Test API endpoint integration
- Test barcode scanning functionality
- Test offline/online mode switching

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
