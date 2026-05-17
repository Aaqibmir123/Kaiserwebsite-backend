import type { Request, Response } from 'express';
import { ReturnRequestStatus, UserRole } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { createReturnRequest, getMyReturnRequest, listMyReturnRequests, reviewReturnRequest } from '../services/return.service';
import { db } from '../db';

export const listMyReturnRequestsController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await listMyReturnRequests(req.user.id) });
});

export const getMyReturnRequestController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await getMyReturnRequest(req.user.id, String(req.params.id)) });
});

export const createReturnRequestController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  const request = await createReturnRequest(req.user.id, req.body);
  res.status(201).json({ ok: true, data: request });
});

export const reviewReturnRequestController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  const role = req.user.role;
  if (role !== UserRole.SELLER && role !== UserRole.ADMIN) {
    throw new HttpError(403, 'Forbidden');
  }

  const user = await db.user.findUnique({ where: { id: req.user.id } });
  const request = await reviewReturnRequest(
    { role, label: user?.name ?? user?.phone ?? role, userId: req.user.id },
    String(req.params.id),
    req.body as { status: ReturnRequestStatus; resolutionNote?: string }
  );

  res.json({ ok: true, data: request });
});
