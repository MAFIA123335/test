import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { CreateBrandDto, UpdateBrandDto } from './brand.validation';
import { slugify, uniqueSlug } from '../../utils/helpers';
import { ConflictError, NotFoundError } from '../../utils/errors';

/**
 * Brand module — compact combined repository + service. Larger modules
 * (products, orders) are split into repository/service/controller files.
 */
export class BrandService {
  list(all = false) {
    return prisma.brand.findMany({
      where: all ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async getBySlug(slug: string) {
    const brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) throw new NotFoundError('Brand not found');
    return brand;
  }

  async getById(id: string) {
    const brand = await prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundError('Brand not found');
    return brand;
  }

  private async makeSlug(name: string): Promise<string> {
    const base = slugify(name);
    const exists = await prisma.brand.findUnique({ where: { slug: base } });
    return exists ? uniqueSlug(name) : base;
  }

  async create(dto: CreateBrandDto) {
    const slug = await this.makeSlug(dto.name);
    return prisma.brand.create({
      data: { ...dto, slug, isActive: dto.isActive ?? true } as Prisma.BrandCreateInput,
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.getById(id);
    return prisma.brand.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.getById(id);
    const count = await prisma.product.count({ where: { brandId: id } });
    if (count > 0) throw new ConflictError('Cannot delete a brand that still has products');
    return prisma.brand.delete({ where: { id } });
  }
}

export const brandService = new BrandService();
