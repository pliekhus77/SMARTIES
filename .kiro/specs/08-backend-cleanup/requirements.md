# Requirements Document

## Introduction

This specification defines the requirements for cleaning up unnecessary backend API and MongoDB/database elements from the SMARTIES project. Based on the architectural decision to use Open Food Facts API directly and store user data locally with AsyncStorage, we need to remove all backend server components, MongoDB configurations, and related infrastructure code that are no longer needed.

The cleanup will simplify the project architecture, reduce maintenance overhead, eliminate hosting costs, and align with the privacy-by-design approach where all user data stays on the device.

## Requirements

### Requirement 1: Remove Backend API Server Components

**User Story:** As a developer, I want to remove the backend API server so that the project architecture is simplified and focuses on direct API integration with Open Food Facts.

#### Acceptance Criteria

1. WHEN reviewing the project structure THEN the backend-server.js file SHALL be removed
2. WHEN reviewing the project structure THEN the backend-package.json file SHALL be removed  
3. WHEN checking dependencies THEN all Express.js and backend-specific Node.js dependencies SHALL be removed
4. WHEN reviewing documentation THEN all references to the backend API server SHALL be removed or updated
5. WHEN checking environment variables THEN backend-specific environment variables SHALL be removed from .env files

### Requirement 2: Remove MongoDB Database Infrastructure

**User Story:** As a developer, I want to remove all MongoDB-related code and configurations so that the project no longer depends on external database infrastructure.

#### Acceptance Criteria

1. WHEN reviewing the project structure THEN setup-mongodb-auth.js SHALL be removed
2. WHEN reviewing the project structure THEN test-mongodb-connection.js SHALL be removed
3. WHEN checking dependencies THEN the MongoDB Node.js driver SHALL be removed from package.json files
4. WHEN reviewing environment files THEN MONGODB_URI and related MongoDB environment variables SHALL be removed
5. WHEN checking configuration files THEN any MongoDB connection configurations SHALL be removed
6. WHEN reviewing documentation THEN MongoDB setup instructions SHALL be removed or updated

### Requirement 3: Remove Database-Related Scripts and Utilities

**User Story:** As a developer, I want to remove database-related scripts and utilities so that the project only contains code relevant to the new architecture.

#### Acceptance Criteria

1. WHEN reviewing the scripts directory THEN any MongoDB data loading scripts SHALL be removed
2. WHEN reviewing the project root THEN start-local-mongodb.sh SHALL be removed
3. WHEN reviewing the project structure THEN any database schema files SHALL be removed
4. WHEN checking test files THEN MongoDB integration tests SHALL be removed
5. WHEN reviewing utility files THEN database connection utilities SHALL be removed

### Requirement 4: Clean Up Environment and Configuration Files

**User Story:** As a developer, I want to clean up environment and configuration files so that they only contain variables relevant to the new architecture.

#### Acceptance Criteria

1. WHEN reviewing .env files THEN MongoDB-related environment variables SHALL be removed
2. WHEN reviewing .env files THEN backend server configuration variables SHALL be removed
3. WHEN reviewing .env files THEN database connection pool settings SHALL be removed
4. WHEN reviewing configuration files THEN any database-specific configurations SHALL be removed
5. WHEN updating .env.example THEN it SHALL reflect only the required environment variables for the new architecture

### Requirement 5: Update Documentation and References

**User Story:** As a developer, I want updated documentation so that setup instructions reflect the simplified architecture without backend components.

#### Acceptance Criteria

1. WHEN reviewing README files THEN backend setup instructions SHALL be removed
2. WHEN reviewing documentation THEN MongoDB setup references SHALL be removed
3. WHEN reviewing architecture documentation THEN diagrams SHALL be updated to reflect the new direct API architecture
4. WHEN reviewing setup guides THEN database configuration steps SHALL be removed
5. WHEN checking troubleshooting guides THEN database-related troubleshooting SHALL be removed

### Requirement 6: Remove Development and Testing Infrastructure

**User Story:** As a developer, I want to remove development and testing infrastructure related to the backend so that the development workflow is simplified.

#### Acceptance Criteria

1. WHEN reviewing package.json scripts THEN backend server start scripts SHALL be removed
2. WHEN reviewing Docker configurations THEN database service definitions SHALL be removed
3. WHEN reviewing CI/CD configurations THEN database testing steps SHALL be removed
4. WHEN reviewing test files THEN backend API integration tests SHALL be removed
5. WHEN checking development scripts THEN database seeding and migration scripts SHALL be removed

### Requirement 7: Preserve Essential Project Components

**User Story:** As a developer, I want to ensure that essential project components are preserved so that the React Native application functionality remains intact.

#### Acceptance Criteria

1. WHEN removing backend components THEN React Native application code SHALL remain unchanged
2. WHEN cleaning up files THEN Open Food Facts API integration code SHALL be preserved
3. WHEN removing database code THEN AsyncStorage implementations SHALL be preserved
4. WHEN updating configurations THEN AI service configurations SHALL be preserved
5. WHEN cleaning up dependencies THEN React Native and mobile development dependencies SHALL remain intact

### Requirement 8: Update Project Structure Documentation

**User Story:** As a developer, I want updated project structure documentation so that the new simplified architecture is clearly documented.

#### Acceptance Criteria

1. WHEN reviewing project documentation THEN the architecture summary SHALL reflect the removal of backend components
2. WHEN checking file structure documentation THEN removed files SHALL not be referenced
3. WHEN reviewing setup instructions THEN they SHALL reflect the simplified mobile-only architecture
4. WHEN updating development guides THEN backend-related development steps SHALL be removed
5. WHEN reviewing deployment documentation THEN backend deployment instructions SHALL be removed