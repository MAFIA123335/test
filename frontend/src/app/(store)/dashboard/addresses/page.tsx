'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Plus, Trash2, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Address {
  id: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  building: string | null;
  postalCode: string | null;
  isDefault: boolean;
}

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  country: z.string().min(2),
  city: z.string().min(2),
  street: z.string().min(2),
  building: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

type Form = z.infer<typeof schema>;

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const load = () => {
    api.get<{ data: Address[] }>('/addresses')
      .then(r => setAddresses(r.data.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (data: Form) => {
    setSaving(true);
    try {
      await api.post('/addresses', data);
      toast({ title: 'Address added' });
      setOpen(false);
      reset();
      load();
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await api.delete(`/addresses/${id}`);
    setAddresses(prev => prev.filter(a => a.id !== id));
    toast({ title: 'Address deleted' });
  };

  if (loading) return <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Addresses</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No saved addresses</p>
        </div>
      ) : (
        addresses.map(addr => (
          <motion.div key={addr.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex gap-4 p-4 border rounded-2xl bg-card">
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">{addr.fullName}</p>
                {addr.isDefault && <span className="text-xs text-primary font-medium flex items-center gap-0.5"><Star className="w-3 h-3 fill-current" />Default</span>}
              </div>
              <p className="text-sm text-muted-foreground">{addr.street}{addr.building ? `, ${addr.building}` : ''}</p>
              <p className="text-sm text-muted-foreground">{addr.city}, {addr.country}{addr.postalCode ? ` ${addr.postalCode}` : ''}</p>
              <p className="text-sm text-muted-foreground">{addr.phone}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => void remove(addr.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Address</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Full Name</Label><Input {...register('fullName')} />{errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}</div>
              <div className="space-y-1"><Label>Phone</Label><Input {...register('phone')} />{errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Country</Label><Input {...register('country')} /></div>
              <div className="space-y-1"><Label>City</Label><Input {...register('city')} /></div>
            </div>
            <div className="space-y-1"><Label>Street</Label><Input {...register('street')} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Building</Label><Input {...register('building')} /></div>
              <div className="space-y-1"><Label>Postal Code</Label><Input {...register('postalCode')} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="isDefault" {...register('isDefault')} />
              <Label htmlFor="isDefault">Set as default</Label>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>{saving ? '...' : 'Save Address'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
