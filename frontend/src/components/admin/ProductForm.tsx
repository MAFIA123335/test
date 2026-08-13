'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { Category, Brand } from '@/types';

const schema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  description: z.string().min(5),
  sku: z.string().min(1),
  price: z.coerce.number().positive(),
  salePrice: z.coerce.number().positive().optional().or(z.literal('')),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
type Form = z.infer<typeof schema>;

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = !!productId;
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, isFeatured: false, stock: 0 },
  });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data.categories || [])).catch(() => {});
    api.get('/brands').then(r => setBrands(r.data.data.brands || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/products/${productId}`)
      .then(r => {
        const p = r.data.data;
        reset({
          name: p.name, nameAr: p.nameAr ?? '', description: p.description ?? '',
          sku: p.sku, price: p.price, salePrice: p.salePrice ?? '', stock: p.stock,
          categoryId: p.category?.id, brandId: p.brand?.id,
          isFeatured: p.isFeatured, isActive: p.isActive,
        });
        setImages((p.images ?? []).map((img: { url: string }) => img.url));
      })
      .catch(() => router.push('/admin/products'))
      .finally(() => setLoading(false));
  }, [productId, isEdit, reset, router]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach(f => form.append('images', f));
      const { data } = await api.post('/uploads/images', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const urls = (data.data as { url: string }[]).map(u => u.url);
      setImages(prev => [...prev, ...urls]);
      toast({ title: 'Images uploaded' });
    } catch (err: unknown) {
      toast({ title: (err as Error).message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: Form) => {
    const payload = {
      ...data,
      salePrice: data.salePrice === '' ? null : data.salePrice,
      images: images.map((url, i) => ({ url, sortOrder: i })),
      thumbnail: images[0],
    };
    try {
      if (isEdit) {
        await api.patch(`/products/${productId}`, payload);
        toast({ title: 'Product updated' });
      } else {
        await api.post('/products', payload);
        toast({ title: 'Product created' });
      }
      router.push('/admin/products');
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Name (EN)</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
              <div className="space-y-1.5"><Label>Name (AR)</Label><Input {...register('nameAr')} dir="rtl" /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea {...register('description')} rows={4} />{errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}</div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>SKU</Label><Input {...register('sku')} />{errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}</div>
              <div className="space-y-1.5"><Label>Price</Label><Input type="number" step="0.01" {...register('price')} />{errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}</div>
              <div className="space-y-1.5"><Label>Sale Price</Label><Input type="number" step="0.01" {...register('salePrice')} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5"><Label>Stock</Label><Input type="number" {...register('stock')} /></div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={watch('categoryId')} onValueChange={v => setValue('categoryId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Brand</Label>
                <Select value={watch('brandId')} onValueChange={v => setValue('brandId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Images</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border group">
                  <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                  {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-primary text-primary-foreground text-[10px] text-center py-0.5">Main</span>}
                </div>
              ))}
              <label className="w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
                <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Visibility</CardTitle></CardHeader>
          <CardContent className="flex gap-8">
            <div className="flex items-center gap-2"><Switch checked={watch('isActive') ?? true} onCheckedChange={v => setValue('isActive', v)} /><Label>Active</Label></div>
            <div className="flex items-center gap-2"><Switch checked={watch('isFeatured') ?? false} onCheckedChange={v => setValue('isFeatured', v)} /><Label>Featured</Label></div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting}><Save className="w-4 h-4 mr-1.5" />{isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}</Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
