import { db } from '../db';
import { HttpError } from '../utils/httpError';

export const getCart = async (userId: string) =>
  db.cartItem.findMany({
    where: { userId },
    include: { product: { include: { category: true, store: true } } },
    orderBy: { createdAt: 'desc' }
  });

export const upsertCartItem = async (userId: string, productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, 'Product not found');

  return db.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: { quantity, selectedSize, selectedColor },
    create: { userId, productId, quantity, selectedSize, selectedColor }
  });
};

export const removeCartItem = (userId: string, productId: string) =>
  db.cartItem.delete({
    where: { userId_productId: { userId, productId } }
  });

export const clearCart = (userId: string) => db.cartItem.deleteMany({ where: { userId } });
