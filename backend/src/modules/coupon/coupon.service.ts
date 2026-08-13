import { Coupon, CouponType, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CreateCouponDto, UpdateCouponDto } from './coupon.validation';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';
import { money } from '../../utils/helpers';

export interface CouponEvaluation {
  coupon: Coupon;
  discount: number;
}

export class CouponService {
  list() {
    return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getById(id: string) {
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundError('Coupon not found');
    return coupon;
  }

  async create(dto: CreateCouponDto) {
    const exists = await prisma.coupon.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictError('Coupon code already exists');
    if (dto.type === 'PERCENTAGE' && dto.value > 100) {
      throw new BadRequestError('Percentage value cannot exceed 100');
    }
    return prisma.coupon.create({ data: dto as Prisma.CouponCreateInput });
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.getById(id);
    return prisma.coupon.update({ where: { id }, data: dto as Prisma.CouponUpdateInput });
  }

  async remove(id: string) {
    await this.getById(id);
    return prisma.coupon.delete({ where: { id } });
  }

  /**
   * Validate a coupon for a given user + subtotal and compute the discount.
   * Shared by the public "apply coupon" endpoint and the checkout flow.
   */
  async evaluate(code: string, subtotal: number, userId: string): Promise<CouponEvaluation> {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
    if (!coupon || !coupon.isActive) throw new BadRequestError('Invalid coupon code');

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) throw new BadRequestError('Coupon is not active yet');
    if (coupon.expiresAt && coupon.expiresAt < now) throw new BadRequestError('Coupon has expired');
    if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestError('Coupon usage limit reached');
    }
    if (subtotal < Number(coupon.minPurchase)) {
      throw new BadRequestError(`Minimum purchase of ${Number(coupon.minPurchase)} required`);
    }

    const userUsage = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (userUsage >= coupon.perUserLimit) {
      throw new BadRequestError('You have already used this coupon');
    }

    let discount =
      coupon.type === CouponType.PERCENTAGE
        ? (subtotal * Number(coupon.value)) / 100
        : Number(coupon.value);

    if (coupon.maxDiscount != null) discount = Math.min(discount, Number(coupon.maxDiscount));
    discount = Math.min(discount, subtotal);

    return { coupon, discount: money(discount) };
  }

  /** Record a redemption inside the order transaction. */
  async redeem(tx: Prisma.TransactionClient, couponId: string, userId: string, orderId: string) {
    await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    await tx.couponUsage.create({ data: { couponId, userId, orderId } });
  }
}

export const couponService = new CouponService();
