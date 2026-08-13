'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Package, MapPin, CreditCard, Clock, ArrowLeft, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface OrderItem { id: string; productName: string; sku: string; price: number; quantity: number; total: number; productImage: string | null; }
interface OrderHistory { id: string; status: string; note: string | null; createdAt: string; }
interface Order {
  id: string; orderNumber: string; status: string; paymentMethod: string; paymentStatus: string;
  subtotal: number; discount: number; shippingCost: number; tax: number; total: number;
  couponCode: string | null; notes: string | null;
  shippingName: string; shippingPhone: string; shippingCountry: string; shippingCity: string; shippingStreet: string;
  createdAt: string; items: OrderItem[]; history: OrderHistory[];
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  PENDING: 'secondary', CONFIRMED: 'default', PREPARING: 'default',
  SHIPPED: 'default', DELIVERED: 'success', CANCELLED: 'destructive',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations('order');
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.get<{ data: Order }>(`/orders/${id}`)
      .then(r => setOrder(r.data.data))
      .catch(() => router.push('/dashboard/orders'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleCancel = async () => {
    if (!confirm(t('cancelConfirm'))) return;
    setCancelling(true);
    try {
      const { data } = await api.post<{ data: Order }>(`/orders/${id}/cancel`);
      setOrder(data.data);
      toast({ title: t('cancelled') });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{t('orderNumber')}{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <Badge variant={statusVariant[order.status] ?? 'secondary'} className="ml-auto">{t(order.status as never)}</Badge>
      </div>

      {/* Items */}
      <div className="border rounded-2xl overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          <span className="font-medium">{t('items')}</span>
        </div>
        <div className="divide-y">
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm line-clamp-1">{item.productName}</p>
                <p className="text-xs text-muted-foreground">SKU: {item.sku} · Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-sm">{formatPrice(item.total)}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
          <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span></div>
          {order.tax > 0 && <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{formatPrice(order.tax)}</span></div>}
          <Separator />
          <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">{formatPrice(order.total)}</span></div>
        </div>
      </div>

      {/* Shipping */}
      <div className="border rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 font-medium mb-3"><MapPin className="w-4 h-4 text-primary" />Shipping Address</div>
        <p className="text-sm">{order.shippingName}</p>
        <p className="text-sm text-muted-foreground">{order.shippingStreet}, {order.shippingCity}, {order.shippingCountry}</p>
        <p className="text-sm text-muted-foreground">{order.shippingPhone}</p>
      </div>

      {/* History */}
      <div className="border rounded-2xl p-4">
        <div className="flex items-center gap-2 font-medium mb-4"><Clock className="w-4 h-4 text-primary" />{t('history')}</div>
        <div className="space-y-3">
          {order.history.map((h, i) => (
            <motion.div key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />
                {i < order.history.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
              </div>
              <div className="pb-3">
                <p className="text-sm font-medium">{t(h.status as never)}</p>
                {h.note && <p className="text-xs text-muted-foreground">{h.note}</p>}
                <p className="text-xs text-muted-foreground">{formatDate(h.createdAt)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {order.status === 'PENDING' && (
        <Button variant="destructive" onClick={() => void handleCancel()} disabled={cancelling} className="w-full">
          <XCircle className="w-4 h-4 mr-2" />{t('cancel')}
        </Button>
      )}
    </div>
  );
}
