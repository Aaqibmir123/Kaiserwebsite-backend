import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { clearCart, getCart, removeCartItem, upsertCartItem } from '../services/cart.service';
import { HttpError } from '../utils/httpError';

export const getCartController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await getCart(req.user.id) });
});

export const upsertCartController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  const cartItem = await upsertCartItem(req.user.id, req.body.productId, req.body.quantity, req.body.selectedSize, req.body.selectedColor);
  res.json({ ok: true, data: cartItem });
});

export const removeCartController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  await removeCartItem(req.user.id, String(req.params.productId));
  res.status(204).send();
});

export const clearCartController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  await clearCart(req.user.id);
  res.status(204).send();
});
