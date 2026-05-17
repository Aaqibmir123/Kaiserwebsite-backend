import type { Request, Response } from 'express';
import { SupportThreadStatus } from '@prisma/client';

import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import {
  getAdminSupportThread,
  getMySupportMessages,
  getMySupportThread,
  listAdminSupportThreads,
  sendAdminSupportMessage,
  sendMySupportMessage,
  updateSupportThreadStatus
} from '../services/support.service';

export const mySupportThreadController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await getMySupportThread(req.user.id) });
});

export const mySupportMessagesController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await getMySupportMessages(req.user.id) });
});

export const sendMySupportMessageController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.status(201).json({ ok: true, data: await sendMySupportMessage(req.user.id, req.user.role, req.body) });
});

export const adminSupportThreadsController = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await listAdminSupportThreads() });
});

export const adminSupportThreadController = asyncHandler(async (req: Request, res: Response) => {
  res.json({ ok: true, data: await getAdminSupportThread(String(req.params.id)) });
});

export const sendAdminSupportMessageController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.status(201).json({ ok: true, data: await sendAdminSupportMessage(req.user.id, String(req.params.id), req.body) });
});

export const updateAdminSupportThreadController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await updateSupportThreadStatus(req.user.id, String(req.params.id), req.body.status as SupportThreadStatus) });
});
