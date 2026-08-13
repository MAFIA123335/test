'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SectionHeader } from '@/components/ui/section-header';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

interface Category { id: string; name: string; nameAr: string | null; slug: string; }
interface Product {
  id: string; name: string; nameAr: string | null; slug: string;
  price: number; salePrice: number | null; thumbnail: string | null;
  brand: { name: string } | null; ratingAvg: number; ratingCount: number; stock: number; isFeatured: boolean;
}

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const tCommon = useTranslations('common');
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    api.get<{ data: Category }>(`/categories/slug/${slug}`)
      .then(r => setCategory(r.data.data))
      .catch(() => undefined);
  }, [slug]);

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    api.get<{ data: { products: Product[]; total: number } }>(`/products?categoryId=${category.id}&page=${page}&limit=${limit}`)
      .then(r => { setProducts(r.data.data.products); setTotal(r.data.data.total); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [category, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container py-12">
      <SectionHeader
        title={category?.name ?? '...'}
        href="/categories"
        linkLabel="All Categories"
      />
      <ProductGrid products={products} loading={loading} />
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 border rounded-full text-sm disabled:opacity-40 hover:bg-muted transition-colors">
            Previous
          </button>
          <span className="flex items-center text-sm text-muted-foreground px-2">{page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 border rounded-full text-sm disabled:opacity-40 hover:bg-muted transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
