#!/usr/bin/env node

/**
 * Health Check Script for SMARTIES Deployment
 * 
 * This script performs comprehensive health checks on the deployed application
 * to ensure it's functioning correctly before marking deployment as successful.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const config = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 2000, // 2 seconds
  checks: {
    basic: true,
    api: true,
    database: true,
    external: true
  }
};

// Health check results
const results = {
  passed: 0,
  failed: 0,
  checks: []
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
      timeout: config.timeout,
      headers: {
        'User-Agent': 'SMARTIES-HealthCheck/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Perform a single health check with retries
 */
async function performCheck(name, checkFunction) {
  console.log(`🔍 Running check: ${name}`);
  
  for (let attempt = 1; attempt <= config.retries; attempt++) {
    try {
      const result = await checkFunction();
      
      if (result.success) {
        console.log(`  ✅ ${name} - ${result.message}`);
        results.passed++;
        results.checks.push({
          name,
          status: 'passed',
          message: result.message,
          attempt
        });
        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.log(`  ⚠️ ${name} - Attempt ${attempt}/${config.retries}: ${error.message}`);
      
      if (attempt === config.retries) {
        console.log(`  ❌ ${name} - All attempts failed`);
        results.failed++;
        results.checks.push({
          name,
          status: 'failed',
          message: error.message,
          attempts: config.retries
        });
        return false;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, config.retryDelay));
    }
  }
}

/**
 * Basic application availability check
 */
async function basicHealthCheck(baseUrl) {
  return performCheck('Basic Application Health', async () => {
    const response = await makeRequest(`${baseUrl}/health`);
    
    if (response.statusCode === 200) {
      return {
        success: true,
        message: `Application responding (${response.statusCode})`
      };
    } else {
      return {
        success: false,
        message: `Unexpected status code: ${response.statusCode}`
      };
    }
  });
}

/**
 * API endpoints health check
 */
async function apiHealthCheck(baseUrl) {
  const endpoints = [
    { path: '/api/health', method: 'GET', expectedStatus: 200 },
    { path: '/api/products/search', method: 'GET', expectedStatus: 200 },
    { path: '/api/user/profile', method: 'GET', expectedStatus: [200, 401] } // May require auth
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    const passed = await performCheck(`API ${endpoint.method} ${endpoint.path}`, async () => {
      const response = await makeRequest(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method
      });
      
      const expectedStatuses = Array.isArray(endpoint.expectedStatus) 
        ? endpoint.expectedStatus 
        : [endpoint.expectedStatus];
      
      if (expectedStatuses.includes(response.statusCode)) {
        return {
          success: true,
          message: `Endpoint responding correctly (${response.statusCode})`
        };
      } else {
        return {
          success: false,
          message: `Unexpected status: ${response.statusCode}, expected: ${expectedStatuses.join(' or ')}`
        };
      }
    });
    
    if (!passed) allPassed = false;
  }

  return allPassed;
}

/**
 * Database connectivity check
 */
async function databaseHealthCheck(baseUrl) {
  return performCheck('Database Connectivity', async () => {
    const response = await makeRequest(`${baseUrl}/api/health/database`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      if (data.database && data.database.status === 'connected') {
        return {
          success: true,
          message: `Database connected (${data.database.responseTime}ms)`
        };
      } else {
        return {
          success: false,
          message: 'Database not connected'
        };
      }
    } else {
      return {
        success: false,
        message: `Database health check failed: ${response.statusCode}`
      };
    }
  });
}

/**
 * External services health check
 */
async function externalServicesCheck(baseUrl) {
  return performCheck('External Services', async () => {
    const response = await makeRequest(`${baseUrl}/api/health/external`);
    
    if (response.statusCode === 200) {
      const data = JSON.parse(response.body);
      const services = data.services || {};
      
      const failedServices = Object.entries(services)
        .filter(([_, status]) => status !== 'healthy')
        .map(([service, _]) => service);
      
      if (failedServices.length === 0) {
        return {
          success: true,
          message: `All external services healthy (${Object.keys(services).length} services)`
        };
      } else {
        return {
          success: false,
          message: `Failed services: ${failedServices.join(', ')}`
        };
      }
    } else {
      return {
        success: false,
        message: `External services check failed: ${response.statusCode}`
      };
    }
  });
}

/**
 * Performance baseline check
 */
async function performanceCheck(baseUrl) {
  return performCheck('Performance Baseline', async () => {
    const startTime = Date.now();
    const response = await makeRequest(`${baseUrl}/api/health`);
    const responseTime = Date.now() - startTime;
    
    if (response.statusCode === 200 && responseTime < 2000) {
      return {
        success: true,
        message: `Response time acceptable (${responseTime}ms)`
      };
    } else if (responseTime >= 2000) {
      return {
        success: false,
        message: `Response time too slow (${responseTime}ms)`
      };
    } else {
      return {
        success: false,
        message: `Health endpoint failed: ${response.statusCode}`
      };
    }
  });
}

/**
 * Main health check function
 */
async function runHealthChecks() {
  const baseUrl = process.env.DEPLOYMENT_URL || process.argv[2];
  
  if (!baseUrl) {
    console.error('❌ Error: No deployment URL provided');
    console.error('Usage: node health-check.js <deployment-url>');
    console.error('   or: DEPLOYMENT_URL=<url> node health-check.js');
    process.exit(1);
  }

  console.log('🏥 SMARTIES Health Check Starting...');
  console.log(`🌐 Target URL: ${baseUrl}`);
  console.log(`⚙️ Configuration: ${config.retries} retries, ${config.timeout}ms timeout`);
  console.log('');

  const startTime = Date.now();

  // Run all health checks
  const checks = [];
  
  if (config.checks.basic) {
    checks.push(basicHealthCheck(baseUrl));
  }
  
  if (config.checks.api) {
    checks.push(apiHealthCheck(baseUrl));
  }
  
  if (config.checks.database) {
    checks.push(databaseHealthCheck(baseUrl));
  }
  
  if (config.checks.external) {
    checks.push(externalServicesCheck(baseUrl));
  }
  
  // Performance check
  checks.push(performanceCheck(baseUrl));

  // Wait for all checks to complete
  await Promise.all(checks);

  const totalTime = Date.now() - startTime;
  const totalChecks = results.passed + results.failed;

  console.log('');
  console.log('📊 Health Check Summary:');
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  📈 Success Rate: ${Math.round((results.passed / totalChecks) * 100)}%`);
  console.log(`  ⏱️ Total Time: ${totalTime}ms`);
  console.log('');

  // Detailed results
  if (process.env.VERBOSE === 'true') {
    console.log('📋 Detailed Results:');
    results.checks.forEach(check => {
      const status = check.status === 'passed' ? '✅' : '❌';
      console.log(`  ${status} ${check.name}: ${check.message}`);
    });
    console.log('');
  }

  // Exit with appropriate code
  if (results.failed === 0) {
    console.log('🎉 All health checks passed! Deployment is healthy.');
    process.exit(0);
  } else {
    console.log('💥 Some health checks failed! Deployment may have issues.');
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error during health checks:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n⚠️ Health checks interrupted by user');
  process.exit(1);
});

// Run health checks if this script is executed directly
if (require.main === module) {
  runHealthChecks().catch(error => {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runHealthChecks,
  makeRequest,
  performCheck
};