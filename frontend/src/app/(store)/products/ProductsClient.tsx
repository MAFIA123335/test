'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, X } from 'lucide-react';
import api from '@/lib/api';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { ProductCardProps } from '@/components/product/ProductCard';

interface Category { id: string; name: string; slug: string; }
interface Brand { id: string; name: string; slug: string; }

export default function ProductsClient() {
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    brandId: searchParams.get('brandId') || '',
    minPrice: Number(searchParams.get('minPrice')) || 0,
    maxPrice: Number(searchParams.get('maxPrice')) || 10000,
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    inStock: searchParams.get('inStock') === 'true',
    onSale: searchParams.get('onSale') === 'true',
  });

  const limit = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, limit, sortBy: filters.sortBy, sortOrder: filters.sortOrder };
      if (filters.search) params.search = filters.search;
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.brandId) params.brandId = filters.brandId;
      if (filters.minPrice > 0) params.minPrice = filters.minPrice;
      if (filters.maxPrice < 10000) params.maxPrice = filters.maxPrice;
      if (filters.inStock) params.inStock = true;
      if (filters.onSale) params.onSale = true;
      const res = await api.get('/products', { params });
      setProducts(res.data.data.products);
      setTotal(res.data.data.total);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { void fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data.categories || [])).catch(() => {});
    api.get('/brands').then(r => setBrands(r.data.data.brands || [])).catch(() => {});
  }, []);

  const updateFilter = (key: string, value: string | number | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', categoryId: '', brandId: '', minPrice: 0, maxPrice: 10000, sortBy: 'createdAt', sortOrder: 'desc', inStock: false, onSale: false });
    setPage(1);
  };

  const activeFilterCount = [filters.categoryId, filters.brandId, filters.inStock, filters.onSale, filters.minPrice > 0, filters.maxPrice < 10000].filter(Boolean).length;
  const totalPages = Math.ceil(total / limit);

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox id="cat-all" checked={!filters.categoryId} onCheckedChange={() => updateFilter('categoryId', '')} />
            <Label htmlFor="cat-all">All</Label>
          </div>
          {categories.map(c => (
            <div key={c.id} className="flex items-center gap-2">
              <Checkbox id={`cat-${c.id}`} checked={filters.categoryId === c.id} onCheckedChange={() => updateFilter('categoryId', filters.categoryId === c.id ? '' : c.id)} />
              <Label htmlFor={`cat-${c.id}`}>{c.name}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-3">Brands</h3>
        <div className="space-y-2">
          {brands.map(b => (
            <div key={b.id} className="flex items-center gap-2">
              <Checkbox id={`brand-${b.id}`} checked={filters.brandId === b.id} onCheckedChange={() => updateFilter('brandId', filters.brandId === b.id ? '' : b.id)} />
              <Label htmlFor={`brand-${b.id}`}>{b.name}</Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-semibold mb-3">{t('priceRange')}</h3>
        <Slider min={0} max={10000} step={100} value={[filters.minPrice, filters.maxPrice]}
          onValueChange={([min, max]) => { updateFilter('minPrice', min); updateFilter('maxPrice', max); }} />
        <div className="flex justify-between text-sm mt-2 text-muted-foreground">
          <span>${filters.minPrice}</span><span>${filters.maxPrice}</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Checkbox id="inStock" checked={filters.inStock} onCheckedChange={v => updateFilter('inStock', !!v)} />
          <Label htmlFor="inStock">{t('inStockOnly')}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="onSale" checked={filters.onSale} onCheckedChange={v => updateFilter('onSale', !!v)} />
          <Label htmlFor="onSale">{t('onSale')}</Label>
        </div>
      </div>
      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="w-4 h-4 mr-2" />Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input placeholder="Search products..." value={filters.search} onChange={e => updateFilter('search', e.target.value)} className="max-w-sm" />
        <div className="flex gap-2 ml-auto">
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <SlidersHorizontal className="w-4 h-4 mr-2" />Filters
                {activeFilterCount > 0 && <Badge className="ml-2">{activeFilterCount}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
              <div className="mt-4"><FilterPanel /></div>
            </SheetContent>
          </Sheet>
          <Select value={`${filters.sortBy}-${filters.sortOrder}`}
            onValueChange={v => { const [by, order] = v.split('-'); updateFilter('sortBy', by); updateFilter('sortOrder', order); }}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt-desc">{t('newest')}</SelectItem>
              <SelectItem value="price-asc">{t('priceAsc')}</SelectItem>
              <SelectItem value="price-desc">{t('priceDesc')}</SelectItem>
              <SelectItem value="ratingAvg-desc">{t('topRated')}</SelectItem>
              <SelectItem value="name-asc">{t('nameAsc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Filters</h2>
              {activeFilterCount > 0 && <Badge>{activeFilterCount}</Badge>}
            </div>
            <FilterPanel />
          </div>
        </aside>
        <main className="flex-1">
          <p className="text-sm text-muted-foreground mb-4">{total} products</p>
          <ProductGrid products={products} loading={loading} />
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = page <= 3 ? i + 1 : page - 2 + i;
                if (p < 1 || p > totalPages) return null;
                return <Button key={p} variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>;
              })}
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
