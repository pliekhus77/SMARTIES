/**
 * Database Connection Pooling Service for SMARTIES application
 * Implements Task 6.2: Database connection pooling and error handling
 * 
 * Features:
 * - Connection pool management with configurable limits
 * - Connection health monitoring and recovery
 * - Load balancing across multiple connections
 * - Error handling and retry logic
 */

/**
 * Connection pool configuration
 */
export interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
}

/**
 * Connection wrapper with metadata
 */
export interface PooledConnection {
  id: string;
  connection: any;
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  errorCount: number;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalAcquired: number;
  totalReleased: number;
  totalErrors: number;
}

/**
 * Database Connection Pool Service
 */
export class ConnectionPoolService {
  private connections: Map<string, PooledConnection> = new Map();
  private waitingQueue: Array<{
    resolve: (connection: PooledConnection) => void;
    reject: (error: Error) => void;
    timestamp: Date;
  }> = [];
  
  private config: PoolConfig;
  private stats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    totalAcquired: 0,
    totalReleased: 0,
    totalErrors: 0
  };

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      minConnections: 2,
      maxConnections: 10,
      acquireTimeoutMs: 30000,
      idleTimeoutMs: 300000, // 5 minutes
      maxRetries: 3,
      retryDelayMs: 1000,
      ...config
    };

    this.startMaintenanceTask();
    console.log('🔗 Connection pool service initialized');
  }

  /**
   * Acquire a connection from the pool
   */
  async acquireConnection(): Promise<PooledConnection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeFromWaitingQueue(resolve);
        reject(new Error(`Connection acquire timeout after ${this.config.acquireTimeoutMs}ms`));
      }, this.config.acquireTimeoutMs);

      const handleConnection = (connection: PooledConnection) => {
        clearTimeout(timeout);
        resolve(connection);
      };

      const handleError = (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      };

      // Try to get an available connection immediately
      const availableConnection = this.getAvailableConnection();
      if (availableConnection) {
        this.markConnectionActive(availableConnection);
        this.stats.totalAcquired++;
        handleConnection(availableConnection);
        return;
      }

      // Try to create a new connection if under limit
      if (this.connections.size < this.config.maxConnections) {
        this.createConnection()
          .then(connection => {
            this.markConnectionActive(connection);
            this.stats.totalAcquired++;
            handleConnection(connection);
          })
          .catch(handleError);
        return;
      }

      // Add to waiting queue
      this.waitingQueue.push({
        resolve: handleConnection,
        reject: handleError,
        timestamp: new Date()
      });
      this.stats.waitingRequests++;
    });
  }

  /**
   * Release a connection back to the pool
   */
  releaseConnection(connection: PooledConnection): void {
    const pooledConnection = this.connections.get(connection.id);
    if (!pooledConnection) {
      console.warn(`Attempted to release unknown connection: ${connection.id}`);
      return;
    }

    // Mark as inactive
    pooledConnection.isActive = false;
    pooledConnection.lastUsed = new Date();
    this.stats.totalReleased++;

    // Update stats
    this.updateStats();

    // Process waiting queue
    this.processWaitingQueue();

    console.log(`🔗 Connection ${connection.id} released to pool`);
  }

  /**
   * Get an available connection from the pool
   */
  private getAvailableConnection(): PooledConnection | null {
    for (const connection of this.connections.values()) {
      if (!connection.isActive && connection.errorCount < this.config.maxRetries) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<PooledConnection> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // In a real implementation, this would create an actual database connection
      const mockConnection = {
        id: connectionId,
        connect: () => Promise.resolve(),
        query: (sql: string) => Promise.resolve([]),
        close: () => Promise.resolve()
      };

      const pooledConnection: PooledConnection = {
        id: connectionId,
        connection: mockConnection,
        isActive: false,
        lastUsed: new Date(),
        createdAt: new Date(),
        errorCount: 0
      };

      this.connections.set(connectionId, pooledConnection);
      this.stats.totalConnections++;
      
      console.log(`🔗 Created new connection: ${connectionId}`);
      return pooledConnection;
    } catch (error) {
      this.stats.totalErrors++;
      throw new Error(`Failed to create connection: ${error}`);
    }
  }

  /**
   * Mark connection as active
   */
  private markConnectionActive(connection: PooledConnection): void {
    connection.isActive = true;
    connection.lastUsed = new Date();
    this.updateStats();
  }

  /**
   * Process waiting queue when connections become available
   */
  private processWaitingQueue(): void {
    while (this.waitingQueue.length > 0) {
      const availableConnection = this.getAvailableConnection();
      if (!availableConnection) break;

      const waiter = this.waitingQueue.shift();
      if (waiter) {
        this.markConnectionActive(availableConnection);
        this.stats.totalAcquired++;
        this.stats.waitingRequests--;
        waiter.resolve(availableConnection);
      }
    }
  }

  /**
   * Remove a specific resolver from waiting queue
   */
  private removeFromWaitingQueue(resolve: (connection: PooledConnection) => void): void {
    const index = this.waitingQueue.findIndex(waiter => waiter.resolve === resolve);
    if (index !== -1) {
      this.waitingQueue.splice(index, 1);
      this.stats.waitingRequests--;
    }
  }

  /**
   * Update pool statistics
   */
  private updateStats(): void {
    this.stats.activeConnections = Array.from(this.connections.values())
      .filter(conn => conn.isActive).length;
    this.stats.idleConnections = this.connections.size - this.stats.activeConnections;
  }

  /**
   * Start maintenance task for connection cleanup
   */
  private startMaintenanceTask(): void {
    setInterval(() => {
      this.performMaintenance();
    }, 60000); // Run every minute
  }

  /**
   * Perform pool maintenance
   */
  private performMaintenance(): void {
    const now = Date.now();
    const connectionsToRemove: string[] = [];

    // Check for idle connections to close
    for (const [id, connection] of this.connections.entries()) {
      const idleTime = now - connection.lastUsed.getTime();
      
      // Remove idle connections beyond timeout (but keep minimum)
      if (!connection.isActive && 
          idleTime > this.config.idleTimeoutMs && 
          this.connections.size > this.config.minConnections) {
        connectionsToRemove.push(id);
      }

      // Remove connections with too many errors
      if (connection.errorCount >= this.config.maxRetries) {
        connectionsToRemove.push(id);
      }
    }

    // Remove identified connections
    connectionsToRemove.forEach(id => {
      const connection = this.connections.get(id);
      if (connection) {
        try {
          // Close the actual connection
          if (connection.connection.close) {
            connection.connection.close();
          }
        } catch (error) {
          console.warn(`Error closing connection ${id}:`, error);
        }
        
        this.connections.delete(id);
        this.stats.totalConnections--;
        console.log(`🔗 Removed connection ${id} during maintenance`);
      }
    });

    // Ensure minimum connections
    this.ensureMinimumConnections();

    // Update stats
    this.updateStats();

    // Log maintenance summary
    if (connectionsToRemove.length > 0) {
      console.log(`🧹 Pool maintenance: removed ${connectionsToRemove.length} connections`);
    }
  }

  /**
   * Ensure minimum number of connections
   */
  private async ensureMinimumConnections(): Promise<void> {
    while (this.connections.size < this.config.minConnections) {
      try {
        await this.createConnection();
      } catch (error) {
        console.error('Failed to create minimum connection:', error);
        break; // Don't keep trying if creation fails
      }
    }
  }

  /**
   * Handle connection error
   */
  handleConnectionError(connection: PooledConnection, error: Error): void {
    connection.errorCount++;
    this.stats.totalErrors++;
    
    console.warn(`🔗 Connection ${connection.id} error (count: ${connection.errorCount}):`, error.message);

    // If connection has too many errors, mark for removal
    if (connection.errorCount >= this.config.maxRetries) {
      connection.isActive = false;
      console.warn(`🔗 Connection ${connection.id} marked for removal due to excessive errors`);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get pool health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for health issues
    if (stats.waitingRequests > 5) {
      issues.push(`High number of waiting requests: ${stats.waitingRequests}`);
      recommendations.push('Consider increasing maxConnections');
    }

    if (stats.totalErrors > stats.totalAcquired * 0.1) {
      issues.push(`High error rate: ${stats.totalErrors} errors out of ${stats.totalAcquired} acquisitions`);
      recommendations.push('Check database connectivity and query performance');
    }

    if (stats.activeConnections === stats.totalConnections && stats.totalConnections === this.config.maxConnections) {
      issues.push('All connections are active at maximum pool size');
      recommendations.push('Consider increasing maxConnections or optimizing query performance');
    }

    const isHealthy = issues.length === 0;

    return { isHealthy, issues, recommendations };
  }

  /**
   * Close all connections and shutdown pool
   */
  async shutdown(): Promise<void> {
    console.log('🔗 Shutting down connection pool...');

    // Reject all waiting requests
    this.waitingQueue.forEach(waiter => {
      waiter.reject(new Error('Connection pool is shutting down'));
    });
    this.waitingQueue = [];

    // Close all connections
    const closePromises = Array.from(this.connections.values()).map(async connection => {
      try {
        if (connection.connection.close) {
          await connection.connection.close();
        }
      } catch (error) {
        console.warn(`Error closing connection ${connection.id}:`, error);
      }
    });

    await Promise.all(closePromises);
    this.connections.clear();
    
    // Reset stats
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      totalAcquired: 0,
      totalReleased: 0,
      totalErrors: 0
    };

    console.log('🔗 Connection pool shutdown complete');
  }
}

export default ConnectionPoolService;
