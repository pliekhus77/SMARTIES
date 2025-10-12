import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from './responseFormatter';

export class APIError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends APIError {
  public errors: string[];

  constructor(errors: string[]) {
    super('Validation failed', 400);
    this.errors = errors;
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class RateLimitError extends APIError {
  constructor() {
    super('Too many requests, please try again later', 429);
  }
}

export class DatabaseError extends APIError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: string[] | undefined;

  // Handle known error types
  if (error instanceof APIError) {
    statusCode = error.statusCode;
    message = error.message;
    
    if (error instanceof ValidationError) {
      errors = error.errors;
    }
  } else if (error.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values((error as any).errors).map((err: any) => err.message);
  } else if (error.name === 'CastError') {
    // MongoDB cast error
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.name === 'MongoError' && (error as any).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Log error for debugging
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Send error response
  if (errors) {
    res.status(statusCode).json(ResponseFormatter.validationError(errors));
  } else {
    res.status(statusCode).json(ResponseFormatter.error(message));
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(ResponseFormatter.error(`Endpoint ${req.path} not found`));
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
