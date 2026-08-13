'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Users, Package, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import api from '@/lib/api';

interface Stats {
  overview: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
    pendingOrders: number;
    lowStock: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    user: { firstName: string; lastName: string; email: string };
  }[];
  topProducts: {
    id: string;
    name: string;
    slug: string;
    thumbnail: string | null;
    soldCount: number;
    price: number;
  }[];
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'outline'> = {
  PENDING: 'secondary', CONFIRMED: 'default', PREPARING: 'default',
  SHIPPED: 'default', DELIVERED: 'success', CANCELLED: 'destructive',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Stats }>('/stats/dashboard')
      .then(r => setStats(r.data.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Revenue', value: formatPrice(stats.overview.revenue), icon: DollarSign, color: 'text-green-600' },
    { label: 'Total Orders', value: stats.overview.orders.toLocaleString(), icon: ShoppingBag, color: 'text-blue-600' },
    { label: 'Customers', value: stats.overview.customers.toLocaleString(), icon: Users, color: 'text-purple-600' },
    { label: 'Products', value: stats.overview.products.toLocaleString(), icon: Package, color: 'text-orange-600' },
    { label: 'Pending Orders', value: stats.overview.pendingOrders.toLocaleString(), icon: Clock, color: 'text-yellow-600' },
    { label: 'Low Stock', value: stats.overview.lowStock.toLocaleString(), icon: AlertTriangle, color: 'text-red-600' },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : statCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="text-2xl font-bold mt-1">{card.value}</p>
                    </div>
                    <div className={`p-2 rounded-xl bg-muted ${card.color}`}>
                      <card.icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
              : stats?.recentOrders.map(order => (
                <div key={order.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.user.firstName} {order.user.lastName}</p>
                  </div>
                  <Badge variant={statusVariant[order.status] ?? 'secondary'} className="text-xs shrink-0">{order.status}</Badge>
                  <p className="text-sm font-semibold shrink-0">{formatPrice(order.total)}</p>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Products</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
              : stats?.topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                  <span className="text-sm font-bold text-muted-foreground w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.soldCount} sold</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{formatPrice(product.price)}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
