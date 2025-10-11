# CI/CD Setup Documentation

## Overview

This document describes the Continuous Integration and Continuous Deployment (CI/CD) setup for the SMARTIES project, configured as part of task 7.1 in the hackathon setup phase.

## Architecture

### GitHub Actions Workflows

#### 1. Main CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

**Jobs:**

1. **Test Job** (`test`)
   - Runs on Ubuntu with Node.js 18.x and 20.x matrix
   - Installs dependencies for both root and smarties projects
   - Executes linting, testing, and TypeScript validation
   - Uploads coverage reports to Codecov
   - **Quality Gates:** All tests must pass, linting must pass, TypeScript must compile

2. **Android Build Job** (`build-android`)
   - Runs on Ubuntu with Java 17 setup
   - Builds Android export using Expo
   - Uploads build artifacts with 7-day retention
   - **Dependencies:** Requires test job to pass

3. **iOS Build Job** (`build-ios`)
   - Runs on macOS for iOS-specific tooling
   - Builds iOS export using Expo
   - Uploads build artifacts with 7-day retention
   - **Dependencies:** Requires test job to pass

4. **Notification Job** (`notify`)
   - Runs after all other jobs complete
   - Provides build status summary
   - Fails if any dependent job fails

#### 2. Build Status Workflow (`.github/workflows/build-status.yml`)

**Triggers:**
- Completion of CI workflow

**Purpose:**
- Provides real-time build status updates
- Logs build completion details
- Useful for monitoring during hackathon development

#### 3. Hackathon Deployment Workflow (`.github/workflows/deploy-hackathon.yml`)

**Triggers:**
- Manual workflow dispatch only

**Features:**
- Environment selection (hackathon/demo)
- Expo-based build and export
- Deployment simulation for hackathon environments

## Quality Gates

| Stage | Requirement | Blocking | Purpose |
|-------|-------------|----------|---------|
| **Compilation** | TypeScript compiles without errors | ✅ Yes | Catch type errors early |
| **Linting** | ESLint passes with no errors | ✅ Yes | Maintain code quality |
| **Testing** | All unit and integration tests pass | ✅ Yes | Ensure functionality |
| **Coverage** | Test coverage uploaded (non-blocking) | ❌ No | Monitor test coverage |
| **Build** | iOS and Android builds complete | ✅ Yes | Validate deployability |

## Build Artifacts

### Artifact Storage
- **Location:** GitHub Actions artifacts
- **Retention:** 7 days (suitable for hackathon timeline)
- **Types:** 
  - `android-build`: Android export files
  - `ios-build`: iOS export files

### Accessing Artifacts
1. Go to GitHub Actions tab
2. Select completed workflow run
3. Download artifacts from the summary page

## Environment Configuration

### Required Secrets
Currently, no secrets are required for the basic CI/CD setup. For production deployment, you would need:
- `EXPO_TOKEN`: For Expo publishing
- `ANDROID_KEYSTORE`: For Android signing
- `IOS_CERTIFICATES`: For iOS signing

### Environment Variables
The workflows use standard environment variables and don't require additional configuration for the hackathon setup.

## Usage Instructions

### Running CI Pipeline
The CI pipeline runs automatically on:
- Every push to `main` or `develop`
- Every pull request to `main` or `develop`

### Manual Deployment
1. Go to GitHub Actions tab
2. Select "Deploy to Hackathon Environment"
3. Click "Run workflow"
4. Choose environment (hackathon/demo)
5. Click "Run workflow" button

### Monitoring Builds
1. **GitHub Actions Tab:** Real-time build status
2. **Build Notifications:** Check the notify job for summary
3. **Artifacts:** Download build outputs for testing
4. **Coverage Reports:** View coverage trends in Codecov (if configured)

## Validation

### Automated Validation
Run the validation script to check CI/CD configuration:

```bash
npm run ci:validate
```

This script checks:
- ✅ All required workflow files exist
- ✅ CI features are properly configured
- ✅ Deployment options are available
- ✅ Package.json scripts are set up

### Manual Validation
1. **Push a test commit** to trigger the CI pipeline
2. **Check GitHub Actions** for successful execution
3. **Verify artifacts** are generated and downloadable
4. **Test manual deployment** workflow

## Troubleshooting

### Common Issues

#### Build Failures
- **Node.js Version Mismatch:** Ensure package.json engines match workflow versions
- **Dependency Issues:** Check that both root and smarties package.json are valid
- **Expo CLI Issues:** Verify Expo commands work locally first

#### Test Failures
- **Missing Test Files:** Ensure test files exist and are properly configured
- **Coverage Issues:** Coverage upload failures don't block builds
- **TypeScript Errors:** Fix type errors before pushing

#### Deployment Issues
- **Manual Workflow Not Visible:** Check repository permissions
- **Build Artifacts Missing:** Ensure builds complete successfully first
- **Environment Selection:** Verify environment names match workflow configuration

### Getting Help
1. **Check workflow logs** in GitHub Actions for detailed error messages
2. **Run validation script** to identify configuration issues
3. **Test locally** to reproduce build/test failures
4. **Review documentation** for setup requirements

## Performance Metrics

### Build Times (Approximate)
- **Test Job:** 3-5 minutes
- **Android Build:** 2-3 minutes
- **iOS Build:** 3-4 minutes
- **Total Pipeline:** 8-12 minutes

### Resource Usage
- **Concurrent Jobs:** Up to 3 (test, android, ios)
- **GitHub Actions Minutes:** ~15-20 minutes per full pipeline run
- **Storage:** ~50-100MB per build artifact set

## Future Enhancements

### Potential Improvements
1. **Caching:** Add more aggressive caching for node_modules
2. **Parallel Testing:** Split tests across multiple runners
3. **Security Scanning:** Add dependency vulnerability scanning
4. **Performance Testing:** Add automated performance benchmarks
5. **Real Device Testing:** Integrate with device cloud services

### Production Readiness
For production deployment, consider adding:
- **Code signing** for app store releases
- **Automated testing** on real devices
- **Security scanning** and compliance checks
- **Staged deployments** with rollback capabilities
- **Monitoring integration** for deployment health

## Summary

The CI/CD setup provides:
- ✅ **Automated Quality Assurance:** Every code change is tested and validated
- ✅ **Multi-Platform Support:** Both iOS and Android builds are validated
- ✅ **Fast Feedback:** Developers get quick feedback on code changes
- ✅ **Deployment Ready:** Manual deployment capability for demos
- ✅ **Hackathon Optimized:** 7-day artifact retention and streamlined workflows

This setup ensures code quality while maintaining the speed and flexibility needed for hackathon development.