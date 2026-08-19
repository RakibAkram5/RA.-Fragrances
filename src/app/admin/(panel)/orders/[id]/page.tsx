"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { api, ApiRequestError } from "@/lib/api-client";
import { formatPKR } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discountTotal: number;
  shipping: number;
  total: number;
  customer: { id: string; name: string; email: string; phone: string | null };
  address: { name: string; phone: string; line1: string; line2: string | null; city: string; province: string; postal: string | null };
  notes: string | null;
  internalNotes: string | null;
  trackingNumber: string | null;
  items: { productName: string; price: number; quantity: number; total: number }[];
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

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [status, setStatus] = React.useState("");
  const [note, setNote] = React.useState("");
  const [msg, setMsg] = React.useState("");

  const load = React.useCallback(() => {
    api<{ order: Order }>(`/api/admin/orders/${params.id}`).then((d) => {
      setOrder(d.order);
      setStatus(d.order.status);
    });
  }, [params.id]);

  React.useEffect(load, [load]);

  async function updateStatus() {
    setMsg("");
    try {
      await api(`/api/admin/orders/${params.id}/status`, { method: "PATCH", body: { status, note } });
      setMsg("Status updated.");
      setNote("");
      load();
    } catch (e) {
      setMsg(e instanceof ApiRequestError ? e.message : "Update failed.");
    }
  }

  if (!order) return <p className="text-ink-secondary">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-secondary">{formatDateTime(order.createdAt)}</p>
        </div>
        <Badge variant={VARIANT[order.status] ?? "default"}>{ORDER_STATUS_LABELS[order.status] ?? order.status}</Badge>
      </div>

      {msg && <Alert variant="success">{msg}</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="border border-border bg-surface p-6">
            <h2 className="font-display text-xl text-ink">Items</h2>
            <ul className="mt-4 divide-y divide-border">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex justify-between py-3 text-sm">
                  <span className="text-ink-secondary">{i.productName} × {i.quantity}</span>
                  <span className="text-ink">{formatPKR(i.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-ink-secondary"><dt>Subtotal</dt><dd>{formatPKR(order.subtotal)}</dd></div>
              {order.discountTotal > 0 && <div className="flex justify-between text-success"><dt>Discount</dt><dd>−{formatPKR(order.discountTotal)}</dd></div>}
              <div className="flex justify-between text-ink-secondary"><dt>Shipping</dt><dd>{formatPKR(order.shipping)}</dd></div>
              <div className="flex justify-between text-ink"><dt className="font-medium">Total</dt><dd className="font-display text-lg">{formatPKR(order.total)}</dd></div>
            </dl>
          </div>

          <div className="border border-border bg-surface p-6">
            <h2 className="font-display text-xl text-ink">Internal Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-ink-secondary">
              {order.internalNotes ?? "No notes yet."}
            </p>
            <div className="mt-4 flex gap-2">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" rows={2} />
              <Button variant="outline" onClick={updateStatus}>Save</Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-surface p-6">
            <h2 className="font-display text-xl text-ink">Update Status</h2>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-3 h-11 w-full border border-border bg-background px-3 text-sm text-ink">
              {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <Button variant="accent" className="mt-3 w-full" onClick={updateStatus}>Update Status</Button>
          </div>

          <div className="border border-border bg-surface p-6">
            <h2 className="font-display text-xl text-ink">Customer</h2>
            <p className="mt-3 text-sm text-ink">{order.customer.name}</p>
            <p className="text-sm text-ink-secondary">{order.customer.email}</p>
            <p className="text-sm text-ink-secondary">{order.customer.phone}</p>
          </div>

          <div className="border border-border bg-surface p-6">
            <h2 className="font-display text-xl text-ink">Delivery</h2>
            <p className="mt-3 text-sm text-ink">{order.address.name}</p>
            <p className="text-sm text-ink-secondary">{order.address.line1}</p>
            {order.address.line2 && <p className="text-sm text-ink-secondary">{order.address.line2}</p>}
            <p className="text-sm text-ink-secondary">{order.address.city}, {order.address.province}</p>
            <p className="text-sm text-ink-secondary">{order.address.phone}</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-ink-muted">Payment: {order.paymentMethod}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
