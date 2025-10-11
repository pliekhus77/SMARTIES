# MongoDB Atlas Database Service

This service provides a TypeScript interface for connecting to MongoDB Atlas and performing CRUD operations for the SMARTIES application.

## Features

- **Connection Management**: Automatic connection with retry logic and error handling
- **Offline Support**: Local caching with automatic sync when connection is restored
- **Type Safety**: Full TypeScript support with proper data models
- **Repository Pattern**: Clean separation of concerns with repository implementations
- **Error Handling**: Comprehensive error handling with specific error types

## Quick Start

### 1. Initialize Database Connection

```typescript
import { initializeDatabase, getDatabaseService } from './services/atlas';

// Initialize the database connection
await initializeDatabase();

// Get the database service instance
const dbService = getDatabaseService();
```

### 2. Use Repository Pattern

```typescript
import { ProductRepository, UserRepository, ScanHistoryRepository } from './services/atlas';

const dbService = getDatabaseService();

// Create repository instances
const productRepo = new ProductRepository(dbService);
const userRepo = new UserRepository(dbService);
const scanHistoryRepo = new ScanHistoryRepository(dbService);

// Use repositories for data operations
const product = await productRepo.findByUPC('123456789012');
const userProfile = await userRepo.findByUserId('user-123');
const scanHistory = await scanHistoryRepo.findByUserId('user-123', 10);
```

## Configuration

The database service requires the following environment variables:

```env
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net
MONGODB_DATABASE_NAME=smarties_db
MONGODB_DATA_API_KEY=your-data-api-key
DB_RETRY_ATTEMPTS=3
DB_RETRY_DELAY=1000
DB_TIMEOUT=10000
```

## Data Models

The service works with three main data models:

### Product
- UPC code, name, brand, ingredients
- Allergen information and dietary flags
- Nutritional information and confidence scores

### UserProfile
- User ID and dietary restrictions
- Preferences and settings
- Profile metadata and activity tracking

### ScanHistory
- Scan results and compliance information
- Product information and timestamps
- Location data and scan performance metrics

## Offline Support

The service automatically handles offline scenarios:

- **Caching**: Recent data is cached locally using AsyncStorage
- **Sync Queue**: Operations performed offline are queued for sync
- **Automatic Sync**: When connection is restored, queued operations are synced
- **Fallback**: Read operations fall back to cached data when offline

## Error Handling

The service provides specific error types:

```typescript
try {
  const product = await productRepo.findByUPC('123456789012');
} catch (error) {
  if (error.isNetworkError) {
    // Handle network connectivity issues
  } else if (error.isAuthError) {
    // Handle authentication/authorization issues
  } else {
    // Handle other database errors
  }
}
```

## Testing

Run the test suite:

```bash
npm test -- src/services/atlas/__tests__/database.test.ts
```

## Architecture

The service uses MongoDB Data API for React Native compatibility:

1. **Connection**: Uses HTTP requests instead of native MongoDB driver
2. **Authentication**: API key-based authentication
3. **Operations**: RESTful API calls for CRUD operations
4. **Caching**: AsyncStorage for offline data persistence

## Performance Considerations

- **Connection Pooling**: Managed by MongoDB Atlas Data API
- **Retry Logic**: Exponential backoff for failed operations
- **Timeout Handling**: Configurable timeouts for all operations
- **Batch Operations**: Support for multiple operations (where applicable)

## Security

- **API Keys**: Stored securely in environment variables
- **Data Encryption**: All data transmitted over HTTPS
- **Local Storage**: Sensitive data encrypted in AsyncStorage
- **Access Control**: MongoDB Atlas handles authentication and authorization

## Monitoring

The service provides comprehensive logging:

- Connection status and retry attempts
- Operation success/failure with timing
- Cache hits and sync operations
- Error details with classification

## Examples

See `examples/usage.ts` for comprehensive usage examples including:

- Basic CRUD operations
- Offline handling scenarios
- Error handling strategies
- Batch operations
- Performance optimization techniques