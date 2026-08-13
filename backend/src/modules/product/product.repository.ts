import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export const productInclude = {
  category: { select: { id: true, name: true, nameAr: true, slug: true } },
  brand: { select: { id: true, name: true, nameAr: true, slug: true, logo: true } },
  images: { orderBy: { sortOrder: 'asc' as const } },
  tags: { include: { tag: true } },
} satisfies Prisma.ProductInclude;

export class ProductRepository {
  async findManyPaginated(params: {
    where: Prisma.ProductWhereInput;
    orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
    skip: number;
    take: number;
  }) {
    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.take,
        include: productInclude,
      }),
      prisma.product.count({ where: params.where }),
    ]);
    return { items, total };
  }

  findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        ...productInclude,
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
        },
      },
    });
  }

  findById(id: string) {
    return prisma.product.findUnique({ where: { id }, include: productInclude });
  }

  findBySku(sku: string) {
    return prisma.product.findUnique({ where: { sku } });
  }

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data, include: productInclude });
  }

  update(id: string, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({ where: { id }, data, include: productInclude });
  }

  delete(id: string) {
    return prisma.product.delete({ where: { id } });
  }

  incrementView(id: string) {
    return prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  }

  related(categoryId: string | null, excludeId: string, take = 8) {
    return prisma.product.findMany({
      where: {
        id: { not: excludeId },
        isActive: true,
        isArchived: false,
        ...(categoryId ? { categoryId } : {}),
      },
      take,
      orderBy: { soldCount: 'desc' },
      include: productInclude,
    });
  }
}

export const productRepository = new ProductRepository();
