import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class CategoryRepository {
  findMany(where: Prisma.CategoryWhereInput) {
    return prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true, children: true } } },
    });
  }

  findTree() {
    return prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { products: true } } },
        },
        _count: { select: { products: true } },
      },
    });
  }

  findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true, _count: { select: { products: true } } },
    });
  }

  findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: { children: true, parent: true },
    });
  }

  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  }

  delete(id: string) {
    return prisma.category.delete({ where: { id } });
  }

  countProducts(id: string) {
    return prisma.product.count({ where: { categoryId: id } });
  }
}

export const categoryRepository = new CategoryRepository();
