import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '@prisma/client';

export type TokenPayload = {
  sub: string;
  role: UserRole;
};

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtAccessSecret as string, { expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'] });

export const verifyAccessToken = (token: string) => jwt.verify(token, env.jwtAccessSecret as string) as TokenPayload;

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtRefreshSecret as string, { expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'] });

export const verifyRefreshToken = (token: string) => jwt.verify(token, env.jwtRefreshSecret as string) as TokenPayload;
