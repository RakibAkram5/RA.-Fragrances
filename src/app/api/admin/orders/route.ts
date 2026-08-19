import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, requireAdmin } from "@/lib/route-helpers";
import { listOrdersAdmin } from "@/lib/services/order-service";
import type { OrderStatus } from "@/generated/prisma/client";

const STATUSES = new Set([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const sp = req.nextUrl.searchParams;
    const statusParam = sp.get("status");
    const result = await listOrdersAdmin({
      q: sp.get("q") ?? undefined,
      status: statusParam && STATUSES.has(statusParam) ? (statusParam as OrderStatus) : undefined,
      page: Number(sp.get("page") ?? "1") || 1,
      pageSize: Number(sp.get("pageSize") ?? "20") || 20,
    });
    return jsonOk({
      ...result,
      items: result.items.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        total: o.total,
        currency: o.currency,
        customer: { name: o.shippingName, email: o.shippingEmail, phone: o.shippingPhone },
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        createdAt: o.createdAt,
      })),
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
