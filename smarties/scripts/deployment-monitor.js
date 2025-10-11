#!/usr/bin/env node

/**
 * Deployment Monitoring Script for SMARTIES
 * 
 * This script monitors deployment health and performance metrics
 * to ensure deployments are stable and performing well.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const config = {
  monitoringInterval: 30000, // 30 seconds
  alertThresholds: {
    responseTime: 2000, // 2 seconds
    errorRate: 0.05, // 5%
    availability: 0.99 // 99%
  },
  metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
  healthCheckTimeout: 10000, // 10 seconds
  maxConsecutiveFailures: 3
};

// Metrics storage
const metrics = {
  requests: [],
  errors: [],
  responseTimes: [],
  availability: [],
  alerts: []
};

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      timeout: config.healthCheckTimeout,
      headers: {
        'User-Agent': 'SMARTIES-Monitor/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const startTime = Date.now();
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime
        });
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      reject({
        error: error.message,
        responseTime
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      reject({
        error: 'Request timeout',
        responseTime
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Perform health check and collect metrics
 */
async function performHealthCheck(deploymentUrl) {
  const timestamp = Date.now();
  
  try {
    const response = await makeRequest(`${deploymentUrl}/api/health`);
    
    // Record successful request
    metrics.requests.push({
      timestamp,
      success: true,
      statusCode: response.statusCode,
      responseTime: response.responseTime
    });
    
    metrics.responseTimes.push({
      timestamp,
      responseTime: response.responseTime
    });
    
    // Check if response indicates healthy status
    const isHealthy = response.statusCode === 200;
    
    metrics.availability.push({
      timestamp,
      available: isHealthy
    });
    
    if (!isHealthy) {
      metrics.errors.push({
        timestamp,
        type: 'unhealthy_response',
        statusCode: response.statusCode,
        message: `Health check returned ${response.statusCode}`
      });
    }
    
    return {
      success: isHealthy,
      responseTime: response.responseTime,
      statusCode: response.statusCode
    };
    
  } catch (error) {
    // Record failed request
    metrics.requests.push({
      timestamp,
      success: false,
      error: error.error,
      responseTime: error.responseTime || config.healthCheckTimeout
    });
    
    metrics.errors.push({
      timestamp,
      type: 'request_failure',
      error: error.error,
      responseTime: error.responseTime
    });
    
    metrics.availability.push({
      timestamp,
      available: false
    });
    
    return {
      success: false,
      error: error.error,
      responseTime: error.responseTime
    };
  }
}

/**
 * Calculate metrics for a time window
 */
function calculateMetrics(windowMs = 5 * 60 * 1000) { // 5 minutes default
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Filter metrics to window
  const windowRequests = metrics.requests.filter(r => r.timestamp >= windowStart);
  const windowErrors = metrics.errors.filter(e => e.timestamp >= windowStart);
  const windowResponseTimes = metrics.responseTimes.filter(rt => rt.timestamp >= windowStart);
  const windowAvailability = metrics.availability.filter(a => a.timestamp >= windowStart);
  
  // Calculate statistics
  const totalRequests = windowRequests.length;
  const successfulRequests = windowRequests.filter(r => r.success).length;
  const errorRate = totalRequests > 0 ? (totalRequests - successfulRequests) / totalRequests : 0;
  
  const responseTimes = windowResponseTimes.map(rt => rt.responseTime);
  const avgResponseTime = responseTimes.length > 0 
    ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length 
    : 0;
  
  const p95ResponseTime = responseTimes.length > 0
    ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
    : 0;
  
  const availableChecks = windowAvailability.filter(a => a.available).length;
  const availability = windowAvailability.length > 0 
    ? availableChecks / windowAvailability.length 
    : 0;
  
  return {
    window: {
      start: new Date(windowStart).toISOString(),
      end: new Date(now).toISOString(),
      duration: windowMs
    },
    requests: {
      total: totalRequests,
      successful: successfulRequests,
      failed: totalRequests - successfulRequests,
      errorRate: Math.round(errorRate * 10000) / 100 // Percentage with 2 decimals
    },
    performance: {
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0
    },
    availability: {
      percentage: Math.round(availability * 10000) / 100, // Percentage with 2 decimals
      totalChecks: windowAvailability.length,
      successfulChecks: availableChecks
    },
    errors: windowErrors.length
  };
}

/**
 * Check for alert conditions
 */
function checkAlerts(currentMetrics) {
  const alerts = [];
  const timestamp = Date.now();
  
  // Response time alert
  if (currentMetrics.performance.avgResponseTime > config.alertThresholds.responseTime) {
    alerts.push({
      timestamp,
      type: 'performance',
      severity: 'warning',
      message: `Average response time (${currentMetrics.performance.avgResponseTime}ms) exceeds threshold (${config.alertThresholds.responseTime}ms)`,
      value: currentMetrics.performance.avgResponseTime,
      threshold: config.alertThresholds.responseTime
    });
  }
  
  // Error rate alert
  if (currentMetrics.requests.errorRate / 100 > config.alertThresholds.errorRate) {
    alerts.push({
      timestamp,
      type: 'reliability',
      severity: 'critical',
      message: `Error rate (${currentMetrics.requests.errorRate}%) exceeds threshold (${config.alertThresholds.errorRate * 100}%)`,
      value: currentMetrics.requests.errorRate / 100,
      threshold: config.alertThresholds.errorRate
    });
  }
  
  // Availability alert
  if (currentMetrics.availability.percentage / 100 < config.alertThresholds.availability) {
    alerts.push({
      timestamp,
      type: 'availability',
      severity: 'critical',
      message: `Availability (${currentMetrics.availability.percentage}%) below threshold (${config.alertThresholds.availability * 100}%)`,
      value: currentMetrics.availability.percentage / 100,
      threshold: config.alertThresholds.availability
    });
  }
  
  // Store alerts
  alerts.forEach(alert => {
    metrics.alerts.push(alert);
    console.log(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
  });
  
  return alerts;
}

/**
 * Clean old metrics data
 */
function cleanOldMetrics() {
  const cutoff = Date.now() - config.metricsRetention;
  
  metrics.requests = metrics.requests.filter(r => r.timestamp >= cutoff);
  metrics.errors = metrics.errors.filter(e => e.timestamp >= cutoff);
  metrics.responseTimes = metrics.responseTimes.filter(rt => rt.timestamp >= cutoff);
  metrics.availability = metrics.availability.filter(a => a.timestamp >= cutoff);
  metrics.alerts = metrics.alerts.filter(a => a.timestamp >= cutoff);
}

/**
 * Save metrics to file
 */
async function saveMetrics(environment) {
  try {
    const metricsDir = path.join('./monitoring', environment);
    await fs.mkdir(metricsDir, { recursive: true });
    
    const metricsFile = path.join(metricsDir, `metrics-${Date.now()}.json`);
    const currentMetrics = calculateMetrics();
    
    const metricsData = {
      timestamp: new Date().toISOString(),
      environment,
      metrics: currentMetrics,
      rawData: {
        requests: metrics.requests.slice(-100), // Keep last 100 requests
        errors: metrics.errors.slice(-50), // Keep last 50 errors
        alerts: metrics.alerts.slice(-20) // Keep last 20 alerts
      }
    };
    
    await fs.writeFile(metricsFile, JSON.stringify(metricsData, null, 2));
    
    // Also save as latest.json for easy access
    const latestFile = path.join(metricsDir, 'latest.json');
    await fs.writeFile(latestFile, JSON.stringify(metricsData, null, 2));
    
  } catch (error) {
    console.error(`❌ Failed to save metrics: ${error.message}`);
  }
}

/**
 * Display current status
 */
function displayStatus(currentMetrics) {
  console.clear();
  console.log('📊 SMARTIES Deployment Monitor');
  console.log('═'.repeat(50));
  console.log(`⏰ Last updated: ${new Date().toLocaleString()}`);
  console.log('');
  
  // Requests
  console.log('📈 Request Metrics (5min window):');
  console.log(`  Total Requests: ${currentMetrics.requests.total}`);
  console.log(`  Successful: ${currentMetrics.requests.successful} (${100 - currentMetrics.requests.errorRate}%)`);
  console.log(`  Failed: ${currentMetrics.requests.failed} (${currentMetrics.requests.errorRate}%)`);
  console.log('');
  
  // Performance
  console.log('⚡ Performance Metrics:');
  console.log(`  Avg Response Time: ${currentMetrics.performance.avgResponseTime}ms`);
  console.log(`  95th Percentile: ${currentMetrics.performance.p95ResponseTime}ms`);
  console.log(`  Max Response Time: ${currentMetrics.performance.maxResponseTime}ms`);
  console.log('');
  
  // Availability
  console.log('🟢 Availability:');
  console.log(`  Current: ${currentMetrics.availability.percentage}%`);
  console.log(`  Checks: ${currentMetrics.availability.successfulChecks}/${currentMetrics.availability.totalChecks}`);
  console.log('');
  
  // Recent alerts
  const recentAlerts = metrics.alerts.slice(-5);
  if (recentAlerts.length > 0) {
    console.log('🚨 Recent Alerts:');
    recentAlerts.forEach(alert => {
      const time = new Date(alert.timestamp).toLocaleTimeString();
      const severity = alert.severity === 'critical' ? '🔴' : '🟡';
      console.log(`  ${severity} ${time}: ${alert.message}`);
    });
  } else {
    console.log('✅ No recent alerts');
  }
  
  console.log('');
  console.log('Press Ctrl+C to stop monitoring');
}

/**
 * Start monitoring
 */
async function startMonitoring(deploymentUrl, environment) {
  console.log(`🔍 Starting deployment monitoring for ${environment}`);
  console.log(`🌐 Target URL: ${deploymentUrl}`);
  console.log(`⏱️ Check interval: ${config.monitoringInterval / 1000}s`);
  console.log('');
  
  let consecutiveFailures = 0;
  
  const monitoringLoop = async () => {
    try {
      // Perform health check
      const healthResult = await performHealthCheck(deploymentUrl);
      
      if (healthResult.success) {
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
        
        if (consecutiveFailures >= config.maxConsecutiveFailures) {
          console.log(`💥 CRITICAL: ${consecutiveFailures} consecutive failures detected!`);
          
          // Could trigger automatic rollback here
          if (process.env.AUTO_ROLLBACK === 'true') {
            console.log('🔄 Triggering automatic rollback...');
            // This would call the rollback script
          }
        }
      }
      
      // Calculate current metrics
      const currentMetrics = calculateMetrics();
      
      // Check for alerts
      checkAlerts(currentMetrics);
      
      // Display status
      displayStatus(currentMetrics);
      
      // Clean old data
      cleanOldMetrics();
      
      // Save metrics periodically
      if (Date.now() % (5 * 60 * 1000) < config.monitoringInterval) { // Every 5 minutes
        await saveMetrics(environment);
      }
      
    } catch (error) {
      console.error(`❌ Monitoring error: ${error.message}`);
    }
    
    // Schedule next check
    setTimeout(monitoringLoop, config.monitoringInterval);
  };
  
  // Start monitoring
  monitoringLoop();
}

/**
 * Generate monitoring report
 */
async function generateReport(environment, hours = 24) {
  try {
    const metricsDir = path.join('./monitoring', environment);
    const latestFile = path.join(metricsDir, 'latest.json');
    
    const data = await fs.readFile(latestFile, 'utf8');
    const metricsData = JSON.parse(data);
    
    console.log('📊 SMARTIES Deployment Report');
    console.log('═'.repeat(50));
    console.log(`Environment: ${environment}`);
    console.log(`Report Period: Last ${hours} hours`);
    console.log(`Generated: ${new Date().toLocaleString()}`);
    console.log('');
    
    const metrics = metricsData.metrics;
    
    console.log('📈 Summary:');
    console.log(`  Total Requests: ${metrics.requests.total}`);
    console.log(`  Error Rate: ${metrics.requests.errorRate}%`);
    console.log(`  Avg Response Time: ${metrics.performance.avgResponseTime}ms`);
    console.log(`  Availability: ${metrics.availability.percentage}%`);
    console.log('');
    
    if (metricsData.rawData.alerts.length > 0) {
      console.log('🚨 Alerts Summary:');
      const alertCounts = metricsData.rawData.alerts.reduce((counts, alert) => {
        counts[alert.type] = (counts[alert.type] || 0) + 1;
        return counts;
      }, {});
      
      Object.entries(alertCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} alerts`);
      });
    } else {
      console.log('✅ No alerts in reporting period');
    }
    
  } catch (error) {
    console.error(`❌ Failed to generate report: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const deploymentUrl = args[1];
  const environment = args[2] || 'hackathon';
  
  if (!command) {
    console.log('📊 SMARTIES Deployment Monitor');
    console.log('');
    console.log('Usage:');
    console.log('  node deployment-monitor.js monitor <deployment-url> [environment]');
    console.log('  node deployment-monitor.js report [environment] [hours]');
    console.log('');
    console.log('Examples:');
    console.log('  node deployment-monitor.js monitor https://smarties-hackathon.demo.app hackathon');
    console.log('  node deployment-monitor.js report hackathon 24');
    console.log('');
    console.log('Environment variables:');
    console.log('  AUTO_ROLLBACK=true - Enable automatic rollback on consecutive failures');
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'monitor':
        if (!deploymentUrl) {
          console.error('❌ Deployment URL is required for monitoring');
          process.exit(1);
        }
        await startMonitoring(deploymentUrl, environment);
        break;
        
      case 'report':
        const hours = parseInt(args[2]) || 24;
        await generateReport(environment, hours);
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Operation failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Stopping deployment monitor...');
  
  // Save final metrics
  try {
    await saveMetrics(process.env.ENVIRONMENT || 'hackathon');
    console.log('💾 Final metrics saved');
  } catch (error) {
    console.error('❌ Failed to save final metrics:', error.message);
  }
  
  process.exit(0);
});

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = {
  startMonitoring,
  generateReport,
  calculateMetrics,
  performHealthCheck
};