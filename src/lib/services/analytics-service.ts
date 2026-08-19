import "server-only";

import { prisma } from "@/lib/db";
import { roundMoney } from "@/lib/utils";

export async function dashboardMetrics() {
  const [orders, customers, products, lowStock, cancelled] = await Promise.all([
    prisma.order.findMany({
      select: { status: true, total: true, createdAt: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.inventory.findMany({ select: { quantity: true, lowStockThreshold: true } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
  ]);

  const nonCancelled = orders.filter((o) => o.status !== "CANCELLED");

  return {
    totalRevenue: nonCancelled.reduce((sum, o) => sum + o.total, 0),
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === "PENDING").length,
    deliveredOrders: orders.filter((o) => o.status === "DELIVERED").length,
    cancelledOrders: cancelled,
    totalCustomers: customers,
    totalProducts: products,
    lowStockCount: lowStock.filter((i) => i.quantity <= i.lowStockThreshold).length,
  };
}

function bucketByDay(orders: { createdAt: Date; total: number }[], days: number) {
  const buckets = new Map<string, { revenue: number; orders: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { revenue: 0, orders: 0 });
  }
  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (b) {
      b.revenue += order.total;
      b.orders += 1;
    }
  }
  return [...buckets.entries()].map(([date, v]) => ({
    date,
    revenue: roundMoney(v.revenue),
    orders: v.orders,
  }));
}

export async function revenueAndOrdersOverTime(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
    select: { createdAt: true, total: true },
  });
  return bucketByDay(orders, days);
}

export async function topProducts(limit = 5) {
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { not: "CANCELLED" } } },
    select: { productName: true, quantity: true, total: true },
  });

  const agg = new Map<string, { name: string; units: number; revenue: number }>();
  for (const item of items) {
    const cur = agg.get(item.productName) ?? { name: item.productName, units: 0, revenue: 0 };
    cur.units += item.quantity;
    cur.revenue += item.total;
    agg.set(item.productName, cur);
  }
  return [...agg.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function orderStatusDistribution() {
  const rows = await prisma.order.groupBy({
    by: ["status"],
    _count: { status: true },
  });
  return rows.map((r) => ({ status: r.status, count: r._count.status }));
}
