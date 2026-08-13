'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Ticket } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Coupon {
  id: string; code: string; type: string; value: number;
  minPurchase: number; usageLimit: number | null; usedCount: number;
  perUserLimit: number; isActive: boolean;
  startsAt: string | null; expiresAt: string | null;
}

const schema = z.object({
  code: z.string().min(3).max(32),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.coerce.number().positive(),
  minPurchase: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().positive().nullable().optional(),
  perUserLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'PERCENTAGE', isActive: true },
  });

  const load = () => {
    api.get<{ data: Coupon[] }>('/coupons')
      .then(r => setCoupons(r.data.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset({ type: 'PERCENTAGE', isActive: true }); setOpen(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    reset({ code: c.code, type: c.type as 'PERCENTAGE' | 'FIXED', value: c.value, minPurchase: c.minPurchase, usageLimit: c.usageLimit, perUserLimit: c.perUserLimit, isActive: c.isActive });
    setOpen(true);
  };

  const onSubmit = async (data: Form) => {
    try {
      if (editing) {
        await api.patch(`/coupons/${editing.id}`, data);
        toast({ title: 'Coupon updated' });
      } else {
        await api.post('/coupons', data);
        toast({ title: 'Coupon created' });
      }
      setOpen(false);
      load();
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Coupon deleted' });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" />Add Coupon</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16"><Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No coupons yet</p></div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Value</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Usage</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Expires</th>
                <th className="text-left p-3 font-medium">Active</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {coupons.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono font-medium">{c.code}</td>
                  <td className="p-3"><Badge variant="secondary">{c.type}</Badge></td>
                  <td className="p-3">{c.type === 'PERCENTAGE' ? `${c.value}%` : `$${c.value}`}</td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}</td>
                  <td className="p-3 hidden lg:table-cell text-muted-foreground">{c.expiresAt ? formatDate(c.expiresAt) : '—'}</td>
                  <td className="p-3"><Badge variant={c.isActive ? 'success' : 'outline'}>{c.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(c)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => void remove(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Code</Label><Input {...register('code')} className="uppercase" />{errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}</div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select defaultValue="PERCENTAGE" onValueChange={v => setValue('type', v as 'PERCENTAGE' | 'FIXED')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Value</Label><Input type="number" step="0.01" {...register('value')} /></div>
              <div className="space-y-1"><Label>Min Purchase</Label><Input type="number" step="0.01" {...register('minPurchase')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Usage Limit</Label><Input type="number" {...register('usageLimit')} placeholder="Unlimited" /></div>
              <div className="space-y-1"><Label>Per User Limit</Label><Input type="number" {...register('perUserLimit')} /></div>
            </div>
            <div className="space-y-1"><Label>Expires At</Label><Input type="datetime-local" {...register('expiresAt')} /></div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? '...' : editing ? 'Update' : 'Create'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
