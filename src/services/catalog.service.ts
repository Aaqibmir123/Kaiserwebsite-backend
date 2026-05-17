import { ProductStatus } from '@prisma/client';
import { db } from '../db';
import { cache } from '../utils/cache';
import { HttpError } from '../utils/httpError';
import { slugify } from '../utils/crypto';
import { sum } from '../utils/format';

export const listCategories = () =>
  cache.wrap('categories:list', 60_000, async () =>
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]
    })
  );

export const listProducts = async (query: { search?: string; category?: string; sellerStoreId?: string; status?: ProductStatus }) => {
  const cacheKey = `products:${JSON.stringify(query)}`;
  return cache.wrap(cacheKey, 20_000, async () => {
    const category = query.category
      ? await db.category.findFirst({ where: { OR: [{ slug: query.category }, { id: query.category }] } })
      : null;

    return db.product.findMany({
      where: {
        status: query.status ?? ProductStatus.ACTIVE,
        ...(query.sellerStoreId ? { storeId: query.sellerStoreId } : {}),
        ...(category ? { categoryId: category.id } : {}),
        ...(query.search
          ? {
              OR: [
                { title: { contains: query.search } },
                { subtitle: { contains: query.search } },
                { brand: { contains: query.search } }
              ]
            }
          : {})
      },
      include: { category: true, store: true },
      orderBy: [{ createdAt: 'desc' }]
    });
  });
};

export const getProductBySlug = (slug: string) =>
  db.product.findUnique({
    where: { slug },
    include: { category: true, store: true }
  });

export const createProduct = async (input: {
  title: string;
  subtitle?: string;
  description?: string;
  price: number;
  mrp?: number;
  stock: number;
  imageUrl: string;
  categorySlug: string;
  brand?: string;
  creatorId: string;
  storeId?: string;
}) => {
  const category = await db.category.findUnique({ where: { slug: input.categorySlug } });
  if (!category) throw new HttpError(404, 'Category not found');

  const product = await db.product.create({
    data: {
      slug: slugify(input.title),
      title: input.title,
      subtitle: input.subtitle,
      description: input.description,
      price: input.price,
      mrp: input.mrp,
      stock: input.stock,
      imageUrl: input.imageUrl,
      brand: input.brand,
      categoryId: category.id,
      creatorId: input.creatorId,
      storeId: input.storeId,
      status: input.stock > 0 ? ProductStatus.ACTIVE : ProductStatus.OUT_OF_STOCK
    }
  });

  cache.invalidate('products:');
  return product;
};

export const updateProduct = async (
  productId: string,
  input: Partial<{ title: string; subtitle: string; description: string; price: number; mrp: number; stock: number; imageUrl: string; brand: string; status: ProductStatus; categorySlug: string }>
) => {
  const existing = await db.product.findUnique({ where: { id: productId } });
  if (!existing) throw new HttpError(404, 'Product not found');

  const category = input.categorySlug ? await db.category.findUnique({ where: { slug: input.categorySlug } }) : null;
  if (input.categorySlug && !category) throw new HttpError(404, 'Category not found');

  const updated = await db.product.update({
    where: { id: productId },
    data: {
      ...(input.title ? { title: input.title, slug: slugify(input.title) } : {}),
      ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.mrp !== undefined ? { mrp: input.mrp } : {}),
      ...(input.stock !== undefined ? { stock: input.stock } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.brand !== undefined ? { brand: input.brand } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(category ? { categoryId: category.id } : {})
    }
  });

  cache.invalidate('products:');
  return updated;
};

export const deleteProduct = (productId: string) =>
  db.product.delete({ where: { id: productId } }).finally(() => cache.invalidate('products:'));

export const productSummary = async () => {
  const [active, outOfStock, draft, total, revenue] = await Promise.all([
    db.product.count({ where: { status: ProductStatus.ACTIVE } }),
    db.product.count({ where: { status: ProductStatus.OUT_OF_STOCK } }),
    db.product.count({ where: { status: ProductStatus.DRAFT } }),
    db.product.count(),
    db.order.aggregate({ _sum: { total: true } })
  ]);

  return { active, outOfStock, draft, total, revenue: revenue._sum.total ?? 0 };
};

export const categoryRevenue = async () => {
  const products = await db.product.findMany({ include: { category: true, orderItems: true } });
  return products.map((product) => ({
    category: product.category.name,
    revenue: sum(product.orderItems.map((item) => item.priceSnapshot * item.quantity))
  }));
};
