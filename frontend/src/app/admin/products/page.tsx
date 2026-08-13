'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Search, Archive, RotateCcw, Trash2, Edit2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  salePrice: number | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isArchived: boolean;
  thumbnail: string | null;
  category: { name: string } | null;
  brand: { name: string } | null;
  soldCount: number;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [archived, setArchived] = useState('false');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit, archived };
    if (search) params.search = search;
    api.get<{ data: { items: Product[]; total: number } }>('/products/admin/all', { params })
      .then(r => { setProducts(r.data.data.items); setTotal(r.data.data.total); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [page, search, archived]);

  useEffect(() => { load(); }, [load]);

  const handleArchive = async (id: string) => {
    try {
      await api.post(`/products/${id}/archive`);
      toast({ title: 'Product archived' });
      load();
    } catch (e: unknown) { toast({ title: (e as Error).message, variant: 'destructive' }); }
  };

  const handleRestore = async (id: string) => {
    try {
      await api.post(`/products/${id}/restore`);
      toast({ title: 'Product restored' });
      load();
    } catch (e: unknown) { toast({ title: (e as Error).message, variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product permanently?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast({ title: 'Product deleted' });
      load();
    } catch (e: unknown) { toast({ title: (e as Error).message, variant: 'destructive' }); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => router.push('/admin/products/new')}>
          <Plus className="w-4 h-4 mr-1" />Add Product
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
        </div>
        <Select value={archived} onValueChange={v => { setArchived(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="false">Active</SelectItem>
            <SelectItem value="true">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No products found</p>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Product</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">SKU</th>
                <th className="text-left p-3 font-medium">Price</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Stock</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {product.thumbnail && <Image src={product.thumbnail} alt={product.name} fill className="object-cover" sizes="40px" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category?.name ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{product.sku}</td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{formatPrice(product.salePrice ?? product.price)}</p>
                      {product.salePrice && <p className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</p>}
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className={product.stock <= 5 ? 'text-destructive font-medium' : ''}>{product.stock}</span>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {product.isFeatured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                      {!product.isActive && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                      {product.isArchived && <Badge variant="destructive" className="text-xs">Archived</Badge>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      {product.isArchived ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => void handleRestore(product.id)}>
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-yellow-600" onClick={() => void handleArchive(product.id)}>
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => void handleDelete(product.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
