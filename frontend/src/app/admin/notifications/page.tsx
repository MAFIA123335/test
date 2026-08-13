'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string } | null;
}

const schema = z.object({
  title: z.string().min(2),
  message: z.string().min(2),
  type: z.string(),
  userId: z.string().optional(),
});
type Form = z.infer<typeof schema>;

const TYPES = ['SYSTEM', 'ORDER_STATUS', 'NEW_ORDER', 'LOW_STOCK', 'NEW_REVIEW', 'NEW_TICKET', 'TICKET_REPLY'];

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'SYSTEM' },
  });

  const load = useCallback(() => {
    setLoading(true);
    api.get<{ data: { items: Notification[]; total: number } }>('/notifications/admin/all', { params: { page, limit } })
      .then(r => { setItems(r.data.data.items); setTotal(r.data.data.total); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const onSubmit = async (data: Form) => {
    try {
      await api.post('/notifications/admin/send', data);
      toast({ title: 'Notification sent' });
      setOpen(false);
      reset();
      load();
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  const remove = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setItems(prev => prev.filter(n => n.id !== id));
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button onClick={() => { reset({ type: 'SYSTEM' }); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" />Send Notification
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <div key={n.id} className={`flex gap-3 p-4 border rounded-xl bg-card ${!n.isRead ? 'border-primary/20 bg-primary/5' : ''}`}>
              <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium text-sm">{n.title}</p>
                  <Badge variant="outline" className="text-xs">{n.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {n.user ? `${n.user.firstName} ${n.user.lastName}` : 'All users'} · {formatDate(n.createdAt)}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive shrink-0" onClick={() => void remove(n.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select defaultValue="SYSTEM" onValueChange={v => setValue('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Title</Label><Input {...register('title')} /></div>
            <div className="space-y-1.5"><Label>Message</Label><Textarea {...register('message')} rows={3} /></div>
            <div className="space-y-1.5"><Label>User ID (leave blank for all)</Label><Input {...register('userId')} placeholder="Optional" /></div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? '...' : 'Send'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
