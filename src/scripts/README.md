# Database Collections Setup

This directory contains scripts for setting up the MongoDB Atlas database collections for the SMARTIES application.

## Overview

The `setup-collections.js` script creates the three core collections required by the SMARTIES application:

- **products**: Stores product information with UPC codes, ingredients, allergens, and dietary flags
- **users**: Stores user profiles with dietary restrictions and preferences  
- **scan_results**: Stores scan history linking users to products with compliance status

## Usage

### Prerequisites

1. MongoDB Atlas cluster set up and accessible
2. MongoDB connection string available
3. Node.js and npm installed
4. MongoDB driver installed (`npm install mongodb`)

### Running the Setup

#### Option 1: Using npm script (recommended)
```bash
npm run setup:collections
```

#### Option 2: Direct execution
```bash
node src/scripts/setup-collections.js
```

#### Option 3: With custom MongoDB URI
```bash
MONGODB_URI="your-mongodb-connection-string" npm run setup:collections
```

### Environment Variables

- `MONGODB_URI`: MongoDB connection string (defaults to `mongodb://localhost:27017` if not set)

## What the Script Does

### 1. Collection Creation
Creates three collections with comprehensive validation schemas:

#### Products Collection
- **Validation**: UPC format, required fields, allergen enums, confidence scores
- **Indexes**: Unique UPC, allergen filtering, text search, data freshness
- **Purpose**: Fast product lookups and allergen searches

#### Users Collection  
- **Validation**: Profile structure, dietary restrictions, preference enums
- **Indexes**: Unique profile ID, allergen queries, activity tracking
- **Purpose**: Efficient user profile management

#### Scan Results Collection
- **Validation**: User/product relationships, compliance status, violation tracking
- **Indexes**: User scan history, product analytics, compliance filtering
- **Purpose**: Fast scan history retrieval and analytics

### 2. Performance Optimization
- Creates 10 strategic indexes for sub-100ms query performance
- Compound indexes for common query patterns
- Unique constraints for data integrity

### 3. Sample Data
Inserts test data for immediate functionality verification:
- Sample product with allergen information
- Demo user with dietary restrictions
- Example scan result with compliance status

### 4. Verification
- Confirms all collections were created successfully
- Validates index creation
- Tests basic query functionality
- Provides summary statistics

## Schema Details

### Products Schema
```javascript
{
  upc: "string (8-14 digits)",           // Required, unique
  name: "string (1-200 chars)",          // Required
  brand: "string (optional)",
  ingredients: ["array of strings"],      // Required
  allergens: ["FDA Top 9 allergens"],    // Required, enum validated
  dietaryFlags: {                        // Optional
    halal: boolean,
    kosher: boolean,
    vegan: boolean,
    vegetarian: boolean,
    glutenFree: boolean
  },
  nutritionalInfo: {                     // Optional
    calories: number,
    sodium: number,
    sugar: number
  },
  imageUrl: "string (optional)",
  source: "enum: manual|openfoodfacts|usda", // Required
  lastUpdated: "date",                   // Required
  confidence: "number (0-1)"             // Required
}
```

### Users Schema
```javascript
{
  profileId: "string",                   // Required, unique
  name: "string (1-100 chars)",          // Required
  dietaryRestrictions: {                 // Required
    allergies: ["FDA Top 9 allergens"],
    religious: ["halal", "kosher", etc.],
    medical: ["diabetes", "hypertension", etc.],
    lifestyle: ["vegan", "vegetarian", etc.]
  },
  preferences: {                         // Required
    alertLevel: "strict|moderate|flexible",
    notifications: boolean,
    offlineMode: boolean
  },
  createdAt: "date",                     // Required
  lastActive: "date"                     // Required
}
```

### Scan Results Schema
```javascript
{
  userId: "ObjectId",                    // Required, references users
  productId: "ObjectId",                 // Required, references products
  upc: "string (8-14 digits)",           // Required
  scanTimestamp: "date",                 // Required
  complianceStatus: "safe|caution|violation", // Required
  violations: ["array of strings"],      // Required
  aiAnalysis: {                          // Optional
    recommendation: "string",
    alternatives: ["array of strings"],
    confidence: "number (0-1)"
  },
  location: {                            // Optional
    latitude: "number (-90 to 90)",
    longitude: "number (-180 to 180)"
  }
}
```

## Index Strategy

### Performance-Optimized Indexes

#### Products Collection
- `upc_unique`: Unique index on UPC for primary lookups
- `allergens_index`: Multi-key index for allergen filtering
- `text_search`: Text index on name and brand for search
- `last_updated_desc`: Descending index for data freshness

#### Users Collection
- `profile_id_unique`: Unique index on profileId for user lookups
- `allergies_index`: Multi-key index on dietary restrictions
- `last_active_desc`: Descending index for activity tracking

#### Scan Results Collection
- `user_scan_history`: Compound index (userId + scanTimestamp) for user history
- `upc_analytics`: Index on UPC for product-based analytics
- `compliance_status_index`: Index on compliance status for safety queries
- `recent_scans`: Descending index on timestamp for recent scans

## Testing

### Unit Tests
```bash
npm test -- --testPathPattern=collections.test.ts
```

### Integration Tests
```bash
npm test -- --testPathPattern=database-setup.integration.test.ts
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify MongoDB URI is correct
   - Check network connectivity to MongoDB Atlas
   - Ensure IP address is whitelisted in Atlas

2. **Permission Denied**
   - Verify database user has read/write permissions
   - Check that user can create collections and indexes

3. **Validation Errors**
   - Review schema validation rules
   - Ensure sample data matches schema requirements

4. **Index Creation Failed**
   - Check for existing conflicting indexes
   - Verify sufficient storage space
   - Review index naming conflicts

### Debug Mode
Set environment variable for verbose logging:
```bash
DEBUG=true npm run setup:collections
```

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 2.1**: Creates products, users, and scan_results collections in MongoDB Atlas
- **Design Document**: Implements exact data models specified in the architecture design
- **Performance**: Creates indexes for sub-100ms query response times
- **Data Integrity**: Enforces validation rules and proper field types
- **Relationships**: Supports efficient queries across all models

## Next Steps

After running this setup:

1. Verify collections in MongoDB Atlas console
2. Test basic CRUD operations using the DatabaseService
3. Run performance tests to validate sub-100ms response times
4. Integrate with React Native application
5. Set up data synchronization and offline support