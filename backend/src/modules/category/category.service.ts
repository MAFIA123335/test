import { Prisma } from '@prisma/client';
import { categoryRepository, CategoryRepository } from './category.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './category.validation';
import { slugify, uniqueSlug } from '../../utils/helpers';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/errors';
import { prisma } from '../../config/prisma';

export class CategoryService {
  constructor(private readonly repo: CategoryRepository = categoryRepository) {}

  async list(query: { featured?: string; parentId?: string; tree?: string }) {
    if (query.tree === 'true') return this.repo.findTree();
    const where: Prisma.CategoryWhereInput = { isActive: true };
    if (query.featured === 'true') where.isFeatured = true;
    if (query.parentId) where.parentId = query.parentId === 'null' ? null : query.parentId;
    return this.repo.findMany(where);
  }

  async adminList() {
    return this.repo.findMany({});
  }

  async getBySlug(slug: string) {
    const category = await this.repo.findBySlug(slug);
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  async getById(id: string) {
    const category = await this.repo.findById(id);
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  private async ensureUniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    const exists = await prisma.category.findUnique({ where: { slug: base } });
    return exists ? uniqueSlug(name) : base;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.repo.findById(dto.parentId);
      if (!parent) throw new BadRequestError('Parent category does not exist');
    }
    const slug = await this.ensureUniqueSlug(dto.name);
    return this.repo.create({
      name: dto.name,
      nameAr: dto.nameAr,
      slug,
      description: dto.description,
      image: dto.image,
      icon: dto.icon,
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
      sortOrder: dto.sortOrder ?? 0,
      parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.getById(id);
    if (dto.parentId === id) throw new BadRequestError('A category cannot be its own parent');

    const data: Prisma.CategoryUpdateInput = {
      name: dto.name,
      nameAr: dto.nameAr,
      description: dto.description,
      image: dto.image,
      icon: dto.icon,
      isActive: dto.isActive,
      isFeatured: dto.isFeatured,
      sortOrder: dto.sortOrder,
    };
    if (dto.parentId !== undefined) {
      data.parent = dto.parentId ? { connect: { id: dto.parentId } } : { disconnect: true };
    }
    return this.repo.update(id, data);
  }

  async remove(id: string) {
    await this.getById(id);
    const productCount = await this.repo.countProducts(id);
    if (productCount > 0) {
      throw new ConflictError('Cannot delete a category that still has products');
    }
    return this.repo.delete(id);
  }
}

export const categoryService = new CategoryService();
