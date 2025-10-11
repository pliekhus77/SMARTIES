# SMARTIES Deployment Guide

**Complete deployment guide for SMARTIES hackathon project**

## 🎯 Overview

This guide covers deployment procedures for the SMARTIES mobile application across different environments and platforms. The deployment strategy is optimized for hackathon speed while maintaining production-ready practices.

## 📋 Deployment Environments

### Environment Strategy

| Environment | Purpose | Deployment Method | Frequency | Approval Required |
|-------------|---------|-------------------|-----------|-------------------|
| **Development** | Local development | Manual | Continuous | No |
| **Demo** | Hackathon demonstration | Expo Go / EAS Build | On-demand | No |
| **Staging** | Pre-production testing | EAS Build | Daily | Optional |
| **Production** | Live application | App Store / Play Store | Release cycles | Yes |

## 🚀 Quick Deployment (Hackathon Demo)

### Option 1: Expo Go (Recommended for Demo)

**Fastest deployment method for hackathon demonstration:**

```bash
# 1. Start development server
cd smarties
npm start

# 2. Generate QR code for device testing
# QR code appears in terminal and browser

# 3. Install Expo Go on demo devices
# iOS: App Store → "Expo Go"
# Android: Play Store → "Expo Go"

# 4. Scan QR code with Expo Go app
# App loads directly on device
```

**Benefits for Hackathon:**
- ✅ **Instant deployment** - No build process required
- ✅ **Live updates** - Changes appear immediately
- ✅ **Multiple devices** - Same QR code works for all devices
- ✅ **No certificates** - No iOS/Android signing required
- ✅ **Zero cost** - Free for development and demo

### Option 2: EAS Build (For Standalone Apps)

**For creating standalone app files:**

```bash
# 1. Install EAS CLI
npm install -g @expo/eas-cli

# 2. Login to Expo account
eas login

# 3. Configure build
eas build:configure

# 4. Build for platforms
eas build --platform ios     # iOS build
eas build --platform android # Android build
eas build --platform all     # Both platforms
```

## 🏗️ Cloud Service Deployment

### MongoDB Atlas Configuration

**Current Setup (Ready for Deployment):**
- **Cluster**: cluster0.31pwc7s.mongodb.net
- **Database**: smarties_db
- **Collections**: products, users, scan_history
- **Status**: ✅ Production-ready

**Environment Variables:**
```bash
# Production
MONGODB_URI=mongodb+srv://smarties_app_user:ACTUAL_PASSWORD@cluster0.31pwc7s.mongodb.net/smarties_db?retryWrites=true&w=majority
MONGODB_DB_NAME=smarties_db

# Staging
MONGODB_URI=mongodb+srv://smarties_app_user:ACTUAL_PASSWORD@cluster0.31pwc7s.mongodb.net/smarties_staging?retryWrites=true&w=majority
MONGODB_DB_NAME=smarties_staging
```

**Deployment Checklist:**
- [ ] Update password from placeholder
- [ ] Verify network access rules
- [ ] Test connection from deployment environment
- [ ] Confirm database collections exist
- [ ] Validate sample data

### AI Service Deployment

**Demo Mode (Hackathon):**
```bash
# Environment variables for demo
AI_SERVICE_TYPE=demo
AI_DEMO_MODE=true
AI_TIMEOUT_MS=10000
```

**Production Mode (Future):**
```bash
# Environment variables for production
AI_SERVICE_TYPE=bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

## 📱 Platform-Specific Deployment

### iOS Deployment

#### Development/Demo (Expo Go)
```bash
# 1. Start development server
npm start

# 2. Open on iOS device
# - Install Expo Go from App Store
# - Scan QR code with camera or Expo Go app
# - App loads automatically
```

#### Staging/Production (EAS Build)
```bash
# 1. Configure iOS build
eas build:configure

# 2. Build iOS app
eas build --platform ios

# 3. Download IPA file from EAS dashboard
# 4. Install via TestFlight (staging) or App Store (production)
```

**iOS Requirements:**
- Apple Developer Account (for production)
- iOS certificates and provisioning profiles
- TestFlight for beta testing
- App Store Connect for production

### Android Deployment

#### Development/Demo (Expo Go)
```bash
# 1. Start development server
npm start

# 2. Open on Android device
# - Install Expo Go from Play Store
# - Scan QR code with Expo Go app
# - App loads automatically
```

#### Staging/Production (EAS Build)
```bash
# 1. Configure Android build
eas build:configure

# 2. Build Android app
eas build --platform android

# 3. Download APK file from EAS dashboard
# 4. Install via Google Play Console (internal testing/production)
```

**Android Requirements:**
- Google Play Developer Account (for production)
- Android signing key
- Google Play Console access

## 🔧 Environment Configuration

### Development Environment
```bash
# .env.development
NODE_ENV=development
DEBUG=true

# MongoDB (development cluster)
MONGODB_URI=mongodb+srv://dev_user:dev_password@dev-cluster.mongodb.net/smarties_dev
MONGODB_DB_NAME=smarties_dev

# AI Service (demo mode)
AI_SERVICE_TYPE=demo
AI_DEMO_MODE=true

# Logging
LOG_LEVEL=debug
ENABLE_CONSOLE_LOGS=true
```

### Staging Environment
```bash
# .env.staging
NODE_ENV=staging
DEBUG=false

# MongoDB (staging database)
MONGODB_URI=mongodb+srv://staging_user:staging_password@cluster0.mongodb.net/smarties_staging
MONGODB_DB_NAME=smarties_staging

# AI Service (production-like)
AI_SERVICE_TYPE=bedrock
AWS_REGION=us-east-1

# Logging
LOG_LEVEL=info
ENABLE_ANALYTICS=true
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
DEBUG=false

# MongoDB (production cluster)
MONGODB_URI=mongodb+srv://prod_user:prod_password@prod-cluster.mongodb.net/smarties_prod
MONGODB_DB_NAME=smarties_prod

# AI Service (production)
AI_SERVICE_TYPE=bedrock
AWS_REGION=us-east-1

# Security
ENABLE_ENCRYPTION=true
LOG_LEVEL=error
ENABLE_MONITORING=true
```

## 🔐 Security Configuration

### Environment Variables Management

**Development:**
- Store in `.env` files (not committed to git)
- Use `.env.example` as template
- Local development only

**Staging/Production:**
- Use EAS Secrets for Expo builds
- Use platform-specific secure storage
- Never hardcode in source code

### EAS Secrets Management
```bash
# Set secrets for EAS builds
eas secret:create --scope project --name MONGODB_URI --value "mongodb+srv://..."
eas secret:create --scope project --name AI_SERVICE_TYPE --value "demo"

# List secrets
eas secret:list

# Update secrets
eas secret:delete --name MONGODB_URI
eas secret:create --scope project --name MONGODB_URI --value "new-value"
```

### Security Checklist
- [ ] All API keys stored as environment variables
- [ ] No hardcoded credentials in source code
- [ ] HTTPS/TLS enabled for all external communications
- [ ] Database connections encrypted
- [ ] User data encrypted at rest
- [ ] Regular security audits: `npm audit`

## 📊 Monitoring and Analytics

### Application Monitoring

**Development:**
- Console logging enabled
- React Native Debugger
- Expo DevTools

**Production:**
- Application Insights (Azure)
- Crashlytics (Firebase)
- Performance monitoring
- User analytics

### Health Checks

**API Health Check:**
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION,
    environment: process.env.NODE_ENV,
    services: {
      database: 'connected',
      ai_service: 'available'
    }
  });
});
```

**Database Health Check:**
```javascript
// MongoDB connection health
async function checkDatabaseHealth() {
  try {
    await client.db().admin().ping();
    return { status: 'connected', latency: Date.now() - start };
  } catch (error) {
    return { status: 'disconnected', error: error.message };
  }
}
```

## 🚀 CI/CD Pipeline (Future Enhancement)

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy SMARTIES

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run lint
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @expo/eas-cli
      - run: eas build --platform all --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Deployment Stages

1. **Code Commit** → Trigger pipeline
2. **Run Tests** → Unit, integration, linting
3. **Build App** → EAS build for platforms
4. **Deploy to Staging** → Automatic deployment
5. **Manual Approval** → For production deployment
6. **Deploy to Production** → App Store/Play Store

## 🎯 Hackathon Deployment Strategy

### Demo Day Preparation

**1 Week Before:**
- [ ] Test Expo Go deployment on all demo devices
- [ ] Verify cloud services are accessible
- [ ] Prepare backup deployment methods
- [ ] Create demo user accounts and data

**1 Day Before:**
- [ ] Deploy latest version to Expo Go
- [ ] Test on all demo devices
- [ ] Verify barcode scanning works
- [ ] Prepare offline fallback

**Demo Day:**
- [ ] Have multiple devices ready
- [ ] Test internet connectivity
- [ ] Prepare local fallback (if needed)
- [ ] Have QR codes ready for audience testing

### Backup Plans

**Primary: Expo Go**
- Live deployment via QR code
- Real-time updates possible
- Works on any iOS/Android device

**Backup 1: Pre-built APK/IPA**
- Standalone app files
- No internet required for installation
- Faster loading

**Backup 2: Screen Recording**
- Video demonstration
- No device dependencies
- Guaranteed to work

**Backup 3: Local Demo**
- Development server on laptop
- Simulator/emulator demo
- Complete control

## 🔍 Troubleshooting Deployment Issues

### Common Deployment Problems

#### Expo Go Issues
**Problem**: QR code not scanning
**Solutions:**
- Use tunnel mode: `expo start --tunnel`
- Check firewall settings
- Use localhost mode: `expo start --localhost`
- Share URL manually

**Problem**: App crashes on device
**Solutions:**
- Check device compatibility
- Clear Expo Go cache
- Restart Expo Go app
- Check console logs: `expo start --dev-client`

#### EAS Build Issues
**Problem**: Build fails
**Solutions:**
- Check build logs in EAS dashboard
- Verify dependencies are compatible
- Update Expo SDK version
- Check platform-specific requirements

**Problem**: App won't install
**Solutions:**
- Check device compatibility
- Verify signing certificates
- Clear device cache
- Try different installation method

#### Cloud Service Issues
**Problem**: Database connection fails
**Solutions:**
- Verify connection string
- Check network access rules
- Confirm credentials are correct
- Test from deployment environment

**Problem**: AI service not responding
**Solutions:**
- Check environment variables
- Verify service configuration
- Test with demo mode
- Check API quotas/limits

### Debug Commands

```bash
# Expo debugging
expo doctor                    # Check configuration
expo start --clear            # Clear cache
expo start --dev-client       # Enable debugging

# Build debugging
eas build:list                 # List recent builds
eas build:view [build-id]      # View build details
eas build:cancel [build-id]    # Cancel build

# Environment debugging
expo config                    # Show resolved config
eas secret:list               # List environment secrets
```

## 📚 Deployment Resources

### Documentation Links
- [Expo Deployment Guide](https://docs.expo.dev/distribution/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Deployment](https://reactnative.dev/docs/running-on-device)
- [MongoDB Atlas Deployment](https://docs.atlas.mongodb.com/getting-started/)

### Tools and Services
- **Expo Go**: Free device testing
- **EAS Build**: Cloud build service
- **TestFlight**: iOS beta testing
- **Google Play Console**: Android distribution
- **MongoDB Atlas**: Database hosting
- **AWS Bedrock**: AI service hosting

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Cloud services accessible
- [ ] Security review completed
- [ ] Performance testing done

### Deployment Process
- [ ] Build successful
- [ ] Health checks passing
- [ ] Database migrations applied
- [ ] Monitoring configured
- [ ] Rollback plan ready

### Post-Deployment
- [ ] Application accessible
- [ ] Core features working
- [ ] Performance metrics normal
- [ ] Error rates acceptable
- [ ] User feedback collected

### Hackathon Specific
- [ ] Demo devices configured
- [ ] Expo Go installed and tested
- [ ] QR codes generated and tested
- [ ] Backup deployment methods ready
- [ ] Demo script prepared

---

## 🎉 Ready for Deployment!

Your SMARTIES application is ready for deployment using multiple strategies:

1. **Expo Go** - Perfect for hackathon demos
2. **EAS Build** - For standalone applications
3. **CI/CD Pipeline** - For automated deployments
4. **Cloud Services** - MongoDB Atlas and AI services ready

Choose the deployment method that best fits your timeline and requirements. For hackathon demonstration, Expo Go provides the fastest and most flexible deployment option.

**Happy Deploying!** 🚀📱