import { OrderStatus, ProductStatus, StoreStatus, UserRole } from '@prisma/client';
import { db } from '../db';
import { HttpError } from '../utils/httpError';
import { cache } from '../utils/cache';
import { productSummary } from './catalog.service';

export const adminDashboard = async () => {
  return cache.wrap('admin:dashboard', 15_000, async () => {
    const [users, sellers, orders, revenue, approvals, testimonials, products, orderStatusGroups, approvalStatusGroups] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: UserRole.SELLER } }),
      db.order.count(),
      db.order.aggregate({ _sum: { total: true } }),
      db.sellerApplication.count({ where: { status: StoreStatus.PENDING } }),
      db.testimonial.count(),
      productSummary(),
      db.order.groupBy({
        by: ['status'],
        _count: { _all: true }
      }),
      db.sellerApplication.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
    ]);

    const orderStatuses = orderStatusGroups.reduce((acc: Record<string, number>, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    const approvalStatuses = approvalStatusGroups.reduce((acc: Record<string, number>, item) => {
      acc[item.status] = item._count._all;
      return acc;
    }, {});

    return {
      users,
      sellers,
      orders,
      revenue: revenue._sum.total ?? 0,
      approvals,
      testimonials,
      products,
      orderStatuses,
      approvalStatuses
    };
  });
};

export const sellerApprovals = () =>
  db.sellerApplication.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });

export const reviewSellerApplication = async (applicationId: string, status: StoreStatus, note?: string) => {
  const application = await db.sellerApplication.findUnique({ where: { id: applicationId }, include: { user: true } });
  if (!application) throw new HttpError(404, 'Application not found');

  const updated = await db.sellerApplication.update({
    where: { id: applicationId },
    data: { status, note }
  });

  if (status === StoreStatus.APPROVED) {
    await db.user.update({
      where: { id: application.userId },
      data: { role: UserRole.SELLER }
    });
    await db.sellerStore.upsert({
      where: { ownerId: application.userId },
      update: { status: StoreStatus.APPROVED, name: application.storeName, slug: application.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      create: {
        ownerId: application.userId,
        name: application.storeName,
        slug: application.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: StoreStatus.APPROVED
      }
    });
  }

  cache.clear();
  return updated;
};

export const usersOverview = () =>
  db.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { store: true }
  });

export const ordersOverview = () =>
  db.order.findMany({
    include: {
      items: {
        include: {
          product: {
            include: {
              store: true,
              category: true
            }
          }
        }
      },
      user: true
    },
    orderBy: { createdAt: 'desc' }
  });

export const productModeration = () =>
  db.product.findMany({
    where: { status: { in: [ProductStatus.DRAFT, ProductStatus.PENDING_REVIEW, ProductStatus.ARCHIVED] } },
    include: { category: true, store: true },
    orderBy: { createdAt: 'desc' }
  });

export const reviewProduct = async (productId: string, status: ProductStatus) => {
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) throw new HttpError(404, 'Product not found');
  return db.product.update({ where: { id: productId }, data: { status } });
};

export const revenueAnalytics = async () => {
  const orders = await db.order.findMany({
    include: {
      items: {
        include: {
          product: {
            include: {
              store: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  return {
    totalRevenue: orders.reduce((acc, order) => acc + order.total, 0),
    totalOrders: orders.length,
    recentOrders: orders.slice(0, 10)
  };
};
