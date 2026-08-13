'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import api from '@/lib/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { id: string; productName: string; quantity: number }[];
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  PREPARING: 'default',
  SHIPPED: 'default',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
};

export default function OrdersPage() {
  const t = useTranslations('order');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: { items: Order[] } }>('/orders')
      .then(r => setOrders(r.data.data.items))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
  );

  if (orders.length === 0) return (
    <div className="text-center py-16">
      <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <h2 className="font-semibold text-lg mb-1">{t('empty')}</h2>
      <p className="text-muted-foreground text-sm">{t('emptyDesc')}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      {orders.map(order => (
        <Link key={order.id} href={`/dashboard/orders/${order.id}`}
          className="flex items-center gap-4 p-4 border rounded-2xl bg-card hover:border-primary transition-colors group">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{t('orderNumber')}{order.orderNumber}</span>
              <Badge variant={statusVariant[order.status] ?? 'secondary'}>{t(order.status as never)}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)} · {order.items.length} {t('items')}</p>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {order.items.map(i => `${i.productName} ×${i.quantity}`).join(', ')}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-primary">{formatPrice(order.total)}</p>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto mt-1 group-hover:text-primary transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
