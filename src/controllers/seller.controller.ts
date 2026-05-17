import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import {
  applySellerStore,
  createSellerProduct,
  editSellerProduct,
  invalidateSellerCache,
  removeSellerProduct,
  sellerDashboard,
  sellerApplicationStatus,
  sellerEarnings,
  sellerInventory,
  sellerOrders,
  sellerProducts,
  sellerStoreProfile,
  updateSellerOrderStatus,
  updateSellerStoreProfile
} from '../services/seller.service';
import { OrderStatus } from '@prisma/client';

export const applySellerController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.status(201).json({ ok: true, data: await applySellerStore(req.user.id, req.body) });
});

export const sellerDashboardController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await sellerDashboard(req.user.id) });
});

export const sellerProductsController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await sellerProducts(req.user.id) });
});

export const sellerInventoryController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await sellerInventory(req.user.id) });
});

export const sellerOrdersController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await sellerOrders(req.user.id) });
});

export const sellerEarningsController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await sellerEarnings(req.user.id) });
});

export const sellerStoreController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await sellerStoreProfile(req.user.id) });
});

export const sellerApplicationStatusController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await sellerApplicationStatus(req.user.id) });
});

export const updateSellerStoreController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await updateSellerStoreProfile(req.user.id, req.body) });
});

export const updateSellerOrderController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  const status = req.body.status as OrderStatus;
  res.json({ ok: true, data: await updateSellerOrderStatus(req.user.id, String(req.params.id), status) });
});

export const createSellerProductController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  const product = await createSellerProduct(req.user.id, req.body);
  invalidateSellerCache();
  res.status(201).json({ ok: true, data: product });
});

export const editSellerProductController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  const product = await editSellerProduct(req.user.id, String(req.params.id), req.body);
  invalidateSellerCache();
  res.json({ ok: true, data: product });
});

export const removeSellerProductController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  await removeSellerProduct(req.user.id, String(req.params.id));
  invalidateSellerCache();
  res.status(204).send();
});
