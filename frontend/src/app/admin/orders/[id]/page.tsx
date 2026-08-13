'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Order {
  id: string; orderNumber: string; status: string; paymentMethod: string; paymentStatus: string;
  subtotal: number; discount: number; shippingCost: number; tax: number; total: number;
  couponCode: string | null; notes: string | null;
  shippingName: string; shippingPhone: string; shippingCountry: string; shippingCity: string; shippingStreet: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  items: { id: string; productName: string; sku: string; price: number; quantity: number; total: number; productImage: string | null }[];
  history: { id: string; status: string; note: string | null; createdAt: string }[];
}

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  PENDING: 'secondary', CONFIRMED: 'default', PREPARING: 'default',
  SHIPPED: 'default', DELIVERED: 'success', CANCELLED: 'destructive',
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get<{ data: Order }>(`/orders/admin/${id}`)
      .then(r => setOrder(r.data.data))
      .catch(() => router.push('/admin/orders'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const { data } = await api.patch<{ data: Order }>(`/orders/admin/${id}/status`, { status });
      setOrder(data.data);
      toast({ title: `Status updated to ${status}` });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  if (!order) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant[order.status] ?? 'secondary'}>{order.status}</Badge>
          <Select value={order.status} onValueChange={v => void updateStatus(v)} disabled={updating}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><User className="w-4 h-4 text-primary" />Customer</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{order.user.firstName} {order.user.lastName}</p>
            <p className="text-muted-foreground">{order.user.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Package className="w-4 h-4 text-primary" />Shipping</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{order.shippingName}</p>
            <p className="text-muted-foreground">{order.shippingStreet}, {order.shippingCity}, {order.shippingCountry}</p>
            <p className="text-muted-foreground">{order.shippingPhone}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Items</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3 py-3">
              <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                <p className="text-xs text-muted-foreground">SKU: {item.sku} · Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(item.total)}</p>
            </div>
          ))}
          <div className="pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
            <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">{formatPrice(order.total)}</span></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Status History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {order.history.map((h, i) => (
            <div key={h.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />
                {i < order.history.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
              </div>
              <div className="pb-3">
                <p className="text-sm font-medium">{h.status}</p>
                {h.note && <p className="text-xs text-muted-foreground">{h.note}</p>}
                <p className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
