import { db } from '../db';
import { HttpError } from '../utils/httpError';

export const listFavorites = (userId: string) =>
  db.favorite.findMany({
    where: { userId },
    include: { product: { include: { category: true, store: true } } },
    orderBy: { createdAt: 'desc' }
  });

export const toggleFavorite = async (userId: string, productId: string) => {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, 'Product not found');

  const existing = await db.favorite.findUnique({
    where: { userId_productId: { userId, productId } }
  });

  if (existing) {
    await db.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }

  await db.favorite.create({ data: { userId, productId } });
  return { favorited: true };
};
