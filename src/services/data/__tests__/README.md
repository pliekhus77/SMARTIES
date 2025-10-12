# Data Pipeline Integration Tests

This directory contains comprehensive integration tests for Task 3.4 of the data schema and ingestion specification. The tests validate end-to-end processing from raw data to MongoDB with vector embeddings.

## Test Coverage

### 1. DataPipelineIntegration.test.ts
- **End-to-End Processing**: Complete pipeline from raw OpenFoodFacts data to MongoDB storage
- **Embedding Generation**: Integration with Python Hugging Face service
- **Error Handling**: Recovery mechanisms for failed operations
- **Performance Testing**: Scalability and memory management
- **Data Consistency**: Validation across pipeline stages

### 2. EmbeddingServiceIntegration.test.ts
- **Python Service Communication**: Interface with embedding service
- **Batch Processing**: Efficient generation of multiple embeddings
- **Quality Validation**: Dimension and value validation
- **Error Handling**: Service failures and recovery
- **Performance Monitoring**: Throughput and memory usage

### 3. MongoDBVectorSearchIntegration.test.ts
- **UPC Lookup Performance**: Sub-100ms requirement validation
- **Vector Similarity Search**: Semantic product matching
- **Hybrid Search**: Combined exact and similarity search
- **Index Management**: Performance optimization
- **Error Handling**: Database failures and edge cases

## Prerequisites

### Required Software
- Node.js 18+ with TypeScript support
- MongoDB (local) or MongoDB Atlas connection
- Python 3.8+ with required packages:
  ```bash
  pip install sentence-transformers torch numpy pandas
  ```

### Environment Variables
Create a `.env.test` file with:
```bash
# MongoDB connection for testing
MONGODB_TEST_URI=mongodb://localhost:27017

# Python path (optional, defaults to 'python')
PYTHON_PATH=python

# Test configuration
TEST_TIMEOUT=60000
LOG_LEVEL=error
```

### Test Data
The tests use mock data and don't require the full OpenFoodFacts dataset. However, for complete integration testing, you can:

1. Download a sample of OpenFoodFacts data
2. Set up a local MongoDB instance with the data
3. Configure the connection string in environment variables

## Running Tests

### All Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:integration:coverage

# Run with verbose output
npm run test:integration:verbose
```

### Individual Test Suites
```bash
# Data pipeline tests only
npx jest --config jest.integration.config.js DataPipelineIntegration

# Embedding service tests only
npx jest --config jest.integration.config.js EmbeddingServiceIntegration

# MongoDB vector search tests only
npx jest --config jest.integration.config.js MongoDBVectorSearchIntegration
```

### Development Mode
```bash
# Watch mode for development
npm run test:integration:watch

# Debug mode with detailed output
npm run test:integration:debug
```

## Test Configuration

### Jest Configuration
- **File**: `jest.integration.config.js`
- **Timeout**: 60 seconds per test
- **Environment**: Node.js
- **Coverage**: Enabled with thresholds
- **Reporters**: HTML, JUnit, and console

### Test Environment Setup
- **Global Setup**: Database connections and service checks
- **Test Isolation**: Each test gets a clean database state
- **Cleanup**: Automatic cleanup of test data and connections
- **Mocking**: Embedding service mocked for consistent testing

## Test Results and Reporting

### Generated Reports
- **HTML Report**: `coverage/integration/integration-test-report.html`
- **Coverage Report**: `coverage/integration/lcov-report/index.html`
- **JUnit XML**: `coverage/integration/junit.xml`
- **JSON Report**: `test-results/integration/detailed-report.json`
- **Markdown Report**: `test-results/integration/test-report.md`

### Performance Metrics
Tests track and report:
- Memory usage during execution
- Query response times
- Embedding generation throughput
- Database operation performance
- Overall test execution time

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
Error: Cannot proceed with integration tests - MongoDB unavailable
```
**Solution**: 
- Ensure MongoDB is running locally or Atlas connection is configured
- Check `MONGODB_TEST_URI` environment variable
- Verify network connectivity and authentication

#### Python Embedding Service Unavailable
```bash
Warning: Embedding service not available - some tests may be skipped
```
**Solution**:
- Install required Python packages: `pip install sentence-transformers torch`
- Verify Python path: `python --version`
- Check `embedding_service_interface.py` exists in project root

#### Test Timeouts
```bash
Timeout - Async callback was not invoked within the 60000ms timeout
```
**Solution**:
- Increase timeout in `jest.integration.config.js`
- Check for hanging database connections
- Verify embedding service responds promptly

#### Memory Issues
```bash
JavaScript heap out of memory
```
**Solution**:
- Reduce test data size with `TEST_DATA_SIZE` environment variable
- Run tests with increased memory: `node --max-old-space-size=4096`
- Check for memory leaks in test cleanup

### Debug Mode
Enable detailed logging:
```bash
DEBUG=* npm run test:integration
```

### Manual Test Execution
For debugging specific issues:
```bash
# Run integration test runner directly
npx ts-node src/services/data/__tests__/integration-test-runner.ts

# Test MongoDB connection
node test-mongodb-connection.js

# Test embedding service
python embedding_service_interface.py get_model_info '{}'
```

## Performance Benchmarks

### Expected Performance
- **UPC Lookup**: <100ms (99th percentile)
- **Vector Search**: <500ms (95th percentile)
- **Embedding Generation**: >100 embeddings/minute
- **Data Pipeline**: >50 products/minute end-to-end
- **Memory Usage**: <200MB during normal operation

### Performance Testing
```bash
# Run performance-focused tests
npm run test:integration:performance

# Monitor memory usage
npm run test:integration:memory
```

## Continuous Integration

### GitHub Actions
Add to `.github/workflows/integration-tests.yml`:
```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  integration:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: pip install sentence-transformers torch
      - run: npm ci
      - run: npm run test:integration
        env:
          MONGODB_TEST_URI: mongodb://localhost:27017
```

### Quality Gates
- All tests must pass
- Coverage must be >70%
- No memory leaks detected
- Performance benchmarks met

## Contributing

### Adding New Tests
1. Follow existing test patterns and naming conventions
2. Include both happy path and error scenarios
3. Add performance assertions where relevant
4. Update this README with new test descriptions
5. Ensure tests are isolated and don't depend on external state

### Test Data Management
- Use factory functions for creating test data
- Keep test data minimal but representative
- Clean up all test data in teardown
- Use deterministic data for consistent results

### Best Practices
- Test one thing at a time
- Use descriptive test names
- Include performance and memory assertions
- Mock external dependencies appropriately
- Document complex test scenarios
- Maintain test independence