import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { deleteAddress, listAddresses, upsertAddress } from '../services/address.service';

export const listAddressesController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await listAddresses(req.user.id) });
});

export const saveAddressController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  res.json({ ok: true, data: await upsertAddress(req.user.id, { ...req.body, id: req.params.id ?? req.body.id }) });
});

export const deleteAddressController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  await deleteAddress(req.user.id, String(req.params.id));
  res.status(204).send();
});
