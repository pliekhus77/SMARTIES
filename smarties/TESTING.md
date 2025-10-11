# SMARTIES Testing Guide

This document describes the automated testing infrastructure implemented for the SMARTIES hackathon project.

## Overview

The testing infrastructure includes:
- **Unit Tests**: Fast, isolated tests for individual components and services
- **Integration Tests**: Tests that verify cloud service integrations (MongoDB Atlas, OpenAI, Anthropic)
- **End-to-End Tests**: Complete workflow tests from barcode scan to result storage
- **Automated CI/CD**: GitHub Actions workflows that run tests on every commit and PR

## Test Structure

```
smarties/
├── __tests__/                 # Unit tests
│   ├── services/             # Service layer tests
│   └── setup/                # CI/CD setup verification tests
├── integration/              # Integration tests
│   ├── cloud/               # Cloud service integration tests
│   └── e2e/                 # End-to-end workflow tests
├── coverage/                # Coverage reports (generated)
├── test-results/           # Unit test results (generated)
└── integration-test-results/ # Integration test results (generated)
```

## Running Tests Locally

### Prerequisites
```bash
cd smarties
npm install
```

### Unit Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (development)
npm run test:watch

# Run for CI (no watch, with coverage and JUnit reporting)
npm run test:ci
```

### Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run only cloud service integration tests
npm run test:integration:cloud
```

### Test Summary
```bash
# Generate and display test summary
npm run test:summary
```

## Environment Variables for Integration Tests

Integration tests require the following environment variables:

```bash
# MongoDB Atlas (required for database integration tests)
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/

# OpenAI API (required for AI service integration tests)
OPENAI_API_KEY=sk-...

# Anthropic API (optional, for fallback testing)
ANTHROPIC_API_KEY=sk-ant-...
```

Create a `.env` file in the `smarties/` directory with these values for local testing.

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline runs on:
- Every push to `main` or `develop` branches
- Every pull request to `main` or `develop` branches
- Manual workflow dispatch

### Pipeline Stages

1. **Unit Tests** (Node.js 18.x and 20.x)
   - Install dependencies
   - Run linting
   - Execute unit tests with coverage
   - Upload coverage reports to Codecov

2. **Integration Tests** (Node.js 18.x only)
   - Run cloud service integration tests
   - Test MongoDB Atlas connectivity
   - Test AI service integrations
   - Verify end-to-end workflows

3. **Build Tests**
   - Android build verification
   - iOS build verification
   - Upload build artifacts

4. **Notifications**
   - Generate test result summaries
   - Comment on pull requests with results
   - Fail the build if any tests fail

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

```
MONGODB_CONNECTION_STRING_TEST  # Test database connection string
OPENAI_API_KEY_TEST            # OpenAI API key for testing
ANTHROPIC_API_KEY_TEST         # Anthropic API key for testing (optional)
```

## Test Configuration

### Jest Configuration

- **Unit Tests**: `jest.config.js`
  - Uses React Native preset
  - Includes coverage collection
  - Supports TypeScript
  - Excludes integration tests

- **Integration Tests**: `jest.integration.config.js`
  - Longer timeout (30 seconds)
  - Separate coverage directory
  - Includes only integration test files

### Coverage Thresholds

Currently disabled for hackathon speed, but recommended thresholds:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## Test Types and Examples

### Unit Tests
```typescript
// __tests__/services/database.test.ts
describe('DatabaseService', () => {
  it('should connect successfully', async () => {
    const service = new DatabaseService(config);
    await service.connect();
    expect(service.isConnectionActive()).toBe(true);
  });
});
```

### Integration Tests
```typescript
// integration/cloud/mongodb.integration.test.ts
describe('MongoDB Integration', () => {
  it('should connect to Atlas and perform CRUD operations', async () => {
    const result = await db.collection('test').insertOne(testDoc);
    expect(result.insertedId).toBeTruthy();
  });
});
```

### End-to-End Tests
```typescript
// integration/e2e/scanning-workflow.integration.test.ts
describe('Scanning Workflow', () => {
  it('should complete full scan-to-result workflow', async () => {
    // 1. Create user profile
    // 2. Scan product (simulate)
    // 3. Analyze with AI
    // 4. Store results
    // 5. Verify complete workflow
  });
});
```

## Troubleshooting

### Common Issues

1. **Tests fail locally but pass in CI**
   - Check environment variables
   - Verify Node.js version (18+)
   - Clear node_modules and reinstall

2. **Integration tests timeout**
   - Check network connectivity
   - Verify API keys are valid
   - Increase timeout in Jest config if needed

3. **Coverage reports not generated**
   - Ensure `--coverage` flag is used
   - Check that source files are in `src/` directory
   - Verify Jest configuration includes correct paths

4. **CI/CD pipeline fails**
   - Check GitHub secrets are configured
   - Verify workflow file syntax
   - Check for dependency conflicts

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- __tests__/services/database.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="connection"

# Debug integration tests
npm run test:integration -- --verbose
```

## Performance Considerations

- Unit tests should complete in <100ms each
- Integration tests may take up to 30 seconds
- Total CI pipeline should complete in <10 minutes
- Use mocking for external dependencies in unit tests
- Reserve real API calls for integration tests only

## Best Practices

1. **Test Naming**: Use descriptive test names that explain the scenario
2. **Test Structure**: Follow Arrange-Act-Assert pattern
3. **Mocking**: Mock external dependencies in unit tests
4. **Cleanup**: Always clean up test data in integration tests
5. **Environment**: Use separate test databases and API keys
6. **Coverage**: Aim for high coverage but focus on critical paths
7. **Speed**: Keep unit tests fast, integration tests comprehensive

## Hackathon Considerations

For the 24-hour hackathon environment:
- Coverage thresholds are disabled to allow rapid development
- Integration tests are optional and can be skipped if services are unavailable
- Build failures don't block development but should be addressed
- Test results are reported but don't gate deployments
- Focus on core functionality testing over comprehensive coverage

## Future Enhancements

Post-hackathon improvements to consider:
- Enable coverage thresholds
- Add performance testing
- Implement visual regression testing
- Add security testing (SAST/DAST)
- Set up test data management
- Implement parallel test execution
- Add mutation testing