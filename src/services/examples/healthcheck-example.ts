/**
 * Example usage of DatabaseService health check functionality
 * Demonstrates requirements 5.1 and 5.5 implementation
 */

import { databaseService, ConnectionState } from '../DatabaseService';

/**
 * Example: Basic health check usage
 */
export async function basicHealthCheckExample(): Promise<void> {
  console.log('=== Basic Health Check Example ===');
  
  try {
    // Connect to database
    await databaseService.connect();
    
    // Perform a simple connection test
    const isConnected = await databaseService.testConnection();
    console.log(`Connection test result: ${isConnected ? 'PASS' : 'FAIL'}`);
    
    // Perform comprehensive health check
    const healthStatus = await databaseService.performHealthCheck();
    console.log('Health Check Results:');
    console.log(`- Overall Status: ${healthStatus.status.toUpperCase()}`);
    console.log(`- Is Healthy: ${healthStatus.isHealthy}`);
    console.log(`- Connectivity: ${healthStatus.checks.connectivity.status}`);
    console.log(`- Response Time: ${healthStatus.checks.responseTime.responseTime}ms`);
    console.log(`- Collections: ${healthStatus.checks.collections.message}`);
    
  } catch (error) {
    console.error('Health check example failed:', error);
  } finally {
    await databaseService.disconnect();
  }
}

/**
 * Example: Connection status monitoring
 */
export async function connectionStatusExample(): Promise<void> {
  console.log('=== Connection Status Example ===');
  
  try {
    // Connect to database
    await databaseService.connect();
    
    // Get detailed connection status
    const connectionStatus = await databaseService.getConnectionStatus();
    
    console.log('Connection Status:');
    console.log(`- Connected: ${connectionStatus.isConnected}`);
    console.log(`- State: ${connectionStatus.state}`);
    console.log(`- Retry Count: ${connectionStatus.retryCount}`);
    console.log(`- Uptime: ${Math.round(connectionStatus.uptime / 1000)}s`);
    console.log(`- Database: ${connectionStatus.configuration.database}`);
    console.log(`- Pool Size: ${connectionStatus.configuration.maxPoolSize}`);
    console.log(`- Last Health Check: ${connectionStatus.lastHealthCheck.toISOString()}`);
    
  } catch (error) {
    console.error('Connection status example failed:', error);
  } finally {
    await databaseService.disconnect();
  }
}

/**
 * Example: Continuous monitoring setup
 */
export async function continuousMonitoringExample(): Promise<void> {
  console.log('=== Continuous Monitoring Example ===');
  
  try {
    // Connect to database
    await databaseService.connect();
    
    // Start monitoring with custom interval (10 seconds)
    console.log('Starting continuous monitoring...');
    await databaseService.startConnectionMonitoring(10000);
    
    // Simulate some work
    console.log('Performing database operations...');
    await databaseService.create('test_collection', { 
      message: 'Health check test',
      timestamp: new Date()
    });
    
    // Wait a bit to see monitoring in action
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Stop monitoring
    console.log('Stopping monitoring...');
    await databaseService.stopConnectionMonitoring();
    
  } catch (error) {
    console.error('Continuous monitoring example failed:', error);
  } finally {
    await databaseService.disconnect();
  }
}

/**
 * Example: Health check in error scenarios
 */
export async function errorScenarioExample(): Promise<void> {
  console.log('=== Error Scenario Example ===');
  
  try {
    // Try health check without connecting first
    console.log('Testing health check without connection...');
    const healthStatusDisconnected = await databaseService.performHealthCheck();
    console.log(`Health status when disconnected: ${healthStatusDisconnected.status}`);
    console.log(`Connectivity check: ${healthStatusDisconnected.checks.connectivity.message}`);
    
    // Get connection status when disconnected
    const connectionStatusDisconnected = await databaseService.getConnectionStatus();
    console.log(`Connection state: ${connectionStatusDisconnected.state}`);
    console.log(`Is connected: ${connectionStatusDisconnected.isConnected}`);
    
  } catch (error) {
    console.error('Error scenario example failed:', error);
  }
}

/**
 * Example: React Native app integration
 */
export class DatabaseHealthMonitor {
  private isMonitoring = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start health monitoring for React Native app
   */
  async startAppHealthMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('Health monitoring already active');
      return;
    }
    
    this.isMonitoring = true;
    console.log('Starting app health monitoring...');
    
    // Initial health check
    await this.performAppHealthCheck();
    
    // Set up periodic health checks (every 30 seconds)
    this.healthCheckInterval = setInterval(async () => {
      await this.performAppHealthCheck();
    }, 30000);
  }
  
  /**
   * Stop health monitoring
   */
  async stopAppHealthMonitoring(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log('App health monitoring stopped');
  }
  
  /**
   * Perform health check and handle results
   */
  private async performAppHealthCheck(): Promise<void> {
    try {
      const healthStatus = await databaseService.performHealthCheck();
      
      if (!healthStatus.isHealthy) {
        console.warn('Database health check failed:', {
          status: healthStatus.status,
          connectivity: healthStatus.checks.connectivity.message,
          responseTime: healthStatus.checks.responseTime.responseTime,
          collections: healthStatus.checks.collections.message
        });
        
        // In a real app, you might:
        // - Show offline mode banner
        // - Attempt reconnection
        // - Cache data locally
        // - Send analytics event
        
        if (healthStatus.checks.connectivity.status === 'fail') {
          console.log('Attempting database reconnection...');
          try {
            await databaseService.connect();
          } catch (reconnectError) {
            console.error('Reconnection failed:', reconnectError);
          }
        }
      } else {
        console.debug('Database health check passed');
      }
      
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }
  
  /**
   * Get current health status for UI display
   */
  async getHealthStatusForUI(): Promise<{
    isOnline: boolean;
    status: string;
    responseTime: number;
    lastCheck: Date;
  }> {
    try {
      const healthStatus = await databaseService.performHealthCheck();
      return {
        isOnline: healthStatus.isHealthy,
        status: healthStatus.status,
        responseTime: healthStatus.checks.responseTime.responseTime || 0,
        lastCheck: healthStatus.timestamp
      };
    } catch (error) {
      return {
        isOnline: false,
        status: 'error',
        responseTime: 0,
        lastCheck: new Date()
      };
    }
  }
}

// Export examples for testing
export const examples = {
  basicHealthCheckExample,
  connectionStatusExample,
  continuousMonitoringExample,
  errorScenarioExample
};

// Example usage (uncomment to run)
// async function runExamples() {
//   await basicHealthCheckExample();
//   await connectionStatusExample();
//   await errorScenarioExample();
//   // Note: continuousMonitoringExample runs for 15 seconds
//   // await continuousMonitoringExample();
// }
// 
// runExamples().catch(console.error);