import { z } from 'zod';

export const updateSettingSchema = z.object({
  value: z.any(),
});

export const commerceSettingsSchema = z.object({
  currency: z.string().min(1).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  shippingFlatRate: z.coerce.number().min(0).optional(),
  freeShippingThreshold: z.coerce.number().min(0).optional(),
});

export const siteSettingsSchema = z.object({
  siteName: z.string().optional(),
  siteNameAr: z.string().optional(),
  logo: z.string().url().nullable().optional(),
  banner: z.string().url().nullable().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  social: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      tiktok: z.string().optional(),
      youtube: z.string().optional(),
    })
    .optional(),
  theme: z
    .object({
      primary: z.string().optional(),
      accent: z.string().optional(),
    })
    .optional(),
});

export const homepageSectionsSchema = z.object({
  sections: z.array(
    z.object({
      key: z.string(),
      enabled: z.boolean(),
      order: z.number().int(),
      title: z.string().optional(),
      titleAr: z.string().optional(),
    }),
  ),
});
