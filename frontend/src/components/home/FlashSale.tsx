'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
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

function useCountdown(endTime: Date) {
  const calc = useCallback(() => {
    const diff = Math.max(0, endTime.getTime() - Date.now());
    return {
      h: Math.floor(diff / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  }, [endTime]);

  const [time, setTime] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);

  return time;
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-primary text-primary-foreground rounded-lg w-14 h-14 flex items-center justify-center text-2xl font-bold tabular-nums"
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export function FlashSale() {
  const t = useTranslations('sections');
  const tCommon = useTranslations('common');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Flash sale ends at midnight tonight
  const endTime = new Date();
  endTime.setHours(23, 59, 59, 999);
  const { h, m, s } = useCountdown(endTime);

  useEffect(() => {
    api
      .get<{ data: { items: Product[] } }>('/products?onSale=true&limit=8')
      .then((r) => setProducts(r.data.data.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-16 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20">
      <div className="container">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <SectionHeader
            title={t('flashSale')}
            href="/products?onSale=true"
            linkLabel={tCommon('seeAll')}
            className="mb-0"
          />
          <div className="flex items-center gap-2">
            <Digit value={h} label={tCommon('hours')} />
            <span className="text-2xl font-bold text-primary mb-4">:</span>
            <Digit value={m} label={tCommon('minutes')} />
            <span className="text-2xl font-bold text-primary mb-4">:</span>
            <Digit value={s} label={tCommon('seconds')} />
          </div>
        </div>
        <ProductGrid products={products} loading={loading} />
      </div>
    </section>
  );
}
