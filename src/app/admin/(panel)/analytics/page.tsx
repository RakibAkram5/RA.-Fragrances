"use client";

import * as React from "react";
import { LineChart, BarList } from "@/components/admin/charts";
import { api } from "@/lib/api-client";
import { formatPKR } from "@/lib/money";

interface Analytics {
  metrics: { totalRevenue: number; totalOrders: number; totalCustomers: number; totalProducts: number };
  overTime: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
  statusDistribution: { status: string; count: number }[];
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = React.useState(30);
  const [data, setData] = React.useState<Analytics | null>(null);

  React.useEffect(() => {
    api<Analytics>(`/api/admin/analytics?days=${days}`).then(setData);
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Analytics</h1>
          <p className="mt-1 text-sm text-ink-secondary">Revenue, orders and product performance.</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-11 border border-border bg-surface px-3 text-sm text-ink">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {!data ? (
        <p className="text-ink-secondary">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Metric label="Total Revenue" value={formatPKR(data.metrics.totalRevenue)} />
            <Metric label="Total Orders" value={String(data.metrics.totalOrders)} />
            <Metric label="Customers" value={String(data.metrics.totalCustomers)} />
            <Metric label="Products" value={String(data.metrics.totalProducts)} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border border-border bg-surface p-6">
              <h2 className="font-display text-xl text-ink">Revenue over time</h2>
              <div className="mt-4">
                <LineChart data={data.overTime.map((d) => ({ label: d.date, value: d.revenue }))} height={200} />
              </div>
            </div>
            <div className="border border-border bg-surface p-6">
              <h2 className="font-display text-xl text-ink">Orders over time</h2>
              <div className="mt-4">
                <LineChart data={data.overTime.map((d) => ({ label: d.date, value: d.orders }))} height={200} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border border-border bg-surface p-6">
              <h2 className="font-display text-xl text-ink">Top Products</h2>
              <div className="mt-4">
                <BarList data={data.topProducts.map((p) => ({ label: p.name, value: p.revenue, sub: `${p.units} units` }))} />
              </div>
            </div>
            <div className="border border-border bg-surface p-6">
              <h2 className="font-display text-xl text-ink">Order Status Distribution</h2>
              <div className="mt-4">
                <BarList data={data.statusDistribution.map((s) => ({ label: s.status.toLowerCase(), value: s.count }))} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-widest2 text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
