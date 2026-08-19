import type { NextRequest } from "next/server";

import { jsonError, jsonOk, mapRouteError, requireAdmin } from "@/lib/route-helpers";
import { getOrderAdmin } from "@/lib/services/order-service";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const order = await getOrderAdmin(id);
    if (!order) return jsonError("Order not found.", 404);
    return jsonOk({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        shipping: order.shipping,
        total: order.total,
        currency: order.currency,
        customer: {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
        },
        address: {
          name: order.shippingName,
          phone: order.shippingPhone,
          email: order.shippingEmail,
          line1: order.shippingLine1,
          line2: order.shippingLine2,
          city: order.shippingCity,
          province: order.shippingProvince,
          postal: order.shippingPostal,
        },
        notes: order.notes,
        internalNotes: order.internalNotes,
        trackingNumber: order.trackingNumber,
        items: order.items,
        createdAt: order.createdAt,
        cancelledAt: order.cancelledAt,
        deliveredAt: order.deliveredAt,
      },
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
