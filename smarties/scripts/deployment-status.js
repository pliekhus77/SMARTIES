#!/usr/bin/env node

/**
 * Deployment Status Dashboard for SMARTIES
 * 
 * This script provides a quick overview of deployment status
 * across all environments and recent deployment history.
 */

const fs = require('fs').promises;
const path = require('path');
const deploymentConfig = require('../deployment.config.js');

/**
 * Load deployment status for an environment
 */
async function loadDeploymentStatus(environment) {
  try {
    const deploymentFile = path.join('./deployments', environment, 'latest.json');
    const data = await fs.readFile(deploymentFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      environment,
      status: 'unknown',
      error: error.message
    };
  }
}

/**
 * Load monitoring data for an environment
 */
async function loadMonitoringData(environment) {
  try {
    const monitoringFile = path.join('./monitoring', environment, 'latest.json');
    const data = await fs.readFile(monitoringFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

/**
 * Get deployment history for an environment
 */
async function getDeploymentHistory(environment, limit = 5) {
  try {
    const rollbacksDir = path.join('./deployments', environment, 'rollbacks');
    const files = await fs.readdir(rollbacksDir);
    
    const rollbacks = [];
    for (const file of files.slice(-limit)) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(path.join(rollbacksDir, file), 'utf8');
        rollbacks.push(JSON.parse(data));
      }
    }
    
    return rollbacks.sort((a, b) => new Date(b.initiated_at) - new Date(a.initiated_at));
  } catch (error) {
    return [];
  }
}

/**
 * Format status indicator
 */
function getStatusIndicator(status, health) {
  if (status === 'unknown') return '❓';
  if (health && health.availability && health.availability.percentage < 95) return '🔴';
  if (health && health.requests && health.requests.errorRate > 5) return '🟡';
  return '🟢';
}

/**
 * Format time ago
 */
function timeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Display environment status
 */
async function displayEnvironmentStatus(environment) {
  const deployment = await loadDeploymentStatus(environment);
  const monitoring = await loadMonitoringData(environment);
  const history = await getDeploymentHistory(environment, 3);
  
  const config = deploymentConfig.getEnvironmentConfig(environment);
  const status = getStatusIndicator(deployment.status, monitoring?.metrics);
  
  console.log(`${status} ${config.name} (${environment})`);
  console.log(`   URL: ${config.url}`);
  
  if (deployment.build_version) {
    console.log(`   Version: ${deployment.build_version}`);
    console.log(`   Deployed: ${timeAgo(deployment.deployed_at)} by ${deployment.deployed_by}`);
  } else {
    console.log(`   Status: ${deployment.error || 'No deployment found'}`);
  }
  
  if (monitoring?.metrics) {
    const metrics = monitoring.metrics;
    console.log(`   Health: ${metrics.availability.percentage}% uptime, ${metrics.requests.errorRate}% errors`);
    console.log(`   Performance: ${metrics.performance.avgResponseTime}ms avg response`);
  }
  
  if (history.length > 0) {
    console.log(`   Recent activity: ${history.length} rollback(s), last ${timeAgo(history[0].initiated_at)}`);
  }
  
  console.log('');
}

/**
 * Display overall dashboard
 */
async function displayDashboard() {
  console.clear();
  console.log('🚀 SMARTIES Deployment Status Dashboard');
  console.log('═'.repeat(60));
  console.log(`📅 ${new Date().toLocaleString()}`);
  console.log('');
  
  const environments = Object.keys(deploymentConfig.environments);
  
  for (const environment of environments) {
    await displayEnvironmentStatus(environment);
  }
  
  console.log('Legend: 🟢 Healthy | 🟡 Warning | 🔴 Critical | ❓ Unknown');
  console.log('');
  console.log('Commands:');
  console.log('  npm run deploy:health-check <url>  - Run health check');
  console.log('  npm run deploy:monitor <url> <env> - Start monitoring');
  console.log('  npm run deploy:rollback <env>      - Rollback deployment');
  console.log('  npm run deploy:report <env>        - Generate report');
}

/**
 * Display detailed environment info
 */
async function displayEnvironmentDetails(environment) {
  try {
    const deployment = await loadDeploymentStatus(environment);
    const monitoring = await loadMonitoringData(environment);
    const history = await getDeploymentHistory(environment, 10);
    const config = deploymentConfig.getEnvironmentConfig(environment);
    
    console.log(`📊 ${config.name} (${environment}) - Detailed Status`);
    console.log('═'.repeat(60));
    console.log('');
    
    // Deployment Info
    console.log('🚀 Current Deployment:');
    if (deployment.build_version) {
      console.log(`  Version: ${deployment.build_version}`);
      console.log(`  Deployment ID: ${deployment.deployment_id}`);
      console.log(`  Deployed: ${new Date(deployment.deployed_at).toLocaleString()}`);
      console.log(`  Deployed by: ${deployment.deployed_by}`);
      console.log(`  Commit: ${deployment.commit_sha}`);
      console.log(`  URL: ${deployment.deployment_url}`);
    } else {
      console.log(`  Status: ${deployment.error || 'No deployment found'}`);
    }
    console.log('');
    
    // Health Metrics
    if (monitoring?.metrics) {
      const metrics = monitoring.metrics;
      console.log('📈 Health Metrics (5min window):');
      console.log(`  Availability: ${metrics.availability.percentage}% (${metrics.availability.successfulChecks}/${metrics.availability.totalChecks} checks)`);
      console.log(`  Requests: ${metrics.requests.total} total, ${metrics.requests.errorRate}% error rate`);
      console.log(`  Performance: ${metrics.performance.avgResponseTime}ms avg, ${metrics.performance.p95ResponseTime}ms p95`);
      console.log(`  Errors: ${metrics.errors} in window`);
      console.log('');
    }
    
    // Configuration
    console.log('⚙️ Configuration:');
    console.log(`  Strategy: ${config.deployment?.strategy || 'default'}`);
    console.log(`  Auto Rollback: ${config.autoRollback ? 'enabled' : 'disabled'}`);
    console.log(`  Health Checks: ${config.healthChecks?.enabled ? 'enabled' : 'disabled'}`);
    console.log(`  Monitoring: ${config.monitoring?.enabled ? 'enabled' : 'disabled'}`);
    console.log('');
    
    // Recent History
    if (history.length > 0) {
      console.log('📜 Recent Rollbacks:');
      history.forEach((rollback, index) => {
        const status = rollback.status === 'completed' ? '✅' : '❌';
        console.log(`  ${status} ${timeAgo(rollback.initiated_at)}: ${rollback.from_version} → ${rollback.to_version}`);
        console.log(`     Reason: ${rollback.reason}`);
        console.log(`     By: ${rollback.initiated_by}`);
        if (index < history.length - 1) console.log('');
      });
    } else {
      console.log('📜 No recent rollbacks');
    }
    
  } catch (error) {
    console.error(`❌ Failed to load details for ${environment}: ${error.message}`);
  }
}

/**
 * Generate summary report
 */
async function generateSummaryReport() {
  const environments = Object.keys(deploymentConfig.environments);
  const summary = {
    total: environments.length,
    healthy: 0,
    warning: 0,
    critical: 0,
    unknown: 0,
    environments: {}
  };
  
  for (const environment of environments) {
    const deployment = await loadDeploymentStatus(environment);
    const monitoring = await loadMonitoringData(environment);
    
    let status = 'unknown';
    if (deployment.build_version) {
      if (monitoring?.metrics) {
        const metrics = monitoring.metrics;
        if (metrics.availability.percentage >= 99 && metrics.requests.errorRate <= 1) {
          status = 'healthy';
        } else if (metrics.availability.percentage >= 95 && metrics.requests.errorRate <= 5) {
          status = 'warning';
        } else {
          status = 'critical';
        }
      } else {
        status = 'healthy'; // Assume healthy if deployed but no monitoring data
      }
    }
    
    summary[status]++;
    summary.environments[environment] = {
      status,
      deployment,
      monitoring: monitoring?.metrics
    };
  }
  
  console.log('📊 SMARTIES Deployment Summary Report');
  console.log('═'.repeat(50));
  console.log(`Generated: ${new Date().toLocaleString()}`);
  console.log('');
  
  console.log('🎯 Overall Status:');
  console.log(`  🟢 Healthy: ${summary.healthy}/${summary.total}`);
  console.log(`  🟡 Warning: ${summary.warning}/${summary.total}`);
  console.log(`  🔴 Critical: ${summary.critical}/${summary.total}`);
  console.log(`  ❓ Unknown: ${summary.unknown}/${summary.total}`);
  console.log('');
  
  const healthPercentage = Math.round((summary.healthy / summary.total) * 100);
  console.log(`📈 Overall Health: ${healthPercentage}%`);
  
  return summary;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];
  
  try {
    switch (command) {
      case 'dashboard':
      case undefined:
        await displayDashboard();
        break;
        
      case 'details':
        if (!environment) {
          console.error('❌ Environment is required for details command');
          process.exit(1);
        }
        await displayEnvironmentDetails(environment);
        break;
        
      case 'summary':
        await generateSummaryReport();
        break;
        
      case 'watch':
        console.log('👀 Watching deployment status (press Ctrl+C to stop)...');
        const watchLoop = async () => {
          await displayDashboard();
          setTimeout(watchLoop, 30000); // Update every 30 seconds
        };
        watchLoop();
        break;
        
      default:
        console.log('📊 SMARTIES Deployment Status');
        console.log('');
        console.log('Usage:');
        console.log('  node deployment-status.js [dashboard]     - Show status dashboard');
        console.log('  node deployment-status.js details <env>   - Show detailed environment status');
        console.log('  node deployment-status.js summary         - Show summary report');
        console.log('  node deployment-status.js watch           - Watch status (auto-refresh)');
        console.log('');
        console.log('Available environments:');
        Object.keys(deploymentConfig.environments).forEach(env => {
          console.log(`  - ${env}`);
        });
        break;
    }
    
  } catch (error) {
    console.error(`❌ Operation failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown for watch mode
process.on('SIGINT', () => {
  console.log('\n👋 Goodbye!');
  process.exit(0);
});

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  displayDashboard,
  displayEnvironmentDetails,
  generateSummaryReport,
  loadDeploymentStatus,
  loadMonitoringData
};