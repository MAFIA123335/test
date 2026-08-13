'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { MapPin, CreditCard, ShoppingBag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Suspense } from 'react';

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(6),
  country: z.string().min(2),
  city: z.string().min(2),
  street: z.string().min(2),
  building: z.string().optional(),
  postalCode: z.string().optional(),
  saveAddress: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

type Form = z.infer<typeof schema>;

function CheckoutForm() {
  const t = useTranslations('checkout');
  const tCart = useTranslations('cart');
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const couponCode = searchParams.get('coupon') ?? '';

  const [step, setStep] = useState<'shipping' | 'review' | 'success'>('shipping');
  const [orderId, setOrderId] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user ? `${user.firstName} ${user.lastName}` : '',
      phone: user?.phone ?? '',
    },
  });

  useEffect(() => {
    if (!isAuthenticated) router.push('/login?redirect=/checkout');
  }, [isAuthenticated, router]);

  const onSubmit = async (data: Form) => {
    setSubmitting(true);
    try {
      const { data: res } = await api.post<{ data: { id: string; orderNumber: string } }>('/orders/checkout', {
        paymentMethod: 'COD',
        couponCode: couponCode || undefined,
        notes: data.notes,
        shipping: {
          fullName: data.fullName,
          phone: data.phone,
          country: data.country,
          city: data.city,
          street: data.street,
          building: data.building,
          postalCode: data.postalCode,
          saveAddress: data.saveAddress,
        },
      });
      setOrderId(res.data.id);
      setOrderNumber(res.data.orderNumber);
      await clearCart();
      setStep('success');
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold">{t('orderPlaced')}</h1>
        <p className="text-muted-foreground">{t('orderNumber')}: <span className="font-bold text-primary">{orderNumber}</span></p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push(`/dashboard/orders/${orderId}`)}>View Order</Button>
          <Button variant="outline" onClick={() => router.push('/products')}>Continue Shopping</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {t('shippingInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('fullName')}</Label>
                  <Input {...register('fullName')} />
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>{t('phone')}</Label>
                  <Input type="tel" {...register('phone')} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('country')}</Label>
                  <Input {...register('country')} />
                  {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>{t('city')}</Label>
                  <Input {...register('city')} />
                  {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t('street')}</Label>
                <Input {...register('street')} />
                {errors.street && <p className="text-xs text-destructive">{errors.street.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{t('building')}</Label>
                  <Input {...register('building')} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t('postalCode')}</Label>
                  <Input {...register('postalCode')} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="saveAddress" {...register('saveAddress')} />
                <Label htmlFor="saveAddress">{t('saveAddress')}</Label>
              </div>
              <div className="space-y-1.5">
                <Label>{t('notes')}</Label>
                <Input {...register('notes')} placeholder={t('notes')} />
              </div>

              {/* Payment */}
              <div className="border rounded-xl p-4 bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <CreditCard className="w-4 h-4 text-primary" />
                  {t('paymentMethod')}
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                  <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t('cod')}</p>
                    <p className="text-xs text-muted-foreground">{t('codDesc')}</p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              {tCart('orderSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {cart.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground line-clamp-1 flex-1">{item.product.name} × {item.quantity}</span>
                  <span className="font-medium ml-2">{formatPrice(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{tCart('subtotal')}</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{tCart('shipping')}</span>
                <span className="text-green-600">{tCart('freeShipping')}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>{tCart('total')}</span>
              <span className="text-primary">{formatPrice(cart.subtotal)}</span>
            </div>
            <Button type="submit" form="checkout-form" className="w-full" size="lg" disabled={submitting || cart.items.length === 0}>
              {submitting ? '...' : t('placeOrder')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>
      <Suspense>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
