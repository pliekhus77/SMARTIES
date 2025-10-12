import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ResponseFormatter } from './responseFormatter';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimitManager {
  // General API rate limit
  static general(): any {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // 1000 requests per window
      message: ResponseFormatter.error('Too many requests, please try again later'),
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json(ResponseFormatter.error('Rate limit exceeded'));
      }
    });
  }

  // Strict rate limit for expensive operations
  static strict(): any {
    return rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 100, // 100 requests per window
      message: ResponseFormatter.error('Rate limit exceeded for this operation'),
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json(ResponseFormatter.error('Rate limit exceeded for expensive operations'));
      }
    });
  }

  // Lenient rate limit for fast operations
  static lenient(): any {
    return rateLimit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 200, // 200 requests per minute
      message: ResponseFormatter.error('Rate limit exceeded'),
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true, // Don't count successful requests
      handler: (req: Request, res: Response) => {
        res.status(429).json(ResponseFormatter.error('Rate limit exceeded'));
      }
    });
  }

  // Custom rate limit
  static custom(config: RateLimitConfig): any {
    return rateLimit({
      windowMs: config.windowMs,
      max: config.max,
      message: ResponseFormatter.error(config.message || 'Rate limit exceeded'),
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json(ResponseFormatter.error(config.message || 'Rate limit exceeded'));
      }
    });
  }
}

// Usage monitoring
export interface UsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  endpointStats: { [endpoint: string]: EndpointStats };
}

export interface EndpointStats {
  requests: number;
  successRate: number;
  averageResponseTime: number;
  lastAccessed: Date;
}

export class UsageMonitor {
  private static instance: UsageMonitor;
  private stats: UsageStats;
  private startTime: Date;

  private constructor() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      endpointStats: {}
    };
    this.startTime = new Date();
  }

  static getInstance(): UsageMonitor {
    if (!UsageMonitor.instance) {
      UsageMonitor.instance = new UsageMonitor();
    }
    return UsageMonitor.instance;
  }

  middleware() {
    return (req: Request, res: Response, next: Function) => {
      const startTime = Date.now();
      const endpoint = `${req.method} ${req.route?.path || req.path}`;

      // Initialize endpoint stats if not exists
      if (!this.stats.endpointStats[endpoint]) {
        this.stats.endpointStats[endpoint] = {
          requests: 0,
          successRate: 0,
          averageResponseTime: 0,
          lastAccessed: new Date()
        };
      }

      // Track request
      this.stats.totalRequests++;
      this.stats.endpointStats[endpoint].requests++;
      this.stats.endpointStats[endpoint].lastAccessed = new Date();

      // Track response
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const isSuccess = res.statusCode < 400;

        if (isSuccess) {
          this.stats.successfulRequests++;
        } else {
          this.stats.failedRequests++;
        }

        // Update average response time
        this.updateAverageResponseTime(responseTime);
        this.updateEndpointStats(endpoint, responseTime, isSuccess);
      });

      next();
    };
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalTime = this.stats.averageResponseTime * (this.stats.totalRequests - 1);
    this.stats.averageResponseTime = (totalTime + responseTime) / this.stats.totalRequests;
  }

  private updateEndpointStats(endpoint: string, responseTime: number, isSuccess: boolean): void {
    const endpointStat = this.stats.endpointStats[endpoint];
    const totalRequests = endpointStat.requests;
    
    // Update average response time
    const totalTime = endpointStat.averageResponseTime * (totalRequests - 1);
    endpointStat.averageResponseTime = (totalTime + responseTime) / totalRequests;

    // Update success rate
    const previousSuccesses = endpointStat.successRate * (totalRequests - 1);
    const newSuccesses = previousSuccesses + (isSuccess ? 1 : 0);
    endpointStat.successRate = newSuccesses / totalRequests;
  }

  getStats(): UsageStats & { uptime: number } {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime.getTime()
    };
  }

  reset(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      endpointStats: {}
    };
    this.startTime = new Date();
  }
}
