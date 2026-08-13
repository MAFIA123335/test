import { NotificationType, OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CheckoutDto } from './order.validation';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { generateOrderNumber, money } from '../../utils/helpers';
import { couponService } from '../coupon/coupon.service';
import { paymentRegistry } from '../../services/payment/payment.registry';
import { notificationService } from '../../services/notification.service';
import { settingsService } from '../settings/settings.service';

const orderInclude = {
  items: true,
  history: { orderBy: { createdAt: 'asc' as const } },
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
};

/** Allowed state transitions — enforces a valid order lifecycle. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

function effectivePrice(price: Prisma.Decimal, salePrice: Prisma.Decimal | null): number {
  const p = Number(price);
  const s = salePrice == null ? null : Number(salePrice);
  return s != null && s < p ? s : p;
}

export class OrderService {
  /**
   * Full checkout: validates cart & stock, computes totals (subtotal, coupon
   * discount, shipping, tax), decrements inventory, records coupon usage,
   * clears the cart, and initiates payment — all atomically.
   */
  async checkout(userId: string, dto: CheckoutDto) {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
    if (cartItems.length === 0) throw new BadRequestError('Your cart is empty');

    // Resolve shipping details (from saved address or inline).
    let shipping = dto.shipping;
    if (!shipping && dto.addressId) {
      const addr = await prisma.address.findFirst({ where: { id: dto.addressId, userId } });
      if (!addr) throw new BadRequestError('Address not found');
      shipping = {
        fullName: addr.fullName,
        phone: addr.phone,
        country: addr.country,
        city: addr.city,
        street: addr.street,
        building: addr.building ?? undefined,
        postalCode: addr.postalCode ?? undefined,
      };
    }
    if (!shipping) throw new BadRequestError('Shipping information is required');

    // Validate stock and build line items.
    let subtotal = 0;
    const lineItems = cartItems.map((item) => {
      if (!item.product.isActive || item.product.isArchived) {
        throw new BadRequestError(`${item.product.name} is no longer available`);
      }
      if (item.quantity > item.product.stock) {
        throw new BadRequestError(`Insufficient stock for ${item.product.name}`);
      }
      const price = effectivePrice(item.product.price, item.product.salePrice);
      const total = money(price * item.quantity);
      subtotal += total;
      return {
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.thumbnail,
        sku: item.product.sku,
        price,
        quantity: item.quantity,
        total,
      };
    });
    subtotal = money(subtotal);

    // Coupon discount.
    let discount = 0;
    let couponId: string | null = null;
    if (dto.couponCode) {
      const evaluation = await couponService.evaluate(dto.couponCode, subtotal, userId);
      discount = evaluation.discount;
      couponId = evaluation.coupon.id;
    }

    // Shipping + tax from settings.
    const settings = await settingsService.getCommerceSettings();
    const shippingCost =
      subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFlatRate;
    const taxable = Math.max(0, subtotal - discount);
    const tax = money((taxable * settings.taxRate) / 100);
    const total = money(taxable + shippingCost + tax);

    const method = dto.paymentMethod as PaymentMethod;
    const provider = paymentRegistry.get(method);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: OrderStatus.PENDING,
          paymentMethod: method,
          subtotal,
          discount,
          shippingCost,
          tax,
          total,
          couponCode: dto.couponCode ?? null,
          notes: dto.notes,
          addressId: dto.addressId,
          shippingName: shipping!.fullName,
          shippingPhone: shipping!.phone,
          shippingCountry: shipping!.country,
          shippingCity: shipping!.city,
          shippingStreet: shipping!.street,
          items: { create: lineItems },
          history: { create: { status: OrderStatus.PENDING, note: 'Order placed' } },
        },
        include: orderInclude,
      });

      // Decrement stock + sold count.
      for (const item of lineItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
      }

      if (couponId) await couponService.redeem(tx, couponId, userId, created.id);

      // Optionally persist a new address.
      if (dto.shipping?.saveAddress) {
        await tx.address.create({
          data: {
            userId,
            fullName: shipping!.fullName,
            phone: shipping!.phone,
            country: shipping!.country,
            city: shipping!.city,
            street: shipping!.street,
            building: shipping!.building,
            postalCode: shipping!.postalCode,
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });
      return created;
    });

    // Initiate payment (COD → unpaid/pending).
    const paymentResult = await provider.initiate({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: total,
      currency: settings.currency,
      userId,
      customerEmail: order.user.email,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: paymentResult.status },
    });

    // Notify admin + check low stock.
    await notificationService.notifyAdmin({
      type: NotificationType.NEW_ORDER,
      title: 'New order received',
      message: `Order ${order.orderNumber} — ${settings.currency} ${total.toFixed(2)}`,
      link: `/admin/orders/${order.id}`,
      metadata: { orderId: order.id, total },
    });
    for (const item of lineItems) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product && product.stock <= product.lowStockAlert) {
        await notificationService.notifyAdmin({
          type: NotificationType.LOW_STOCK,
          title: 'Low stock alert',
          message: `${product.name} is running low (${product.stock} left).`,
          link: '/admin/products',
        });
      }
    }

    return { ...order, paymentStatus: paymentResult.status, payment: paymentResult };
  }

  async listForUser(userId: string, params: { page: number; limit: number; status?: OrderStatus }) {
    const where: Prisma.OrderWhereInput = { userId };
    if (params.status) where.status = params.status;
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total };
  }

  async getForUser(userId: string, id: string) {
    const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
    if (!order) throw new NotFoundError('Order not found');
    return order;
  }

  async getByNumber(userId: string, orderNumber: string, isAdmin = false) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: orderInclude,
    });
    if (!order) throw new NotFoundError('Order not found');
    if (!isAdmin && order.userId !== userId) throw new ForbiddenError();
    return order;
  }

  async cancelByUser(userId: string, id: string) {
    const order = await prisma.order.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundError('Order not found');
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestError('Only pending orders can be cancelled');
    }
    return this.changeStatus(id, OrderStatus.CANCELLED, 'Cancelled by customer', true);
  }

  // ── Admin ──
  async adminList(params: { page: number; limit: number; status?: OrderStatus; search?: string }) {
    const where: Prisma.OrderWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { shippingName: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total };
  }

  async changeStatus(id: string, status: OrderStatus, note?: string, restockOnCancel = true) {
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new NotFoundError('Order not found');

    if (!TRANSITIONS[order.status].includes(status)) {
      throw new BadRequestError(`Cannot change status from ${order.status} to ${status}`);
    }

    return prisma.$transaction(async (tx) => {
      // Restock when cancelling.
      if (status === OrderStatus.CANCELLED && restockOnCancel) {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                soldCount: { decrement: item.quantity },
              },
            });
          }
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: {
          status,
          paymentStatus:
            status === OrderStatus.DELIVERED && order.paymentMethod === PaymentMethod.COD
              ? 'PAID'
              : undefined,
          history: { create: { status, note } },
        },
        include: orderInclude,
      });

      await notificationService.notifyUser(order.userId, {
        type: NotificationType.ORDER_STATUS,
        title: 'Order status updated',
        message: `Your order ${order.orderNumber} is now ${status.toLowerCase()}.`,
        link: `/dashboard/orders/${order.id}`,
      });

      return updated;
    });
  }
}

export const orderService = new OrderService();
