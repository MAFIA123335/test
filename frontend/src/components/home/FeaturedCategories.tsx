'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  image: string | null;
  icon: string | null;
  _count: { products: number };
}

export function FeaturedCategories() {
  const t = useTranslations('sections');
  const tCommon = useTranslations('common');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: Category[] }>('/categories?featured=true')
      .then((r) => setCategories(r.data.data.slice(0, 6)))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 container">
      <SectionHeader
        title={t('featuredCategories')}
        href="/categories"
        linkLabel={tCommon('seeAll')}
      />
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Link
                href={`/categories/${cat.slug}`}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl border bg-card hover:border-primary hover:shadow-md transition-all"
              >
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-luxury flex items-center justify-center">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover" sizes="64px" />
                  ) : (
                    <span className="text-2xl">✨</span>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">
                    {cat.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{cat._count.products} items</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
