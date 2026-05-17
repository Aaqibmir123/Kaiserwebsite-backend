import { OrderStatus, UserRole } from '@prisma/client';
import { db } from '../db';
import { HttpError } from '../utils/httpError';
import { clearCart, getCart } from './cart.service';

const orderNumber = () => `SHP-${Math.floor(10000000 + Math.random() * 90000000)}`;

type CouponRule = {
  code: string;
  kind: 'percent' | 'flat' | 'shipping';
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
};

const COUPONS: CouponRule[] = [
  { code: 'WELCOME10', kind: 'percent', value: 10, minSubtotal: 999, maxDiscount: 150 },
  { code: 'SAVE200', kind: 'flat', value: 200, minSubtotal: 1499 },
  { code: 'FREESHIP', kind: 'shipping', value: 0, minSubtotal: 0 }
];

const getCouponRule = (couponCode?: string | null) => {
  if (!couponCode) return null;
  const normalized = couponCode.trim().toUpperCase();
  return COUPONS.find((coupon) => coupon.code === normalized) ?? null;
};

const orderInclude = {
  items: true,
  events: {
    orderBy: { createdAt: 'asc' as const }
  },
  returnRequests: {
    orderBy: { createdAt: 'desc' as const }
  }
};

export const checkout = async (userId: string, input: { paymentMethod: string; addressId?: string; couponCode?: string }) => {
  const cart = await getCart(userId);
  if (!cart.length) throw new HttpError(400, 'Cart is empty');

  const address = input.addressId
    ? await db.address.findFirst({ where: { id: input.addressId, userId } })
    : await db.address.findFirst({ where: { userId, isDefault: true } });
  if (!address) throw new HttpError(404, 'Address not found');

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const coupon = getCouponRule(input.couponCode);
  const eligible = coupon && subtotal >= (coupon.minSubtotal ?? 0);
  const discountAmount = eligible
    ? Math.min(
        coupon?.kind === 'percent'
          ? Math.round((subtotal * coupon.value) / 100)
          : coupon.value,
        coupon?.maxDiscount ?? Number.MAX_SAFE_INTEGER,
        subtotal
      )
    : 0;
  const shippingFee = coupon?.kind === 'shipping' || subtotal - discountAmount > 2000 ? 0 : 49;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const order = await db.order.create({
    data: {
      number: orderNumber(),
      userId,
      paymentMethod: input.paymentMethod,
      couponCode: eligible ? coupon?.code : null,
      discountAmount,
      subtotal,
      shippingFee,
      total,
      trackingNote: 'Your order is being prepared for dispatch.',
      addressLabel: address.label,
      addressName: address.name,
      addressPhone: address.phone,
      addressLine1: address.line1,
      addressLine2: address.line2,
      addressCity: address.city,
      addressState: address.state,
      addressPostalCode: address.postalCode,
      items: {
        create: cart.map((item) => ({
          productId: item.productId,
          titleSnapshot: item.product.title,
          priceSnapshot: item.product.price,
          imageSnapshot: item.product.imageUrl,
          quantity: item.quantity,
          size: item.selectedSize,
          color: item.selectedColor
        }))
      }
    },
    include: orderInclude
  });

  await db.orderStatusEvent.create({
    data: {
      orderId: order.id,
      status: OrderStatus.PLACED,
      note: 'Order confirmed',
      actorRole: UserRole.SHOPPER,
      actorLabel: 'Shopper'
    }
  });

  await clearCart(userId);
  return order;
};

export const listOrders = (userId: string) =>
  db.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' }
  });

export const getOrder = async (userId: string, orderId: string) => {
  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    include: orderInclude
  });
  if (!order) throw new HttpError(404, 'Order not found');
  return order;
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus, actor?: { role: string; label?: string | null }) => {
  const order = await db.order.update({
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
      note: status === OrderStatus.CANCELLED ? 'Order rejected or cancelled' : `Status changed to ${status}`,
      actorRole: (actor?.role as UserRole) ?? UserRole.ADMIN,
      actorLabel: actor?.label ?? null
    }
  });

  return db.order.findUnique({ where: { id: orderId }, include: orderInclude }).then((next) => next ?? order);
};
