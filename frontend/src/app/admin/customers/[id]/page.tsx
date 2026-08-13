'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, MapPin, ShoppingBag, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import api from '@/lib/api';

interface CustomerDetail {
  id: string; firstName: string; lastName: string; email: string;
  phone: string | null; isActive: boolean; createdAt: string;
  addresses: { id: string; label: string; city: string; country: string }[];
  orders: { id: string; total: number; status: string; createdAt: string }[];
  _count: { orders: number; reviews: number };
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: CustomerDetail }>(`/customers/admin/${id}`)
      .then(r => setCustomer(r.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );

  if (!customer) return <p className="text-muted-foreground text-sm">Customer not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">{customer.firstName} {customer.lastName}</h1>
        <Badge variant={customer.isActive ? 'success' : 'secondary'}>{customer.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle className="text-sm">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{customer.email}</div>
            {customer.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{customer.phone}</div>}
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" />Joined {formatDate(customer.createdAt)}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><ShoppingBag className="w-4 h-4" />{customer._count.orders} orders · {customer._count.reviews} reviews</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm">Addresses</CardTitle></CardHeader>
          <CardContent>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No addresses saved.</p>
            ) : (
              <div className="space-y-2">
                {customer.addresses.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{a.label}:</span>
                    <span className="text-muted-foreground">{a.city}, {a.country}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent Orders</CardTitle></CardHeader>
        <CardContent className="p-0">
          {customer.orders.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">No orders yet.</p>
          ) : (
            <div className="divide-y">
              {customer.orders.map(o => (
                <div key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">#{o.id.slice(-8).toUpperCase()}</span>
                  <Badge variant="outline">{o.status}</Badge>
                  <span className="font-medium">{formatPrice(o.total)}</span>
                  <span className="text-muted-foreground hidden sm:block">{formatDate(o.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
