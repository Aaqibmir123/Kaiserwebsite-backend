import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@prisma/client';
import { HttpError } from '../utils/httpError';

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Unauthorized'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Forbidden'));
    next();
  };
