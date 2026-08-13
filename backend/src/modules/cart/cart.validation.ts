import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateCartSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

export type AddToCartDto = z.infer<typeof addToCartSchema>;
