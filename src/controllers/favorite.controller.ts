import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { listFavorites, toggleFavorite } from '../services/favorite.service';

export const listFavoritesController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await listFavorites(req.user.id) });
});

export const toggleFavoriteController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  const result = await toggleFavorite(req.user.id, String(req.params.productId));
  res.json({ ok: true, data: result });
});
