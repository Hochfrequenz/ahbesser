import { ErrorRequestHandler } from 'express';

// Base class for all application errors
export class AppError extends Error {
  constructor(
    public override readonly message: string,
    public readonly statusCode: number,
    public readonly errorCode: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 404 Not Found errors
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

// 400 Bad Request errors
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

// 500 Internal Server Error
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, 'DATABASE_ERROR');
  }
}

// 503 Service Unavailable
export class ExternalServiceError extends AppError {
  constructor(message: string) {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR');
  }
}

export const httpErrorHandler: ErrorRequestHandler = (err, _, res, next) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
    });
  }

  // Handle unexpected errors
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
};
