import { OrderStatus, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';

/** Aggregated statistics for the admin dashboard (revenue, orders, charts). */
export class StatsService {
  private revenueWhere = { status: { not: OrderStatus.CANCELLED } };

  async overview() {
    const [revenueAgg, orderCount, customerCount, productCount, pendingOrders, lowStock] =
      await Promise.all([
        prisma.order.aggregate({ where: this.revenueWhere, _sum: { total: true } }),
        prisma.order.count(),
        prisma.user.count({ where: { role: Role.CUSTOMER } }),
        prisma.product.count({ where: { isArchived: false } }),
        prisma.order.count({ where: { status: OrderStatus.PENDING } }),
        prisma.product.count({ where: { stock: { lte: 5 }, isArchived: false } }),
      ]);

    return {
      revenue: Number(revenueAgg._sum.total ?? 0),
      orders: orderCount,
      customers: customerCount,
      products: productCount,
      pendingOrders,
      lowStock,
    };
  }

  /** Monthly revenue + order counts for the last N months (default 12). */
  async monthlySales(months = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: OrderStatus.CANCELLED } },
      select: { total: true, createdAt: true },
    });

    const buckets = new Map<string, { revenue: number; orders: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(since);
      d.setMonth(since.getMonth() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, { revenue: 0, orders: 0 });
    }
    for (const order of orders) {
      const d = order.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.revenue += Number(order.total);
        bucket.orders += 1;
      }
    }
    return [...buckets.entries()].map(([month, v]) => ({ month, ...v }));
  }

  async ordersByStatus() {
    const grouped = await prisma.order.groupBy({ by: ['status'], _count: { _all: true } });
    return grouped.map((g) => ({ status: g.status, count: g._count._all }));
  }

  async topProducts(limit = 8) {
    return prisma.product.findMany({
      where: { soldCount: { gt: 0 } },
      orderBy: { soldCount: 'desc' },
      take: limit,
      select: { id: true, name: true, slug: true, thumbnail: true, soldCount: true, price: true },
    });
  }

  async recentOrders(limit = 8) {
    return prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async dashboard() {
    const [overview, monthlySales, ordersByStatus, topProducts, recentOrders] = await Promise.all([
      this.overview(),
      this.monthlySales(12),
      this.ordersByStatus(),
      this.topProducts(8),
      this.recentOrders(8),
    ]);
    return { overview, monthlySales, ordersByStatus, topProducts, recentOrders };
  }
}

export const statsService = new StatsService();
