'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Award } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Brand { id: string; name: string; slug: string; logo: string | null; website: string | null; _count: { products: number }; }

const schema = z.object({
  name: z.string().min(2),
  website: z.string().url().optional().or(z.literal('')),
});
type Form = z.infer<typeof schema>;

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const load = () => {
    api.get<{ data: { brands: Brand[] } }>('/brands')
      .then(r => setBrands(r.data.data.brands))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset({ name: '', website: '' }); setOpen(true); };
  const openEdit = (b: Brand) => { setEditing(b); reset({ name: b.name, website: b.website ?? '' }); setOpen(true); };

  const onSubmit = async (data: Form) => {
    try {
      if (editing) {
        await api.patch(`/brands/${editing.id}`, data);
        toast({ title: 'Brand updated' });
      } else {
        await api.post('/brands', data);
        toast({ title: 'Brand created' });
      }
      setOpen(false);
      load();
    } catch (e: unknown) { toast({ title: (e as Error).message, variant: 'destructive' }); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    try {
      await api.delete(`/brands/${id}`);
      setBrands(prev => prev.filter(b => b.id !== id));
      toast({ title: 'Brand deleted' });
    } catch (e: unknown) { toast({ title: (e as Error).message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Brands</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Brand</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : brands.length === 0 ? (
        <div className="text-center py-16"><Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No brands yet</p></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map(brand => (
            <div key={brand.id} className="border rounded-xl p-4 bg-card flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{brand.name}</p>
                <p className="text-xs text-muted-foreground">{brand._count.products} products</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(brand)}><Edit2 className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => void remove(brand.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Brand' : 'Add Brand'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
            <div className="space-y-1.5"><Label>Website</Label><Input type="url" {...register('website')} placeholder="https://..." /></div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? '...' : editing ? 'Update' : 'Create'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
