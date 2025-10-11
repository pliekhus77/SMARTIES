# SMARTIES Deployment Automation

This document describes the deployment automation setup for the SMARTIES application, including deployment pipelines, health checks, monitoring, and rollback capabilities.

## Overview

The deployment automation system provides:

- **Automated Deployment Pipeline**: GitHub Actions workflow for deploying to multiple environments
- **Health Checks**: Comprehensive health monitoring with automatic failure detection
- **Rollback Capabilities**: Automatic and manual rollback to previous working versions
- **Monitoring**: Real-time deployment monitoring with alerting
- **Status Dashboard**: Overview of deployment status across all environments

## Quick Start

### Deploy to Hackathon Environment

```bash
# Trigger deployment via GitHub Actions
# Go to Actions tab → Deploy to Hackathon Environment → Run workflow

# Or use manual deployment (for testing)
cd smarties
npm run build:android  # or build:ios
npm run deploy:health-check https://smarties-hackathon.demo.app
```

### Monitor Deployment

```bash
# Check deployment status
npm run deploy:status

# Watch status in real-time
npm run deploy:watch

# Monitor specific environment
npm run deploy:monitor https://smarties-hackathon.demo.app hackathon
```

### Rollback if Needed

```bash
# Automatic rollback (triggered by health check failures)
# Manual rollback
npm run deploy:rollback hackathon

# List available rollback targets
node scripts/rollback.js list hackathon
```

## Deployment Pipeline

### GitHub Actions Workflow

The deployment pipeline is defined in `.github/workflows/deploy-hackathon.yml` and includes:

1. **Pre-deployment Checks**
   - Code validation and testing
   - Build artifact creation
   - Version tagging

2. **Deployment**
   - Environment-specific deployment
   - Configuration updates
   - Service startup

3. **Health Checks**
   - Application availability verification
   - API endpoint testing
   - Database connectivity checks
   - Performance baseline validation

4. **Post-deployment**
   - Monitoring setup
   - Status reporting
   - Notification sending

5. **Automatic Rollback** (if health checks fail)
   - Previous version restoration
   - Service restart
   - Verification of rollback success

### Triggering Deployments

#### Automatic Triggers
- Push to `main` branch (for hackathon environment)
- Successful CI/CD pipeline completion

#### Manual Triggers
- GitHub Actions workflow dispatch
- Manual script execution

### Environment Configuration

Environments are configured in `deployment.config.js`:

```javascript
environments: {
  hackathon: {
    name: 'Hackathon Demo',
    url: 'https://smarties-hackathon.demo.app',
    autoRollback: true,
    healthChecks: { enabled: true },
    monitoring: { enabled: true }
  },
  // ... other environments
}
```

## Health Checks

### Automated Health Monitoring

The health check system (`scripts/health-check.js`) performs:

- **Basic Application Health**: Application responsiveness
- **API Endpoints**: Core API functionality
- **Database Connectivity**: MongoDB Atlas connection
- **External Services**: AI services and third-party APIs
- **Performance Baseline**: Response time validation

### Health Check Configuration

```bash
# Run health check manually
npm run deploy:health-check https://smarties-hackathon.demo.app

# Configure health check endpoints in deployment.config.js
healthChecks: {
  enabled: true,
  endpoints: ['/health', '/api/health', '/api/health/database'],
  timeout: 10000,
  retries: 3
}
```

### Health Check Results

- ✅ **Pass**: All checks successful, deployment continues
- ⚠️ **Warning**: Some checks failed, but within tolerance
- ❌ **Fail**: Critical checks failed, triggers rollback

## Monitoring

### Real-time Monitoring

The monitoring system (`scripts/deployment-monitor.js`) tracks:

- **Request Metrics**: Total requests, success rate, error rate
- **Performance**: Response times, 95th percentile, max response time
- **Availability**: Uptime percentage, health check success rate
- **Alerts**: Threshold violations and anomaly detection

### Starting Monitoring

```bash
# Start monitoring for hackathon environment
npm run deploy:monitor https://smarties-hackathon.demo.app hackathon

# Generate monitoring report
npm run deploy:report hackathon 24  # Last 24 hours
```

### Alert Thresholds

Configurable per environment in `deployment.config.js`:

```javascript
alertThresholds: {
  responseTime: 2000,    // 2 seconds
  errorRate: 0.05,       // 5%
  availability: 0.99     // 99%
}
```

## Rollback System

### Automatic Rollback

Triggered automatically when:
- Health checks fail after deployment
- Consecutive monitoring failures exceed threshold
- Critical alerts are detected

### Manual Rollback

```bash
# Rollback to previous version
npm run deploy:rollback hackathon

# Rollback to specific version
node scripts/rollback.js rollback hackathon v20241211-abc123

# List available rollback targets
node scripts/rollback.js list hackathon
```

### Rollback Process

1. **Backup Current State**: Create recovery point
2. **Stop Current Deployment**: Graceful shutdown
3. **Restore Previous Version**: Deploy previous working version
4. **Update Configuration**: Restore previous settings
5. **Start Services**: Restart with previous version
6. **Verify Rollback**: Confirm successful restoration

## Status Dashboard

### Deployment Status Overview

```bash
# Show status dashboard
npm run deploy:status

# Show detailed environment status
node scripts/deployment-status.js details hackathon

# Generate summary report
node scripts/deployment-status.js summary

# Watch status with auto-refresh
npm run deploy:watch
```

### Status Indicators

- 🟢 **Healthy**: All systems operational
- 🟡 **Warning**: Some issues detected, but functional
- 🔴 **Critical**: Significant issues, may need attention
- ❓ **Unknown**: Status cannot be determined

## Scripts Reference

### Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `health-check.js` | Validate deployment health | `npm run deploy:health-check <url>` |
| `rollback.js` | Rollback to previous version | `npm run deploy:rollback <env>` |
| `deployment-monitor.js` | Monitor deployment metrics | `npm run deploy:monitor <url> <env>` |
| `deployment-status.js` | Show deployment status | `npm run deploy:status` |

### Configuration Files

| File | Purpose |
|------|---------|
| `deployment.config.js` | Environment and deployment configuration |
| `.github/workflows/deploy-hackathon.yml` | GitHub Actions deployment pipeline |

## Troubleshooting

### Common Issues

#### Deployment Fails
1. Check GitHub Actions logs
2. Verify environment configuration
3. Test health check endpoints manually
4. Check service dependencies (MongoDB, AI services)

#### Health Checks Fail
1. Verify application is running
2. Check database connectivity
3. Validate API endpoints
4. Review application logs

#### Rollback Fails
1. Check backup availability
2. Verify rollback target exists
3. Ensure sufficient permissions
4. Review rollback logs

### Debug Commands

```bash
# Test health check manually
curl -f https://smarties-hackathon.demo.app/health

# Check deployment logs
# (Available in GitHub Actions interface)

# Validate configuration
node -e "console.log(require('./deployment.config.js').getEnvironmentConfig('hackathon'))"

# Test monitoring endpoints
npm run deploy:health-check https://smarties-hackathon.demo.app
```

### Getting Help

1. **Check Status Dashboard**: `npm run deploy:status`
2. **Review Logs**: GitHub Actions → Latest workflow run
3. **Monitor Health**: `npm run deploy:monitor <url> <env>`
4. **Generate Report**: `npm run deploy:report <env>`

## Security Considerations

- **Secrets Management**: All API keys stored in GitHub Secrets
- **Access Control**: Deployment approvals for production environments
- **Audit Trail**: All deployments and rollbacks are logged
- **Backup Encryption**: Deployment backups are encrypted

## Environment Variables

Required for deployment automation:

```bash
# GitHub Secrets (configured in repository settings)
MONGODB_CONNECTION_STRING_TEST=mongodb+srv://...
OPENAI_API_KEY_TEST=sk-...
ANTHROPIC_API_KEY_TEST=sk-ant-...

# Optional
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
AUTO_ROLLBACK=true
ROLLBACK_REASON="Health check failure"
```

## Best Practices

1. **Test in Lower Environments**: Always test deployments in hackathon/demo before production
2. **Monitor After Deployment**: Watch metrics for at least 15 minutes after deployment
3. **Keep Rollback Ready**: Ensure previous version is always available for rollback
4. **Document Changes**: Include deployment notes in commit messages
5. **Validate Health Checks**: Regularly test health check endpoints
6. **Review Alerts**: Investigate and resolve alert conditions promptly

## Future Enhancements

- **Blue-Green Deployments**: Zero-downtime deployments for production
- **Canary Releases**: Gradual rollout with traffic splitting
- **Performance Testing**: Automated performance validation
- **Security Scanning**: Automated security checks in pipeline
- **Slack Integration**: Real-time notifications to team channels
- **Metrics Dashboard**: Web-based monitoring dashboard

---

For more information, see:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [SMARTIES Development Setup](./DEVELOPMENT_SETUP.md)
- [Testing Guide](./TESTING.md)