'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice, formatDate } from '@/lib/utils';
import api from '@/lib/api';

interface Order {
  id: string; orderNumber: string; total: number; status: string; createdAt: string;
  items: { id: string; productName: string; quantity: number; total: number }[];
}

function OrderSuccessContent() {
  const t = useTranslations('checkout');
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    api.get<{ data: Order }>(`/orders/${orderId}`).then(r => setOrder(r.data.data)).catch(() => {});
  }, [orderId]);

  return (
    <div className="container max-w-lg py-16">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.6 }}
        className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mb-6">
          <CheckCircle className="w-11 h-11 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">{t('orderPlaced')}</h1>
        <p className="text-muted-foreground mb-8">
          {t('codDesc')}. {order && <>Order <span className="font-mono font-semibold text-foreground">#{order.orderNumber}</span></>}
        </p>
      </motion.div>

      {order && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4" />{formatDate(order.createdAt)}</span>
              <span className="font-semibold">{order.status}</span>
            </div>
            <div className="divide-y">
              {order.items.map(i => (
                <div key={i.id} className="flex justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{i.productName} × {i.quantity}</span>
                  <span className="font-medium">{formatPrice(i.total)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t pt-3 font-bold">
              <span>{t('total') ?? 'Total'}</span>
              <span className="text-primary">{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button asChild className="flex-1"><Link href="/dashboard/orders"><Package className="w-4 h-4 mr-1.5" />My Orders</Link></Button>
        <Button asChild variant="outline" className="flex-1"><Link href="/products"><ShoppingBag className="w-4 h-4 mr-1.5" />Keep Shopping</Link></Button>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="container py-16 text-center text-muted-foreground">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
