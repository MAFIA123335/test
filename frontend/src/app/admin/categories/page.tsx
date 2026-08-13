'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Category { id: string; name: string; nameAr: string | null; slug: string; isFeatured: boolean; parentId: string | null; _count: { products: number }; }

const schema = z.object({
  name: z.string().min(2),
  nameAr: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.coerce.number().optional(),
});
type Form = z.infer<typeof schema>;

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { isFeatured: false },
  });

  const load = () => {
    api.get<{ data: { categories: Category[] } }>('/categories')
      .then(r => setCategories(r.data.data.categories))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset({ name: '', nameAr: '', isFeatured: false, parentId: null }); setOpen(true); };
  const openEdit = (c: Category) => {
    setEditing(c);
    reset({ name: c.name, nameAr: c.nameAr ?? '', isFeatured: c.isFeatured, parentId: c.parentId });
    setOpen(true);
  };

  const onSubmit = async (data: Form) => {
    try {
      if (editing) {
        await api.patch(`/categories/${editing.id}`, data);
        toast({ title: 'Category updated' });
      } else {
        await api.post('/categories', data);
        toast({ title: 'Category created' });
      }
      setOpen(false);
      load();
    } catch (e: unknown) { toast({ title: (e as Error).message, variant: 'destructive' }); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Category deleted' });
    } catch (e: unknown) { toast({ title: (e as Error).message, variant: 'destructive' }); }
  };

  const rootCategories = categories.filter(c => !c.parentId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Category</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16"><Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No categories yet</p></div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Parent</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">Products</th>
                <th className="text-left p-3 font-medium">Featured</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <p className="font-medium">{cat.name}</p>
                    {cat.nameAr && <p className="text-xs text-muted-foreground" dir="rtl">{cat.nameAr}</p>}
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">
                    {cat.parentId ? categories.find(c => c.id === cat.parentId)?.name ?? '—' : '—'}
                  </td>
                  <td className="p-3 hidden sm:table-cell">{cat._count.products}</td>
                  <td className="p-3">
                    <Switch checked={cat.isFeatured} onCheckedChange={async v => {
                      try { await api.patch(`/categories/${cat.id}`, { isFeatured: v }); setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, isFeatured: v } : c)); }
                      catch { /* ignore */ }
                    }} />
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(cat)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => void remove(cat.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name (EN)</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
              <div className="space-y-1.5"><Label>Name (AR)</Label><Input {...register('nameAr')} dir="rtl" /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Parent Category</Label>
              <Select onValueChange={v => setValue('parentId', v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="None (root)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root)</SelectItem>
                  {rootCategories.filter(c => c.id !== editing?.id).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={watch('isFeatured') ?? false} onCheckedChange={v => setValue('isFeatured', v)} />
              <Label>Featured</Label>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? '...' : editing ? 'Update' : 'Create'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
