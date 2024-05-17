import { ErrorRequestHandler } from 'express';

export class NotFoundError extends Error {}

export const httpErrorHandler: ErrorRequestHandler = (err, _, res) => {
  console.error('in error handler');
  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: 'NotFoundError',
      message: err.message,
    });
  } else {
    console.error(err instanceof Error ? err.message : 'Unknown error');
    res.status(500).send('Internal server error');
  }
};
