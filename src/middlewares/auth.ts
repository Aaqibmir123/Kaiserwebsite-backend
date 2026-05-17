import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { HttpError } from '../utils/httpError';

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    console.log('[auth] missing bearer token for', req.method, req.originalUrl);
    return next(new HttpError(401, 'Unauthorized'));
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    console.log('[auth] invalid bearer token for', req.method, req.originalUrl);
    next(new HttpError(401, 'Invalid or expired token'));
  }
};
