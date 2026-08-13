'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/ui/section-header';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  image: string | null;
  icon: string | null;
  _count: { products: number };
  children: { id: string; name: string; slug: string; _count: { products: number } }[];
}

export default function CategoriesPage() {
  const t = useTranslations('nav');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: { categories: Category[] } }>('/categories?includeChildren=true')
      .then(r => setCategories(r.data.data.categories))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container py-12">
      <SectionHeader title={t('categories')} />
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={`/categories/${cat.slug}`}
                className="group block rounded-2xl border bg-card overflow-hidden hover:border-primary hover:shadow-md transition-all">
                <div className="relative aspect-video bg-gradient-luxury overflow-hidden">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">✨</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat._count.products} products</p>
                  {cat.children.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cat.children.slice(0, 3).map(child => (
                        <span key={child.id} className="text-xs bg-muted px-2 py-0.5 rounded-full">{child.name}</span>
                      ))}
                      {cat.children.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{cat.children.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
