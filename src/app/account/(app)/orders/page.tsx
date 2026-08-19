"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { formatPKR } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

interface Order {
  orderNumber: string;
  status: keyof typeof ORDER_STATUS_LABELS;
  total: number;
  itemCount?: number;
  createdAt: string;
  items: { quantity: number; productName: string }[];
}

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  PENDING: "warning",
  CONFIRMED: "accent",
  PROCESSING: "accent",
  SHIPPED: "default",
  DELIVERED: "success",
  CANCELLED: "danger",
  RETURNED: "warning",
};

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[] | null>(null);

  React.useEffect(() => {
    api<{ orders: Order[] }>("/api/orders").then((d) => setOrders(d.orders));
  }, []);

  if (!orders) return <p className="text-ink-secondary">Loading…</p>;

  if (orders.length === 0) {
    return (
      <div className="border border-border bg-surface p-10 text-center">
        <p className="font-display text-2xl text-ink">No orders yet</p>
        <Link href="/shop" className="mt-3 inline-block text-accent hover:underline">
          Shop fragrances
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <Link
          key={o.orderNumber}
          href={`/account/orders/${o.orderNumber}`}
          className="flex items-center justify-between border border-border bg-surface p-5 transition-colors hover:border-border-strong"
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="font-display text-lg text-ink">{o.orderNumber}</span>
              <Badge variant={STATUS_VARIANT[o.status] ?? "default"}>
                {ORDER_STATUS_LABELS[o.status] ?? o.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-ink-secondary">
              {o.items.reduce((s, i) => s + i.quantity, 0)} item(s) · {formatDate(o.createdAt)}
            </p>
          </div>
          <span className="text-ink">{formatPKR(o.total)}</span>
        </Link>
      ))}
    </div>
  );
}
