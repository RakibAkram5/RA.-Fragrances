"use client";

import * as React from "react";
import Link from "next/link";
import { LineChart, BarList } from "@/components/admin/charts";
import { api } from "@/lib/api-client";
import { formatPKR } from "@/lib/money";

interface Analytics {
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalCustomers: number;
    totalProducts: number;
    lowStockCount: number;
  };
  overTime: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
  statusDistribution: { status: string; count: number }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<Analytics | null>(null);

  React.useEffect(() => {
    api<Analytics>("/api/admin/analytics").then(setData);
  }, []);

  if (!data) return <p className="text-ink-secondary">Loading…</p>;

  const m = data.metrics;
  const cards = [
    { label: "Total Revenue", value: formatPKR(m.totalRevenue), href: "/admin/orders" },
    { label: "Total Orders", value: String(m.totalOrders), href: "/admin/orders" },
    { label: "Pending Orders", value: String(m.pendingOrders), href: "/admin/orders?status=PENDING" },
    { label: "Delivered Orders", value: String(m.deliveredOrders), href: "/admin/orders?status=DELIVERED" },
    { label: "Cancelled Orders", value: String(m.cancelledOrders), href: "/admin/orders?status=CANCELLED" },
    { label: "Customers", value: String(m.totalCustomers), href: "/admin/customers" },
    { label: "Products", value: String(m.totalProducts), href: "/admin/products" },
    { label: "Low Stock", value: String(m.lowStockCount), href: "/admin/inventory?lowStock=1" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-secondary">Store overview at a glance.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="border border-border bg-surface p-5 transition-colors hover:border-border-strong">
            <p className="text-xs uppercase tracking-widest2 text-ink-muted">{c.label}</p>
            <p className="mt-2 font-display text-2xl text-ink">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-border bg-surface p-6">
          <h2 className="font-display text-xl text-ink">Revenue (30 days)</h2>
          <div className="mt-4">
            <LineChart
              data={data.overTime.map((d) => ({ label: d.date, value: d.revenue }))}
            />
          </div>
        </div>
        <div className="border border-border bg-surface p-6">
          <h2 className="font-display text-xl text-ink">Orders (30 days)</h2>
          <div className="mt-4">
            <LineChart
              data={data.overTime.map((d) => ({ label: d.date, value: d.orders }))}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-border bg-surface p-6">
          <h2 className="font-display text-xl text-ink">Top Products</h2>
          <div className="mt-4">
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-ink-muted">No sales yet.</p>
            ) : (
              <BarList
                data={data.topProducts.map((p) => ({
                  label: p.name,
                  value: p.revenue,
                  sub: `${p.units} units sold`,
                }))}
              />
            )}
          </div>
        </div>
        <div className="border border-border bg-surface p-6">
          <h2 className="font-display text-xl text-ink">Order Status</h2>
          <div className="mt-4">
            <BarList
              data={data.statusDistribution.map((s) => ({
                label: s.status.charAt(0) + s.status.slice(1).toLowerCase(),
                value: s.count,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
