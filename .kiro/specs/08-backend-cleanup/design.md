# Design Document

## Overview

This design document outlines the systematic approach for removing unnecessary backend API and MongoDB/database components from the SMARTIES project. The cleanup will transform the project from a full-stack architecture to a mobile-first architecture that leverages Open Food Facts API directly and stores user data locally using AsyncStorage.

The design ensures a clean, maintainable codebase that aligns with the privacy-by-design principles while preserving all essential React Native functionality.

## Architecture

### Current Architecture (To Be Cleaned)
```
React Native App → Backend API Server → MongoDB Atlas → Open Food Facts API
                                    ↓
                              Local File Storage
```

### Target Architecture (After Cleanup)
```
React Native App → Open Food Facts API
                ↓
        AsyncStorage (Local)
```

### Components to Remove

#### Backend Infrastructure
- **backend-server.js**: Express.js API server with MongoDB integration
- **backend-package.json**: Backend-specific dependencies and scripts
- **Node.js Dependencies**: Express, MongoDB driver, CORS middleware

#### Database Infrastructure  
- **setup-mongodb-auth.js**: Interactive MongoDB Atlas setup script
- **test-mongodb-connection.js**: Database connection testing utility
- **start-local-mongodb.sh**: Local MongoDB startup script
- **MongoDB Configuration**: Connection strings, authentication, pooling settings

#### Data Management Scripts
- **Database Loading Scripts**: Any scripts in `/scripts` directory that load data into MongoDB
- **Migration Scripts**: Database schema migration utilities
- **Seeding Scripts**: Test data population scripts

## Components and Interfaces

### File Removal Strategy

#### Phase 1: Backend Server Removal
```typescript
interface BackendCleanupPhase1 {
  filesToRemove: [
    'backend-server.js',
    'backend-package.json'
  ];
  dependenciesToRemove: [
    'express',
    'mongodb', 
    'cors',
    'dotenv' // if only used by backend
  ];
  scriptsToRemove: [
    'start:backend',
    'dev:backend',
    'backend:*'
  ];
}
```

#### Phase 2: Database Infrastructure Removal
```typescript
interface DatabaseCleanupPhase2 {
  filesToRemove: [
    'setup-mongodb-auth.js',
    'test-mongodb-connection.js', 
    'start-local-mongodb.sh',
    'setup-database.js'
  ];
  configurationToRemove: [
    'MONGODB_URI',
    'MONGODB_DATABASE',
    'MONGODB_MAX_POOL_SIZE',
    'MONGODB_TIMEOUT_MS'
  ];
}
```

#### Phase 3: Script and Utility Cleanup
```typescript
interface ScriptCleanupPhase3 {
  scriptsToReview: string[];
  testFilesToRemove: string[];
  documentationToUpdate: string[];
}
```

### Environment Variable Management

#### Variables to Remove
```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=smarties_db
MONGODB_MAX_POOL_SIZE=10
MONGODB_TIMEOUT_MS=5000

# Backend Server Configuration  
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# Backend Security
JWT_SECRET=...
ENCRYPTION_KEY=...
```

#### Variables to Preserve
```bash
# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# React Native Configuration
EXPO_PUBLIC_API_URL=https://world.openfoodfacts.org
```

### Documentation Update Strategy

#### Files Requiring Updates
1. **README.md**: Remove backend setup instructions
2. **DEVELOPMENT_SETUP.md**: Remove database configuration steps
3. **ARCHITECTURE_UPDATE_SUMMARY.md**: Update to reflect completed cleanup
4. **package.json**: Remove backend-related scripts and dependencies

#### New Documentation Structure
```markdown
# Setup Instructions (Simplified)
1. Install React Native dependencies
2. Configure AI service API keys
3. Run mobile application
4. (No backend or database setup required)
```

## Data Models

### Cleanup Tracking Model
```typescript
interface CleanupTask {
  id: string;
  category: 'backend' | 'database' | 'scripts' | 'config' | 'docs';
  filePath: string;
  action: 'remove' | 'update' | 'preserve';
  dependencies: string[];
  status: 'pending' | 'completed' | 'verified';
}

interface CleanupPlan {
  tasks: CleanupTask[];
  phases: CleanupPhase[];
  preservedComponents: string[];
  verificationSteps: string[];
}
```

### File Classification System
```typescript
enum FileCategory {
  BACKEND_SERVER = 'backend-server',
  DATABASE_CONFIG = 'database-config', 
  DATA_SCRIPTS = 'data-scripts',
  ENVIRONMENT = 'environment',
  DOCUMENTATION = 'documentation',
  TESTS = 'tests',
  PRESERVE = 'preserve'
}

interface FileClassification {
  path: string;
  category: FileCategory;
  action: 'remove' | 'update' | 'preserve';
  reason: string;
  dependencies: string[];
}
```

## Error Handling

### Cleanup Validation Strategy

#### Pre-Cleanup Validation
```typescript
interface PreCleanupValidation {
  backupCreated: boolean;
  essentialFilesIdentified: string[];
  dependencyMappingComplete: boolean;
  rollbackPlanReady: boolean;
}
```

#### Post-Cleanup Verification
```typescript
interface PostCleanupVerification {
  reactNativeAppBuilds: boolean;
  noMissingDependencies: boolean;
  documentationUpdated: boolean;
  environmentVariablesValid: boolean;
}
```

### Risk Mitigation

#### Backup Strategy
1. **Git Branch**: Create dedicated cleanup branch
2. **File Backup**: Backup removed files to `/cleanup-backup` directory
3. **Dependency Snapshot**: Save current package.json state
4. **Environment Backup**: Preserve original .env files

#### Rollback Plan
```typescript
interface RollbackPlan {
  backupLocation: string;
  restoreSteps: string[];
  verificationChecks: string[];
  emergencyContacts: string[];
}
```

## Testing Strategy

### Cleanup Verification Tests

#### Build Verification
```typescript
interface BuildTests {
  reactNativeBuild: () => Promise<boolean>;
  dependencyResolution: () => Promise<boolean>;
  environmentValidation: () => Promise<boolean>;
}
```

#### Functional Verification  
```typescript
interface FunctionalTests {
  openFoodFactsApiIntegration: () => Promise<boolean>;
  asyncStorageOperations: () => Promise<boolean>;
  aiServiceConnectivity: () => Promise<boolean>;
}
```

#### Documentation Verification
```typescript
interface DocumentationTests {
  setupInstructionsValid: () => Promise<boolean>;
  architectureDiagramsUpdated: () => Promise<boolean>;
  noDeadReferences: () => Promise<boolean>;
}
```

### Test Execution Plan

#### Phase 1: Pre-Cleanup Testing
1. Verify current application builds and runs
2. Document current dependency tree
3. Test all critical functionality
4. Create baseline performance metrics

#### Phase 2: Incremental Cleanup Testing
1. Remove files in small batches
2. Test build after each batch
3. Verify functionality remains intact
4. Update documentation incrementally

#### Phase 3: Post-Cleanup Validation
1. Full application build test
2. End-to-end functionality testing
3. Documentation accuracy verification
4. Performance comparison with baseline

## Implementation Phases

### Phase 1: Preparation and Backup (Safety First)
- Create cleanup branch
- Backup all files to be removed
- Document current state
- Prepare rollback procedures

### Phase 2: Backend Server Removal
- Remove backend-server.js and related files
- Clean up backend dependencies
- Update package.json scripts
- Test React Native app builds

### Phase 3: Database Infrastructure Cleanup
- Remove MongoDB setup and test scripts
- Clean up database-related environment variables
- Remove database dependencies
- Update configuration files

### Phase 4: Script and Utility Cleanup
- Review and remove database-related scripts
- Clean up development utilities
- Remove obsolete test files
- Update CI/CD configurations

### Phase 5: Documentation and Final Verification
- Update all documentation
- Remove backend references
- Verify setup instructions
- Conduct final testing

### Phase 6: Cleanup and Optimization
- Remove backup files (after verification)
- Optimize remaining configurations
- Update project structure documentation
- Archive cleanup logs

## Success Criteria

### Technical Success Metrics
- ✅ React Native application builds without errors
- ✅ No missing dependencies in package.json
- ✅ All environment variables are valid and used
- ✅ Open Food Facts API integration works
- ✅ AsyncStorage operations function correctly

### Documentation Success Metrics  
- ✅ Setup instructions are accurate and complete
- ✅ No references to removed backend components
- ✅ Architecture diagrams reflect new structure
- ✅ Troubleshooting guides are updated

### Maintenance Success Metrics
- ✅ Reduced project complexity
- ✅ Faster development setup time
- ✅ Lower maintenance overhead
- ✅ Cleaner codebase structure