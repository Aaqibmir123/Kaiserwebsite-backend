import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';

export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, 'Route not found'));
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api-error]', err);
  const httpError = err instanceof HttpError ? err : new HttpError(500, 'Something went wrong');
  res.status(httpError.statusCode).json({
    ok: false,
    error: httpError.message
  });
};
