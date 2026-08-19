"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { BadgeCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api-client";
import { formatPKR } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

interface OrderDto {
  orderNumber: string;
  status: keyof typeof ORDER_STATUS_LABELS;
  paymentMethod: string;
  subtotal: number;
  discountTotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingAddress: {
    name: string;
    phone: string;
    email: string;
    line1: string;
    line2: string | null;
    city: string;
    province: string;
    postal: string | null;
  };
  notes: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: { productId: string | null; productName: string; price: number; quantity: number; total: number }[];
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

export default function OrderDetailPage() {
  return (
    <React.Suspense fallback={null}>
      <OrderDetailInner />
    </React.Suspense>
  );
}

function OrderDetailInner() {
  const params = useParams<{ number: string }>();
  const searchParams = useSearchParams();
  const placed = searchParams.get("placed") === "1";
  const [order, setOrder] = React.useState<OrderDto | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    api<{ order: OrderDto }>(`/api/orders/${params.number}`)
      .then((d) => setOrder(d.order))
      .catch((e) => setError(e instanceof Error ? e.message : "Order not found."));
  }, [params.number]);

  if (error) {
    return (
      <div className="border border-border bg-surface p-10 text-center">
        <p className="font-display text-2xl text-ink">{error}</p>
        <Link href="/account/orders" className="mt-3 inline-block text-accent hover:underline">
          View all orders
        </Link>
      </div>
    );
  }

  if (!order) return <p className="text-ink-secondary">Loading…</p>;

  return (
    <div className="space-y-6">
      {placed && (
        <div className="flex items-center gap-3 border border-success/40 bg-success/10 p-4">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <div>
            <p className="font-display text-xl text-ink">Order Confirmed</p>
            <p className="text-sm text-ink-secondary">
              Thank you. We have received your order and will contact you to confirm delivery.
            </p>
          </div>
        </div>
      )}

      <div className="border border-border bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest2 text-ink-muted">Order</p>
            <p className="font-display text-2xl text-ink">{order.orderNumber}</p>
            <p className="mt-1 text-xs text-ink-muted">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <Badge variant={STATUS_VARIANT[order.status] ?? "default"}>
            {ORDER_STATUS_LABELS[order.status] ?? order.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="border border-border bg-surface p-6">
          <h2 className="font-display text-xl text-ink">Items</h2>
          <ul className="mt-4 divide-y divide-border">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between py-3 text-sm">
                <span className="text-ink-secondary">
                  {item.productName} × {item.quantity}
                </span>
                <span className="text-ink">{formatPKR(item.total)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-surface p-6">
            <h2 className="font-display text-xl text-ink">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-ink-secondary">
                <dt>Subtotal</dt>
                <dd>{formatPKR(order.subtotal)}</dd>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-success">
                  <dt>Discount</dt>
                  <dd>−{formatPKR(order.discountTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between text-ink-secondary">
                <dt>Shipping</dt>
                <dd>{order.shipping === 0 ? "Free" : formatPKR(order.shipping)}</dd>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-ink">
                <dt className="font-medium">Total</dt>
                <dd className="font-display text-xl">{formatPKR(order.total)}</dd>
              </div>
              <div className="flex items-center gap-2 pt-2 text-ink-secondary">
                <BadgeCheck className="h-4 w-4 text-accent" />
                <dt>Payment: Cash on Delivery</dt>
              </div>
            </dl>
          </div>

          <div className="border border-border bg-surface p-6">
            <h2 className="font-display text-xl text-ink">Delivery Address</h2>
            <p className="mt-3 text-sm text-ink">{order.shippingAddress.name}</p>
            <p className="text-sm text-ink-secondary">{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && (
              <p className="text-sm text-ink-secondary">{order.shippingAddress.line2}</p>
            )}
            <p className="text-sm text-ink-secondary">
              {order.shippingAddress.city}, {order.shippingAddress.province}
            </p>
            <p className="text-sm text-ink-secondary">{order.shippingAddress.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
