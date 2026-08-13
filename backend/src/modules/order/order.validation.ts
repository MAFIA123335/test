import { z } from 'zod';

export const checkoutSchema = z.object({
  paymentMethod: z.enum(['COD']).default('COD'),
  couponCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  addressId: z.string().uuid().optional(),
  shipping: z
    .object({
      fullName: z.string().min(2),
      phone: z.string().min(6),
      country: z.string().min(2),
      city: z.string().min(2),
      street: z.string().min(2),
      building: z.string().optional(),
      postalCode: z.string().optional(),
      saveAddress: z.boolean().optional(),
    })
    .optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  search: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  note: z.string().max(500).optional(),
});

export type CheckoutDto = z.infer<typeof checkoutSchema>;
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
