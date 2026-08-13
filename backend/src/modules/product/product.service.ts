import { NotificationType, Prisma } from '@prisma/client';
import { productRepository, ProductRepository } from './product.repository';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './product.validation';
import { slugify, uniqueSlug } from '../../utils/helpers';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';
import { prisma } from '../../config/prisma';
import { config } from '../../config/env';
import { notificationService } from '../../services/notification.service';

type Sort = ProductQueryDto['sort'];

export class ProductService {
  constructor(private readonly repo: ProductRepository = productRepository) {}

  private buildOrderBy(sort: Sort): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'popular':
        return { soldCount: 'desc' };
      case 'rating':
        return { ratingAvg: 'desc' };
      case 'name_asc':
        return { name: 'asc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private async buildWhere(
    query: ProductQueryDto,
    opts: { admin?: boolean; archived?: boolean; status?: string } = {},
  ): Promise<Prisma.ProductWhereInput> {
    const where: Prisma.ProductWhereInput = {};

    if (!opts.admin) {
      where.isActive = true;
      where.isArchived = false;
    } else {
      where.isArchived = opts.archived ?? false;
      if (opts.status === 'active') where.isActive = true;
      if (opts.status === 'inactive') where.isActive = false;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { nameAr: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.category) where.category = { slug: query.category };
    if (query.brand) where.brand = { slug: query.brand };
    if (query.tag) where.tags = { some: { tag: { slug: query.tag } } };
    if (query.featured === 'true') where.isFeatured = true;
    if (query.inStock === 'true') where.stock = { gt: 0 };
    if (query.onSale === 'true') where.salePrice = { not: null };

    if (query.minPrice != null || query.maxPrice != null) {
      where.price = {};
      if (query.minPrice != null) where.price.gte = query.minPrice;
      if (query.maxPrice != null) where.price.lte = query.maxPrice;
    }

    return where;
  }

  async list(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where = await this.buildWhere(query);
    const { items, total } = await this.repo.findManyPaginated({
      where,
      orderBy: this.buildOrderBy(query.sort),
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async adminList(query: ProductQueryDto & { archived?: string; status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = await this.buildWhere(query, {
      admin: true,
      archived: query.archived === 'true',
      status: query.status,
    });
    const { items, total } = await this.repo.findManyPaginated({
      where,
      orderBy: this.buildOrderBy(query.sort),
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async getBySlug(slug: string) {
    const product = await this.repo.findBySlug(slug);
    if (!product || product.isArchived) throw new NotFoundError('Product not found');
    // Fire-and-forget view counter.
    void this.repo.incrementView(product.id).catch(() => undefined);
    const related = await this.repo.related(product.categoryId, product.id);
    return { ...product, related };
  }

  async getById(id: string) {
    const product = await this.repo.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    return product;
  }

  private async resolveTags(names: string[]): Promise<{ tagId: string }[]> {
    const tags = await Promise.all(
      names.map((name) => {
        const slug = slugify(name);
        return prisma.tag.upsert({
          where: { slug },
          update: {},
          create: { name, slug },
        });
      }),
    );
    return tags.map((t) => ({ tagId: t.id }));
  }

  private async makeSlug(name: string): Promise<string> {
    const base = slugify(name);
    const exists = await prisma.product.findUnique({ where: { slug: base } });
    return exists ? uniqueSlug(name) : base;
  }

  async create(dto: CreateProductDto) {
    const existingSku = await this.repo.findBySku(dto.sku);
    if (existingSku) throw new ConflictError('SKU already exists');
    if (dto.salePrice && dto.salePrice >= dto.price) {
      throw new BadRequestError('Sale price must be lower than the regular price');
    }

    const slug = await this.makeSlug(dto.name);
    const tagLinks = dto.tags?.length ? await this.resolveTags(dto.tags) : [];

    return this.repo.create({
      name: dto.name,
      nameAr: dto.nameAr,
      slug,
      description: dto.description,
      descriptionAr: dto.descriptionAr,
      sku: dto.sku,
      price: dto.price,
      salePrice: dto.salePrice ?? null,
      costPrice: dto.costPrice ?? null,
      stock: dto.stock,
      lowStockAlert: dto.lowStockAlert ?? config.LOW_STOCK_THRESHOLD,
      thumbnail: dto.thumbnail ?? dto.images?.[0]?.url,
      weight: dto.weight,
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
      category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      brand: dto.brandId ? { connect: { id: dto.brandId } } : undefined,
      images: dto.images?.length
        ? { create: dto.images.map((img, i) => ({ url: img.url, alt: img.alt, sortOrder: img.sortOrder ?? i })) }
        : undefined,
      tags: tagLinks.length ? { create: tagLinks } : undefined,
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.getById(id);
    if (dto.sku && dto.sku !== product.sku) {
      const dup = await this.repo.findBySku(dto.sku);
      if (dup) throw new ConflictError('SKU already exists');
    }
    const price = dto.price ?? Number(product.price);
    if (dto.salePrice && dto.salePrice >= price) {
      throw new BadRequestError('Sale price must be lower than the regular price');
    }

    const data: Prisma.ProductUpdateInput = {
      name: dto.name,
      nameAr: dto.nameAr,
      description: dto.description,
      descriptionAr: dto.descriptionAr,
      sku: dto.sku,
      price: dto.price,
      salePrice: dto.salePrice,
      costPrice: dto.costPrice,
      stock: dto.stock,
      lowStockAlert: dto.lowStockAlert,
      thumbnail: dto.thumbnail,
      weight: dto.weight,
      isActive: dto.isActive,
      isFeatured: dto.isFeatured,
    };

    if (dto.categoryId !== undefined) {
      data.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
    }
    if (dto.brandId !== undefined) {
      data.brand = dto.brandId ? { connect: { id: dto.brandId } } : { disconnect: true };
    }

    if (dto.images) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      data.images = {
        create: dto.images.map((img, i) => ({ url: img.url, alt: img.alt, sortOrder: img.sortOrder ?? i })),
      };
    }
    if (dto.tags) {
      await prisma.productTag.deleteMany({ where: { productId: id } });
      const tagLinks = await this.resolveTags(dto.tags);
      data.tags = { create: tagLinks };
    }

    return this.repo.update(id, data);
  }

  async archive(id: string) {
    await this.getById(id);
    return this.repo.update(id, { isArchived: true, isActive: false });
  }

  async restore(id: string) {
    await this.getById(id);
    return this.repo.update(id, { isArchived: false, isActive: true });
  }

  async remove(id: string) {
    await this.getById(id);
    return this.repo.delete(id);
  }

  /** Called after orders to keep inventory + low-stock notifications accurate. */
  async checkLowStock(productId: string) {
    const product = await this.repo.findById(productId);
    if (product && product.stock <= product.lowStockAlert) {
      await notificationService.notifyAdmin({
        type: NotificationType.LOW_STOCK,
        title: 'Low stock alert',
        message: `${product.name} is running low (${product.stock} left).`,
        link: `/admin/products`,
        metadata: { productId: product.id, stock: product.stock },
      });
    }
  }
}

export const productService = new ProductService();
