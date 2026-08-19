"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api-client";
import { formatPKR } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  customer: { name: string; email: string; phone: string };
  itemCount: number;
  createdAt: string;
}

const VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  PENDING: "warning",
  CONFIRMED: "accent",
  PROCESSING: "accent",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "warning",
};

export default function AdminOrdersPage() {
  const [data, setData] = React.useState<{ items: OrderRow[]; total: number; pageCount: number } | null>(null);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);

  const load = React.useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    api<{ items: OrderRow[]; total: number; pageCount: number }>(`/api/admin/orders?${params}`).then(setData);
  }, [q, status, page]);

  React.useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Orders</h1>
        <p className="mt-1 text-sm text-ink-secondary">{data?.total ?? 0} orders</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); load(); }} className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order # / name / phone" className="w-64" />
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-11 border border-border bg-surface px-3 text-sm text-ink"
        >
          <option value="">All statuses</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium text-ink hover:text-accent">
                    {o.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="text-ink-secondary">{o.customer.name}</div>
                  <div className="text-xs text-ink-muted">{o.customer.phone}</div>
                </TableCell>
                <TableCell>{o.itemCount}</TableCell>
                <TableCell>{formatPKR(o.total)}</TableCell>
                <TableCell><Badge variant={VARIANT[o.status] ?? "default"}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</Badge></TableCell>
                <TableCell>{formatDate(o.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.pageCount > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: data.pageCount }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)} className={n === page ? "h-9 w-9 bg-accent text-sm text-background" : "h-9 w-9 border border-border text-sm text-ink-secondary"}>
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
