'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Save, Globe, ShoppingCart, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface SiteSettings {
  siteName: string;
  siteNameAr: string;
  email: string;
  phone: string;
  address: string;
  social: { facebook: string; instagram: string; twitter: string; tiktok: string; youtube: string };
}

interface CommerceSettings {
  currency: string;
  taxRate: number;
  shippingFlatRate: number;
  freeShippingThreshold: number;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);

  const siteForm = useForm<SiteSettings>();
  const commerceForm = useForm<CommerceSettings>();

  useEffect(() => {
    api.get<{ data: { site: SiteSettings; commerce: CommerceSettings } }>('/settings/public')
      .then(r => {
        siteForm.reset(r.data.data.site);
        commerceForm.reset(r.data.data.commerce);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const saveSite = async (data: SiteSettings) => {
    try {
      await api.put('/settings/site', data);
      toast({ title: 'Site settings saved' });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  const saveCommerce = async (data: CommerceSettings) => {
    try {
      await api.put('/settings/commerce', data);
      toast({ title: 'Commerce settings saved' });
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs defaultValue="site">
        <TabsList>
          <TabsTrigger value="site"><Globe className="w-4 h-4 mr-1.5" />Site</TabsTrigger>
          <TabsTrigger value="commerce"><ShoppingCart className="w-4 h-4 mr-1.5" />Commerce</TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Site Settings</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={siteForm.handleSubmit(saveSite)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Site Name (EN)</Label><Input {...siteForm.register('siteName')} /></div>
                  <div className="space-y-1.5"><Label>Site Name (AR)</Label><Input {...siteForm.register('siteNameAr')} dir="rtl" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Email</Label><Input type="email" {...siteForm.register('email')} /></div>
                  <div className="space-y-1.5"><Label>Phone</Label><Input {...siteForm.register('phone')} /></div>
                </div>
                <div className="space-y-1.5"><Label>Address</Label><Input {...siteForm.register('address')} /></div>
                <div className="border-t pt-4">
                  <p className="font-medium text-sm mb-3">Social Media</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(['facebook', 'instagram', 'twitter', 'tiktok', 'youtube'] as const).map(s => (
                      <div key={s} className="space-y-1.5">
                        <Label className="capitalize">{s}</Label>
                        <Input {...siteForm.register(`social.${s}`)} placeholder={`https://${s}.com/...`} />
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={siteForm.formState.isSubmitting}>
                  <Save className="w-4 h-4 mr-1.5" />Save Site Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commerce" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Commerce Settings</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={commerceForm.handleSubmit(saveCommerce)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Currency</Label><Input {...commerceForm.register('currency')} placeholder="USD" /></div>
                  <div className="space-y-1.5"><Label>Tax Rate (%)</Label><Input type="number" step="0.01" {...commerceForm.register('taxRate')} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label>Flat Shipping Rate</Label><Input type="number" step="0.01" {...commerceForm.register('shippingFlatRate')} /></div>
                  <div className="space-y-1.5"><Label>Free Shipping Threshold</Label><Input type="number" step="0.01" {...commerceForm.register('freeShippingThreshold')} /></div>
                </div>
                <Button type="submit" disabled={commerceForm.formState.isSubmitting}>
                  <Save className="w-4 h-4 mr-1.5" />Save Commerce Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
