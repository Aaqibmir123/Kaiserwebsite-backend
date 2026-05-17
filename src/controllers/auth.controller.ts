import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requestOtp, verifyOtp, getCurrentUser, adminLogin, updateCurrentUser, refreshSession } from '../services/auth.service';
import { HttpError } from '../utils/httpError';

export const requestOtpController = asyncHandler(async (req: Request, res: Response) => {
  console.log('[auth] request-otp body:', req.body);
  const result = await requestOtp(req.body);
  console.log('[auth] request-otp ok for:', result.phone);
  res.status(200).json({ ok: true, data: result });
});

export const verifyOtpController = asyncHandler(async (req: Request, res: Response) => {
  console.log('[auth] verify-otp body:', req.body);
  const result = await verifyOtp(req.body);
  console.log('[auth] verify-otp ok for:', req.body?.phone);
  res.status(200).json({ ok: true, data: result });
});

export const adminLoginController = asyncHandler(async (req: Request, res: Response) => {
  const result = await adminLogin(req.body);
  res.status(200).json({ ok: true, data: result });
});

export const refreshController = asyncHandler(async (req: Request, res: Response) => {
  console.log('[auth] refresh body:', req.body);
  const result = await refreshSession(req.body?.refreshToken);
  res.status(200).json({ ok: true, data: result });
});

export const meController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  const user = await getCurrentUser(req.user.id);
  res.status(200).json({ ok: true, data: user });
});

export const updateMeController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  console.log('[auth] update-me body:', req.body);
  const user = await updateCurrentUser(req.user.id, req.body ?? {});
  res.status(200).json({ ok: true, data: user });
});
