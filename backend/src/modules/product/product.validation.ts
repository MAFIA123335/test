import { z } from 'zod';

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(), // slug
  brand: z.string().optional(), // slug
  tag: z.string().optional(), // slug
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  featured: z.enum(['true', 'false']).optional(),
  onSale: z.enum(['true', 'false']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sort: z
    .enum(['newest', 'oldest', 'price_asc', 'price_desc', 'popular', 'rating', 'name_asc'])
    .optional(),
});

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  nameAr: z.string().max(200).optional(),
  description: z.string().min(5),
  descriptionAr: z.string().optional(),
  sku: z.string().min(1).max(64),
  price: z.coerce.number().positive(),
  salePrice: z.coerce.number().positive().nullable().optional(),
  costPrice: z.coerce.number().positive().nullable().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockAlert: z.coerce.number().int().min(0).optional(),
  thumbnail: z.string().url().optional(),
  weight: z.coerce.number().positive().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  images: z.array(imageSchema).optional(),
  tags: z.array(z.string().min(1)).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const adminProductQuerySchema = productQuerySchema.extend({
  archived: z.enum(['true', 'false']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type ProductQueryDto = z.infer<typeof productQuerySchema>;
export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
