import { MetadataRoute } from 'next';
import api from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://beautycenter.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/categories`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.5 },
  ];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      api.get('/products?limit=1000&fields=slug,updatedAt'),
      api.get('/categories'),
    ]);

    const productRoutes: MetadataRoute.Sitemap = (productsRes.data.data.products ?? []).map(
      (p: { slug: string; updatedAt: string }) => ({
        url: `${base}/products/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })
    );

    const categoryRoutes: MetadataRoute.Sitemap = (categoriesRes.data.data.categories ?? []).map(
      (c: { slug: string }) => ({
        url: `${base}/categories/${c.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })
    );

    return [...staticRoutes, ...productRoutes, ...categoryRoutes];
  } catch {
    return staticRoutes;
  }
}
