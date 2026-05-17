import { ReturnRequestStatus, ReturnRequestType, UserRole } from '@prisma/client';
import { db } from '../db';
import { HttpError } from '../utils/httpError';

const RETURN_WINDOW_DAYS = 7;

const returnInclude = {
  order: {
    include: {
      items: true,
      events: {
        orderBy: { createdAt: 'asc' as const }
      }
    }
  }
};

const getEligibleOrderItem = async (userId: string, orderId: string, orderItemId?: string) => {
  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true }
  });

  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status !== 'DELIVERED') throw new HttpError(400, 'Returns and replacements are available after delivery only');
  if (!order.deliveredAt) throw new HttpError(400, 'This order is not yet eligible for a return');

  const deliveredAt = new Date(order.deliveredAt);
  const windowEndsAt = new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (windowEndsAt.getTime() < Date.now()) {
    throw new HttpError(400, 'Return window has expired for this order');
  }

  const item =
    order.items.find((line) => line.id === orderItemId) ??
    order.items[0];

  if (!item) throw new HttpError(400, 'No order item found for return request');
  return { order, item };
};

export const listMyReturnRequests = (userId: string) =>
  db.returnRequest.findMany({
    where: { userId },
    include: returnInclude,
    orderBy: { createdAt: 'desc' }
  });

export const getMyReturnRequest = async (userId: string, id: string) => {
  const request = await db.returnRequest.findFirst({
    where: { id, userId },
    include: returnInclude
  });
  if (!request) throw new HttpError(404, 'Return request not found');
  return request;
};

export const createReturnRequest = async (userId: string, input: {
  orderId: string;
  orderItemId?: string;
  type: ReturnRequestType;
  reason: string;
  comments?: string;
  photoUrls?: string[];
}) => {
  const { order, item } = await getEligibleOrderItem(userId, input.orderId, input.orderItemId);

  const duplicate = await db.returnRequest.findFirst({
    where: {
      userId,
      orderId: order.id,
      orderItemId: item.id,
      status: { in: [ReturnRequestStatus.REQUESTED, ReturnRequestStatus.APPROVED, ReturnRequestStatus.PICKUP_SCHEDULED, ReturnRequestStatus.PICKED_UP, ReturnRequestStatus.REFUND_PENDING, ReturnRequestStatus.REPLACEMENT_SHIPPED] }
    }
  });

  if (duplicate) {
    throw new HttpError(409, 'A return request already exists for this item');
  }

  return db.returnRequest.create({
    data: {
      orderId: order.id,
      userId,
      orderItemId: item.id,
      orderNumberSnapshot: order.number,
      itemTitleSnapshot: item.titleSnapshot,
      itemImageSnapshot: item.imageSnapshot,
      itemSizeSnapshot: item.size ?? null,
      itemColorSnapshot: item.color ?? null,
      type: input.type,
      status: ReturnRequestStatus.REQUESTED,
      reason: input.reason.trim(),
      comments: input.comments?.trim() || null,
      photoUrls: input.photoUrls?.length ? JSON.stringify(input.photoUrls) : null,
      actorRole: UserRole.SHOPPER,
      actorLabel: 'Shopper'
    },
    include: returnInclude
  });
};

export const reviewReturnRequest = async (
  actor: { role: UserRole; label?: string | null; userId: string },
  id: string,
  input: { status: ReturnRequestStatus; resolutionNote?: string }
) => {
  const request = await db.returnRequest.findUnique({
    where: { id },
    include: { order: { include: { items: { include: { product: true } } } } }
  });

  if (!request) throw new HttpError(404, 'Return request not found');

  if (actor.role === UserRole.SELLER) {
    const user = await db.user.findUnique({ where: { id: actor.userId }, include: { store: true } });
    const belongsToStore = request.order.items.some((item) => item.product.storeId && item.product.storeId === user?.store?.id);
    if (!belongsToStore) throw new HttpError(403, 'Forbidden');
  }

  return db.returnRequest.update({
    where: { id },
    data: {
      status: input.status,
      resolutionNote: input.resolutionNote?.trim() || undefined,
      reviewedAt: new Date(),
      actorRole: actor.role,
      actorLabel: actor.label ?? null
    },
    include: returnInclude
  });
};
