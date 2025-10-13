# Current Project State Documentation

**Date:** $(Get-Date)
**Branch:** backend-cleanup (created from main)
**Commit:** $(git rev-parse HEAD)

## Project Structure Overview

The SMARTIES project currently has a mixed architecture with:
- React Native mobile application in `/smarties` directory
- Backend API server files in root directory
- MongoDB integration and database scripts
- Shared dependencies between backend and mobile app

## Package.json Files Analysis

### Root package.json (Backend-focused)
- **Name:** smarties-backend
- **Main:** backend-server.js
- **Backend Dependencies:** express, mongodb, cors, dotenv, nodemon
- **React Native Dependencies:** Mixed in with backend deps
- **Scripts:** Backend server scripts (start, dev) + data loading scripts

### backend-package.json (Pure Backend)
- **Name:** smarties-backend  
- **Main:** backend-server.js
- **Dependencies:** express (^4.18.2), mongodb (^6.3.0), cors (^2.8.5), dotenv (^16.3.1)
- **Dev Dependencies:** nodemon (^3.0.2)

### smarties/package.json (React Native App)
- **Name:** smarties
- **Main:** index.ts
- **Dependencies:** React Native, Expo, AsyncStorage, OpenAI, Anthropic, etc.
- **Notable:** Contains mongodb (^6.3.0) - should be removed during cleanup

## Backend Components to Remove

### Server Files
- `backend-server.js` - Express.js API server
- `backend-package.json` - Backend-specific package configuration

### Database Files
- `setup-mongodb-auth.js` - MongoDB Atlas setup script
- `test-mongodb-connection.js` - Database connection testing
- `start-local-mongodb.sh` - Local MongoDB startup script
- `setup-database.js` - Database initialization

### Scripts Directory (Database-related)
- Various MongoDB data loading scripts
- Database seeding and migration utilities
- Vector embedding scripts

### Environment Variables (to remove)
- MONGODB_URI
- MONGODB_DATABASE
- MONGODB_MAX_POOL_SIZE
- MONGODB_TIMEOUT_MS
- Backend server configuration variables

## React Native App Dependencies

### Dependencies to Preserve
- All Expo and React Native core packages
- @react-native-async-storage/async-storage (for local storage)
- OpenAI and Anthropic SDK packages
- Navigation and UI libraries
- Camera and barcode scanning packages

### Dependencies to Remove
- mongodb (^6.3.0) - Not needed in React Native app
- Any backend-specific packages that may have been added

## Current Functionality Baseline

### Working Features (to preserve)
- React Native app builds and runs
- Barcode scanning functionality
- Open Food Facts API integration
- AsyncStorage for local data
- AI service integrations (OpenAI/Anthropic)
- User profile management
- Dietary restriction checking

### Backend Features (to remove)
- Express.js API server
- MongoDB Atlas connection
- Backend API endpoints
- Database operations
- Server-side data processing

## Rollback Procedures

If rollback is needed:
1. Switch to main branch: `git checkout main`
2. Restore backed up files from `cleanup-backup/` directories
3. Restore original package.json configurations
4. Run `npm install` in root and smarties directories
5. Verify backend server starts: `npm run dev`
6. Verify React Native app builds: `cd smarties && npm start`

## Risk Assessment

### Low Risk
- Removing unused backend server files
- Cleaning up backend-specific dependencies
- Removing database setup scripts

### Medium Risk  
- Modifying package.json files
- Removing environment variables
- Updating documentation

### High Risk
- Any changes to React Native app code
- Removing dependencies that might be used by mobile app
- Modifying core configuration files

## Success Criteria

After cleanup:
- React Native app builds without errors
- Open Food Facts API integration works
- AsyncStorage functionality preserved
- No missing dependencies
- Simplified project structure
- Updated documentation reflects new architecture