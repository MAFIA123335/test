import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export interface CommerceSettings {
  currency: string;
  taxRate: number;
  shippingFlatRate: number;
  freeShippingThreshold: number;
}

const DEFAULTS: Record<string, Prisma.JsonValue> = {
  commerce: {
    currency: 'USD',
    taxRate: 5,
    shippingFlatRate: 5,
    freeShippingThreshold: 100,
  },
  site: {
    siteName: 'Beauty Center',
    siteNameAr: 'مركز الجمال',
    logo: null,
    banner: null,
    email: 'support@beautycenter.com',
    phone: '+1 (555) 123-4567',
    address: '123 Luxury Avenue, Beauty City',
    social: {
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
      twitter: 'https://twitter.com',
      tiktok: '',
      youtube: '',
    },
    theme: { primary: '#ec4899', accent: '#f9a8d4' },
  },
  homepage: {
    sections: [
      { key: 'hero', enabled: true, order: 0 },
      { key: 'categories', enabled: true, order: 1 },
      { key: 'featured', enabled: true, order: 2 },
      { key: 'bestSellers', enabled: true, order: 3 },
      { key: 'newArrivals', enabled: true, order: 4 },
      { key: 'flashSale', enabled: true, order: 5 },
      { key: 'testimonials', enabled: true, order: 6 },
      { key: 'newsletter', enabled: true, order: 7 },
      { key: 'instagram', enabled: true, order: 8 },
    ],
  },
};

export class SettingsService {
  async get(key: string): Promise<Prisma.JsonValue> {
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (setting) return setting.value as Prisma.JsonValue;
    return DEFAULTS[key] ?? null;
  }

  async getAll(): Promise<Record<string, Prisma.JsonValue>> {
    const rows = await prisma.setting.findMany();
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...DEFAULTS, ...stored };
  }

  async set(key: string, value: Prisma.InputJsonValue): Promise<Prisma.JsonValue> {
    const existing = await this.get(key);
    // Shallow-merge objects so partial updates keep other keys.
    const merged =
      existing && typeof existing === 'object' && !Array.isArray(existing) && typeof value === 'object'
        ? { ...(existing as object), ...(value as object) }
        : value;
    const row = await prisma.setting.upsert({
      where: { key },
      update: { value: merged as Prisma.InputJsonValue },
      create: { key, value: merged as Prisma.InputJsonValue },
    });
    return row.value as Prisma.JsonValue;
  }

  async getCommerceSettings(): Promise<CommerceSettings> {
    const value = (await this.get('commerce')) as unknown as CommerceSettings;
    return { ...(DEFAULTS.commerce as unknown as CommerceSettings), ...value };
  }
}

export const settingsService = new SettingsService();
