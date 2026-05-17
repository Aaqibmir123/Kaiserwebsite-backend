import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { createProduct, deleteProduct, getProductBySlug, listCategories, listProducts, updateProduct } from '../services/catalog.service';
import { HttpError } from '../utils/httpError';
import { ProductStatus } from '@prisma/client';

export const categoriesController = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await listCategories() });
});

export const productsController = asyncHandler(async (req: Request, res: Response) => {
  const products = await listProducts({
    search: typeof req.query.search === 'string' ? req.query.search : undefined,
    category: typeof req.query.category === 'string' ? req.query.category : undefined,
    sellerStoreId: typeof req.query.sellerStoreId === 'string' ? req.query.sellerStoreId : undefined,
    status: typeof req.query.status === 'string' ? (req.query.status as ProductStatus) : undefined
  });
  res.json({ ok: true, data: products });
});

export const productController = asyncHandler(async (req: Request, res: Response) => {
  const product = await getProductBySlug(String(req.params.slug));
  if (!product) throw new HttpError(404, 'Product not found');
  res.json({ ok: true, data: product });
});

export const createProductController = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new HttpError(401, 'Unauthorized');
  const product = await createProduct({ ...req.body, creatorId: req.user.id });
  res.status(201).json({ ok: true, data: product });
});

export const updateProductController = asyncHandler(async (req: Request, res: Response) => {
  const product = await updateProduct(String(req.params.id), req.body);
  res.json({ ok: true, data: product });
});

export const deleteProductController = asyncHandler(async (req: Request, res: Response) => {
  await deleteProduct(String(req.params.id));
  res.status(204).send();
});
