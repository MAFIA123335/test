import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  nameAr: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  image: z.string().url().optional(),
  icon: z.string().max(100).optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryQuerySchema = z.object({
  featured: z.enum(['true', 'false']).optional(),
  parentId: z.string().optional(),
  tree: z.enum(['true', 'false']).optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
