import { Request, Response, NextFunction } from 'express';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// Error handler middleware for Express
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`Error: ${err.message}`);
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        status: err.statusCode
      }
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        message: err.message,
        status: 400
      }
    });
  }
  
  // Handle database errors
  if (err.name === 'DatabaseError' || err.message.includes('database')) {
    return res.status(503).json({
      error: {
        message: 'Database service unavailable',
        status: 503
      }
    });
  }
  
  // Handle external API errors
  if (err.name === 'AxiosError') {
    const axiosError = err as any;
    return res.status(502).json({
      error: {
        message: `External API error: ${axiosError.response?.data?.message || axiosError.message}`,
        status: 502
      }
    });
  }
  
  // Default error response
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      status: 500
    }
  });
}

// Function to wrap async route handlers
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}