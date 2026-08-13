import { NotificationType, OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CreateReviewDto, UpdateReviewDto } from './review.validation';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../utils/errors';
import { notificationService } from '../../services/notification.service';

export class ReviewService {
  /** Recompute a product's aggregate rating after any review change. */
  private async recalcRating(tx: Prisma.TransactionClient, productId: string) {
    const agg = await tx.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await tx.product.update({
      where: { id: productId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count.rating,
      },
    });
  }

  async listForProduct(productId: string, page = 1, limit = 10) {
    const where = { productId, isApproved: true };
    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);
    return { items, total };
  }

  listForUser(userId: string) {
    return prisma.review.findMany({
      where: { userId },
      include: {
        product: { select: { id: true, name: true, slug: true, thumbnail: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Verified-purchase gate: user must have a DELIVERED order containing the product. */
  private async assertPurchased(userId: string, productId: string) {
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: OrderStatus.DELIVERED },
      },
    });
    if (!purchased) {
      throw new ForbiddenError('You can only review products from delivered orders');
    }
  }

  async create(userId: string, dto: CreateReviewDto) {
    const product = await prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundError('Product not found');

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: dto.productId, userId } },
    });
    if (existing) throw new BadRequestError('You have already reviewed this product');

    await this.assertPurchased(userId, dto.productId);

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId: dto.productId,
          userId,
          rating: dto.rating,
          comment: dto.comment,
          isVerified: true,
        },
      });
      await this.recalcRating(tx, dto.productId);
      return created;
    });

    await notificationService.notifyAdmin({
      type: NotificationType.NEW_REVIEW,
      title: 'New product review',
      message: `${product.name} received a ${dto.rating}★ review.`,
      link: '/admin/reviews',
    });

    return review;
  }

  async update(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundError('Review not found');
    if (review.userId !== userId) throw new ForbiddenError();

    return prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({ where: { id }, data: dto });
      await this.recalcRating(tx, review.productId);
      return updated;
    });
  }

  async remove(userId: string, id: string, isAdmin = false) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundError('Review not found');
    if (!isAdmin && review.userId !== userId) throw new ForbiddenError();

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id } });
      await this.recalcRating(tx, review.productId);
    });
  }

  // Admin
  adminList(page = 1, limit = 20) {
    return prisma.$transaction([
      prisma.review.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          product: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count(),
    ]);
  }

  async setApproval(id: string, isApproved: boolean) {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundError('Review not found');
    return prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({ where: { id }, data: { isApproved } });
      await this.recalcRating(tx, review.productId);
      return updated;
    });
  }
}

export const reviewService = new ReviewService();
