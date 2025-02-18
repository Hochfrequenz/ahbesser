import { ErrorRequestHandler } from 'express';

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    // Fix prototype chain for instanceof to work
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export const httpErrorHandler: ErrorRequestHandler = (err, _, res, next) => {
  console.error('Error:', err);

  if (err instanceof NotFoundError) {
    console.log('Handling NotFoundError:', err.message);
    return res.status(404).json({
      error: 'NotFoundError',
      message: err.message,
    });
  }

  console.error('Unhandled error:', err instanceof Error ? err.message : 'Unknown error');
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Internal server error',
  });
};
