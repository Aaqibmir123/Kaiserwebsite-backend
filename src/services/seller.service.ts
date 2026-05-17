import { OrderStatus, ProductStatus, StoreStatus, UserRole } from '@prisma/client';
import { db } from '../db';
import { HttpError } from '../utils/httpError';
import { createProduct, deleteProduct, listProducts, productSummary, updateProduct } from './catalog.service';
import { cache } from '../utils/cache';

export const applySellerStore = async (userId: string, input: {
  storeName: string;
  category: string;
  gstNumber?: string;
  bankLast4?: string;
  aadhaarFrontUrl?: string;
  aadhaarBackUrl?: string;
  panCardUrl?: string;
  gstCertificateUrl?: string;
  bankProofUrl?: string;
  addressProofUrl?: string;
  note?: string;
}) => {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'User not found');

  const existingStore = await db.sellerStore.findUnique({ where: { ownerId: userId } });
  if (existingStore) {
    throw new HttpError(409, 'You already have a seller store');
  }

  const pendingApplication = await db.sellerApplication.findFirst({
    where: {
      userId,
      status: StoreStatus.PENDING
    },
    orderBy: { createdAt: 'desc' }
  });

  if (pendingApplication) {
    throw new HttpError(409, 'Your seller application is already pending review');
  }

  const documentSummary = [
    input.aadhaarFrontUrl ? `Aadhaar Front: ${input.aadhaarFrontUrl}` : null,
    input.aadhaarBackUrl ? `Aadhaar Back: ${input.aadhaarBackUrl}` : null,
    input.panCardUrl ? `PAN Card: ${input.panCardUrl}` : null,
    input.gstCertificateUrl ? `GST Certificate: ${input.gstCertificateUrl}` : null,
    input.bankProofUrl ? `Bank Proof: ${input.bankProofUrl}` : null,
    input.addressProofUrl ? `Address Proof: ${input.addressProofUrl}` : null
  ].filter(Boolean);

  const note = [
    input.note?.trim() || '',
    documentSummary.length ? `Documents:\n${documentSummary.join('\n')}` : ''
  ].filter(Boolean).join('\n\n');

  try {
    return await db.sellerApplication.create({
      data: {
        userId,
        storeName: input.storeName,
        category: input.category,
        gstNumber: input.gstNumber,
        bankLast4: input.bankLast4,
        note: note || undefined,
        status: StoreStatus.PENDING
      }
    });
  } catch (error) {
    console.error('[seller] applySellerStore failed:', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Unknown argument') || error instanceof Error && error.name === 'PrismaClientValidationError') {
      throw new HttpError(
        500,
        'Seller application storage is out of sync right now. Please restart the backend and try again.'
      );
    }
    throw error;
  }
};

export const sellerDashboard = async (userId: string) => {
  const store = await db.sellerStore.findUnique({ where: { ownerId: userId } });
  const products = await listProducts({ sellerStoreId: store?.id });
  const [orders, revenue, approvals, inventory] = await Promise.all([
    db.order.count({ where: { items: { some: { product: { storeId: store?.id ?? '' } } } } }),
    db.order.aggregate({
      _sum: { total: true },
      where: { items: { some: { product: { storeId: store?.id ?? '' } } } }
    }),
    db.sellerApplication.count({ where: { userId } }),
    db.product.aggregate({
      _sum: { stock: true },
      where: { storeId: store?.id }
    })
  ]);

  return {
    store,
    stats: {
      revenue: revenue._sum.total ?? 0,
      orders,
      productCount: products.length,
      inventory: inventory._sum.stock ?? 0,
      approvals
    },
    products
  };
};

export const sellerProducts = (userId: string) =>
  db.user.findUnique({ where: { id: userId }, include: { store: true } }).then((user) => {
    if (!user?.store) throw new HttpError(404, 'Store not found');
    return listProducts({ sellerStoreId: user.store.id });
  });

export const sellerInventory = async (userId: string) => {
  const user = await db.user.findUnique({ where: { id: userId }, include: { store: true } });
  if (!user?.store) throw new HttpError(404, 'Store not found');
  return db.product.findMany({
    where: { storeId: user.store.id },
    orderBy: { createdAt: 'desc' }
  });
};

export const sellerOrders = async (userId: string) => {
  const user = await db.user.findUnique({ where: { id: userId }, include: { store: true } });
  if (!user?.store) throw new HttpError(404, 'Store not found');
  return db.order.findMany({
    where: { items: { some: { product: { storeId: user.store.id } } } },
    include: { items: true, user: true },
    orderBy: { createdAt: 'desc' }
  });
};

export const sellerEarnings = async (userId: string) => {
  const user = await db.user.findUnique({ where: { id: userId }, include: { store: true } });
  if (!user?.store) throw new HttpError(404, 'Store not found');
  const orders = await db.order.findMany({
    where: {
      items: { some: { product: { storeId: user.store.id } } },
      status: { not: OrderStatus.CANCELLED }
    },
    include: { items: true }
  });
  return {
    grossRevenue: orders.reduce((acc, order) => acc + order.total, 0),
    orderCount: orders.length
  };
};

export const sellerStoreProfile = async (userId: string) => {
  const store = await db.sellerStore.findUnique({ where: { ownerId: userId } });
  if (!store) throw new HttpError(404, 'Store not found');
  return store;
};

export const sellerApplicationStatus = async (userId: string) => {
  const [store, latestApplication] = await Promise.all([
    db.sellerStore.findUnique({ where: { ownerId: userId } }),
    db.sellerApplication.findFirst({
      where: { userId },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return {
    hasStore: Boolean(store),
    store,
    application: latestApplication
  };
};

export const updateSellerStoreProfile = async (
  userId: string,
  input: Partial<{
    name: string;
    slug: string;
    description: string;
    logoUrl: string;
    coverUrl: string;
    phone: string;
    email: string;
    address: string;
    isOpen: boolean;
  }>
) => {
  const store = await db.sellerStore.findUnique({ where: { ownerId: userId } });
  if (!store) throw new HttpError(404, 'Store not found');
  return db.sellerStore.update({
    where: { ownerId: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.coverUrl !== undefined ? { coverUrl: input.coverUrl } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.isOpen !== undefined ? { isOpen: input.isOpen } : {})
    }
  });
};

export const updateSellerOrderStatus = async (userId: string, orderId: string, status: OrderStatus) => {
  const user = await db.user.findUnique({ where: { id: userId }, include: { store: true } });
  if (!user?.store) throw new HttpError(404, 'Store not found');
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } }
  });
  if (!order) throw new HttpError(404, 'Order not found');
  const belongsToStore = order.items.some((item) => item.product.storeId === user.store?.id);
  if (!belongsToStore && user.role !== UserRole.ADMIN) throw new HttpError(403, 'Forbidden');
  const nextOrder = await db.order.update({
    where: { id: orderId },
    data: {
      status,
      deliveredAt: status === OrderStatus.DELIVERED ? new Date() : undefined
    }
  });

  await db.orderStatusEvent.create({
    data: {
      orderId,
      status,
      note: status === OrderStatus.CANCELLED ? 'Order rejected or cancelled' : `Seller updated order to ${status}`,
      actorRole: user.role,
      actorLabel: user.store?.name ?? user.name ?? 'Seller'
    }
  });

  return db.order.findUnique({
    where: { id: orderId },
    include: { items: true, events: { orderBy: { createdAt: 'asc' } }, returnRequests: { orderBy: { createdAt: 'desc' } } }
  }).then((updated) => updated ?? nextOrder);
};

export const createSellerProduct = async (userId: string, input: {
  title: string;
  subtitle?: string;
  description?: string;
  price: number;
  mrp?: number;
  stock: number;
  imageUrl: string;
  categorySlug: string;
  brand?: string;
}) => {
  const user = await db.user.findUnique({ where: { id: userId }, include: { store: true } });
  if (!user?.store) throw new HttpError(404, 'Store not found');
  return createProduct({ ...input, creatorId: userId, storeId: user.store.id });
};

export const editSellerProduct = async (userId: string, productId: string, input: Partial<{ title: string; subtitle: string; description: string; price: number; mrp: number; stock: number; imageUrl: string; brand: string; status: ProductStatus; categorySlug: string }>) => {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, 'Product not found');
  const user = await db.user.findUnique({ where: { id: userId }, include: { store: true } });
  if (product.storeId !== user?.store?.id && user?.role !== UserRole.ADMIN) throw new HttpError(403, 'Forbidden');
  return updateProduct(productId, input);
};

export const removeSellerProduct = async (userId: string, productId: string) => {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, 'Product not found');
  const user = await db.user.findUnique({ where: { id: userId }, include: { store: true } });
  if (product.storeId !== user?.store?.id && user?.role !== UserRole.ADMIN) throw new HttpError(403, 'Forbidden');
  return deleteProduct(productId);
};

export const invalidateSellerCache = () => cache.invalidate('products:');
