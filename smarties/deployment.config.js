/**
 * Deployment Configuration for SMARTIES
 * 
 * This file contains environment-specific deployment settings
 * and configuration for the deployment automation pipeline.
 */

module.exports = {
  // Global deployment settings
  global: {
    timeout: 300, // 5 minutes
    healthCheckRetries: 5,
    healthCheckDelay: 30, // seconds
    rollbackOnFailure: true,
    monitoringEnabled: true
  },

  // Environment-specific configurations
  environments: {
    hackathon: {
      name: 'Hackathon Demo',
      url: 'https://smarties-hackathon.demo.app',
      type: 'demo',
      autoRollback: true,
      healthChecks: {
        enabled: true,
        endpoints: [
          '/health',
          '/api/health',
          '/api/health/database'
        ],
        timeout: 10000,
        retries: 3
      },
      monitoring: {
        enabled: true,
        interval: 30000, // 30 seconds
        alertThresholds: {
          responseTime: 3000, // 3 seconds (relaxed for demo)
          errorRate: 0.1, // 10% (relaxed for demo)
          availability: 0.95 // 95% (relaxed for demo)
        }
      },
      deployment: {
        strategy: 'replace', // Simple replacement for demo
        backupEnabled: true,
        preDeploymentTests: false, // Skip for speed in hackathon
        postDeploymentTests: true
      }
    },

    demo: {
      name: 'Demo Environment',
      url: 'https://smarties-demo.demo.app',
      type: 'staging',
      autoRollback: true,
      healthChecks: {
        enabled: true,
        endpoints: [
          '/health',
          '/api/health',
          '/api/health/database',
          '/api/health/external'
        ],
        timeout: 8000,
        retries: 5
      },
      monitoring: {
        enabled: true,
        interval: 60000, // 1 minute
        alertThresholds: {
          responseTime: 2000, // 2 seconds
          errorRate: 0.05, // 5%
          availability: 0.98 // 98%
        }
      },
      deployment: {
        strategy: 'blue-green',
        backupEnabled: true,
        preDeploymentTests: true,
        postDeploymentTests: true,
        smokeTests: true
      }
    },

    staging: {
      name: 'Staging Environment',
      url: 'https://smarties-staging.demo.app',
      type: 'staging',
      autoRollback: true,
      healthChecks: {
        enabled: true,
        endpoints: [
          '/health',
          '/api/health',
          '/api/health/database',
          '/api/health/external',
          '/api/health/performance'
        ],
        timeout: 5000,
        retries: 5
      },
      monitoring: {
        enabled: true,
        interval: 30000, // 30 seconds
        alertThresholds: {
          responseTime: 1500, // 1.5 seconds
          errorRate: 0.02, // 2%
          availability: 0.99 // 99%
        }
      },
      deployment: {
        strategy: 'blue-green',
        backupEnabled: true,
        preDeploymentTests: true,
        postDeploymentTests: true,
        smokeTests: true,
        performanceTests: true
      }
    },

    production: {
      name: 'Production Environment',
      url: 'https://smarties.app',
      type: 'production',
      autoRollback: true,
      healthChecks: {
        enabled: true,
        endpoints: [
          '/health',
          '/api/health',
          '/api/health/database',
          '/api/health/external',
          '/api/health/performance'
        ],
        timeout: 5000,
        retries: 5
      },
      monitoring: {
        enabled: true,
        interval: 15000, // 15 seconds
        alertThresholds: {
          responseTime: 1000, // 1 second
          errorRate: 0.01, // 1%
          availability: 0.999 // 99.9%
        }
      },
      deployment: {
        strategy: 'canary',
        backupEnabled: true,
        preDeploymentTests: true,
        postDeploymentTests: true,
        smokeTests: true,
        performanceTests: true,
        securityTests: true,
        approvalRequired: true
      }
    }
  },

  // Deployment strategies
  strategies: {
    replace: {
      name: 'Simple Replace',
      description: 'Stop old version, deploy new version',
      downtime: true,
      rollbackTime: 'fast'
    },
    'blue-green': {
      name: 'Blue-Green Deployment',
      description: 'Deploy to new environment, switch traffic',
      downtime: false,
      rollbackTime: 'instant'
    },
    canary: {
      name: 'Canary Deployment',
      description: 'Gradual rollout with traffic splitting',
      downtime: false,
      rollbackTime: 'fast',
      trafficSplit: [10, 25, 50, 100] // Percentage stages
    }
  },

  // Notification settings
  notifications: {
    slack: {
      enabled: process.env.SLACK_WEBHOOK_URL ? true : false,
      webhook: process.env.SLACK_WEBHOOK_URL,
      channels: {
        deployments: '#deployments',
        alerts: '#alerts',
        general: '#general'
      }
    },
    email: {
      enabled: false, // Configure as needed
      recipients: []
    }
  },

  // Security settings
  security: {
    requireApproval: {
      production: true,
      staging: false,
      demo: false,
      hackathon: false
    },
    allowedUsers: [], // GitHub usernames
    emergencyUsers: [] // Users who can bypass approvals
  },

  // Backup and rollback settings
  backup: {
    retention: {
      production: 30, // days
      staging: 7,
      demo: 3,
      hackathon: 1
    },
    compression: true,
    encryption: true
  }
};

/**
 * Get configuration for a specific environment
 */
function getEnvironmentConfig(environment) {
  const config = module.exports;
  const envConfig = config.environments[environment];
  
  if (!envConfig) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  
  // Merge with global settings
  return {
    ...config.global,
    ...envConfig,
    environment
  };
}

/**
 * Validate environment configuration
 */
function validateConfig(environment) {
  try {
    const config = getEnvironmentConfig(environment);
    
    // Required fields
    const required = ['name', 'url', 'type'];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate URL
    try {
      new URL(config.url);
    } catch (error) {
      throw new Error(`Invalid URL: ${config.url}`);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Configuration validation failed: ${error.message}`);
    return false;
  }
}

module.exports.getEnvironmentConfig = getEnvironmentConfig;
module.exports.validateConfig = validateConfig;