import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { adminDashboard, ordersOverview, productModeration, revenueAnalytics, reviewProduct, reviewSellerApplication, sellerApprovals, usersOverview } from '../services/admin.service';
import { StoreStatus } from '@prisma/client';

export const adminDashboardController = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await adminDashboard() });
});

export const sellerApprovalsController = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await sellerApprovals() });
});

export const reviewSellerApprovalController = asyncHandler(async (req: Request, res: Response) => {
  res.json({ ok: true, data: await reviewSellerApplication(String(req.params.id), req.body.status as StoreStatus, req.body.note) });
});

export const usersOverviewController = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await usersOverview() });
});

export const ordersOverviewController = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await ordersOverview() });
});

export const productModerationController = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await productModeration() });
});

export const reviewProductController = asyncHandler(async (req: Request, res: Response) => {
  const status = req.body.status;
  if (!status) throw new HttpError(400, 'status is required');
  res.json({ ok: true, data: await reviewProduct(String(req.params.id), status) });
});

export const revenueAnalyticsController = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await revenueAnalytics() });
});
