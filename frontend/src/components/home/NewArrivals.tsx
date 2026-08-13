'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/ui/section-header';
import { ProductGrid } from '@/components/product/ProductGrid';
import api from '@/lib/api';

interface Product {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  price: number;
  salePrice: number | null;
  images: { url: string; isPrimary: boolean }[];
  brand: { name: string } | null;
  averageRating: number;
  reviewCount: number;
  stock: number;
}

export function NewArrivals() {
  const t = useTranslations('sections');
  const tCommon = useTranslations('common');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: { items: Product[] } }>('/products?sort=newest&limit=8')
      .then((r) => setProducts(r.data.data.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16">
      <div className="container">
        <SectionHeader
          title={t('newArrivals')}
          href="/products?sort=newest"
          linkLabel={tCommon('seeAll')}
        />
        <ProductGrid products={products} loading={loading} />
      </div>
    </section>
  );
}
