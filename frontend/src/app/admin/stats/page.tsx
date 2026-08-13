'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingBag, Users, Package, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';

interface StatsData {
  monthly: { month: string; revenue: number; orders: number }[];
  topCategories: { name: string; count: number; revenue: number }[];
  topBrands: { name: string; count: number; revenue: number }[];
  overview: { revenue: number; orders: number; customers: number; products: number };
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: StatsData }>('/stats/detailed')
      .then(r => setStats(r.data.data))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Statistics</h1>

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />) : [
          { label: 'Total Revenue', value: formatPrice(stats?.overview.revenue ?? 0), icon: DollarSign, color: 'text-green-600' },
          { label: 'Total Orders', value: (stats?.overview.orders ?? 0).toLocaleString(), icon: ShoppingBag, color: 'text-blue-600' },
          { label: 'Customers', value: (stats?.overview.customers ?? 0).toLocaleString(), icon: Users, color: 'text-purple-600' },
          { label: 'Products', value: (stats?.overview.products ?? 0).toLocaleString(), icon: Package, color: 'text-orange-600' },
        ].map((card, i) => (
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

      {/* Monthly revenue */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Monthly Revenue</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-40 rounded-xl" /> : (
            <div className="space-y-2">
              {(stats?.monthly ?? []).map((m, i) => {
                const max = Math.max(...(stats?.monthly ?? []).map(x => x.revenue), 1);
                const pct = (m.revenue / max) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{m.month}</span>
                    <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        className="h-full bg-primary rounded-full flex items-center justify-end pr-2"
                      >
                        {pct > 20 && <span className="text-[10px] text-primary-foreground font-medium">{formatPrice(m.revenue)}</span>}
                      </motion.div>
                    </div>
                    <span className="text-xs font-medium w-20 text-right shrink-0">{m.orders} orders</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top categories */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Categories</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />) :
              (stats?.topCategories ?? []).map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.count} orders</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{formatPrice(cat.revenue)}</p>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Top brands */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Brands</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {loading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />) :
              (stats?.topBrands ?? []).map((brand, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{brand.name}</p>
                    <p className="text-xs text-muted-foreground">{brand.count} orders</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">{formatPrice(brand.revenue)}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
