'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

export default function CartPage() {
  const t = useTranslations('cart');
  const { cart, removeItem, updateQuantity, loading } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState('');

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post<{ data: { discount: number } }>('/coupons/validate', {
        code: couponCode,
        subtotal: cart.subtotal,
      });
      setCouponDiscount(data.data.discount);
      setAppliedCoupon(couponCode);
      toast({ title: t('couponApplied') });
    } catch (e: unknown) {
      toast({ title: (e as Error).message || t('invalidCoupon'), variant: 'destructive' });
    } finally {
      setCouponLoading(false);
    }
  };

  const total = Math.max(0, cart.subtotal - couponDiscount);

  if (cart.items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('empty')}</h2>
        <p className="text-muted-foreground mb-8">{t('emptyDesc')}</p>
        <Button asChild>
          <Link href="/products">{t('continueShopping')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {cart.items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-4 p-4 border rounded-2xl bg-card"
              >
                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
                  {item.product.thumbnail ? (
                    <Image src={item.product.thumbnail} alt={item.product.name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="w-full h-full bg-gradient-luxury" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="font-medium hover:text-primary transition-colors line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-sm text-primary font-semibold mt-0.5">{formatPrice(item.product.effectivePrice)}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border rounded-full overflow-hidden">
                      <button onClick={() => void updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="px-2.5 py-1.5 hover:bg-muted transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-sm font-medium tabular-nums">{item.quantity}</span>
                      <button onClick={() => void updateQuantity(item.id, Math.min(item.product.stock, item.quantity + 1))} disabled={item.quantity >= item.product.stock} className="px-2.5 py-1.5 hover:bg-muted transition-colors disabled:opacity-40">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => void removeItem(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold">{formatPrice(item.lineTotal)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="border rounded-2xl p-6 bg-card space-y-4">
            <h2 className="font-semibold text-lg">{t('orderSummary')}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('subtotal')} ({cart.count} {cart.count === 1 ? t('item') : t('items')})</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>{t('discount')}</span>
                  <span>-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>{t('shipping')}</span>
                <span className="text-green-600">{t('freeShipping')}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>{t('total')}</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>

            {/* Coupon */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('coupon')}
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  className="pl-9"
                  disabled={!!appliedCoupon}
                />
              </div>
              <Button variant="outline" onClick={() => void applyCoupon()} disabled={couponLoading || !!appliedCoupon}>
                {t('applyCoupon')}
              </Button>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon}` : ''}`}>
                {t('checkout')} <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/products">{t('continueShopping')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
