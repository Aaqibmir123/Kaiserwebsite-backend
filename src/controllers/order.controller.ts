import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { checkout, getOrder, listOrders } from '../services/order.service';

export const checkoutController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  const order = await checkout(req.user.id, req.body);
  res.status(201).json({ ok: true, data: order });
});

export const listOrdersController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await listOrders(req.user.id) });
});

export const orderController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await getOrder(req.user.id, String(req.params.id)) });
});
