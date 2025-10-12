import { Request, Response, NextFunction } from 'express';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
  responseTime?: number;
  timestamp?: string;
  requestId?: string;
}

export interface PaginatedResponse<T = any> extends APIResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ResponseFormatter {
  static success<T>(data: T, responseTime?: number): APIResponse<T> {
    return {
      success: true,
      data,
      responseTime,
      timestamp: new Date().toISOString()
    };
  }

  static error(message: string, responseTime?: number): APIResponse {
    return {
      success: false,
      error: message,
      responseTime,
      timestamp: new Date().toISOString()
    };
  }

  static validationError(errors: string[], responseTime?: number): APIResponse {
    return {
      success: false,
      error: 'Validation failed',
      errors,
      responseTime,
      timestamp: new Date().toISOString()
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    responseTime?: number
  ): PaginatedResponse<T[]> {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      },
      responseTime,
      timestamp: new Date().toISOString()
    };
  }
}

export function addResponseHelpers(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  res.success = function<T>(data: T) {
    const responseTime = Date.now() - startTime;
    return this.json(ResponseFormatter.success(data, responseTime));
  };

  res.error = function(message: string, statusCode: number = 500) {
    const responseTime = Date.now() - startTime;
    return this.status(statusCode).json(ResponseFormatter.error(message, responseTime));
  };

  res.validationError = function(errors: string[]) {
    const responseTime = Date.now() - startTime;
    return this.status(400).json(ResponseFormatter.validationError(errors, responseTime));
  };

  res.paginated = function<T>(data: T[], page: number, limit: number, total: number) {
    const responseTime = Date.now() - startTime;
    return this.json(ResponseFormatter.paginated(data, page, limit, total, responseTime));
  };

  next();
}

// Extend Express Response interface
declare global {
  namespace Express {
    interface Response {
      success<T>(data: T): Response;
      error(message: string, statusCode?: number): Response;
      validationError(errors: string[]): Response;
      paginated<T>(data: T[], page: number, limit: number, total: number): Response;
    }
  }
}
