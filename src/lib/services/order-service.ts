import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/route-helpers";
import type { OrderStatus } from "@/generated/prisma/client";

const ORDER_INCLUDE = {
  items: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
} as const;

export function toOrderDto(order: {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  discountTotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingName: string;
  shippingPhone: string;
  shippingEmail: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingProvince: string;
  shippingPostal: string | null;
  notes: string | null;
  trackingNumber: string | null;
  createdAt: Date;
  cancelledAt: Date | null;
  deliveredAt: Date | null;
  items: {
    productId: string | null;
    productName: string;
    sku: string | null;
    price: number;
    quantity: number;
    total: number;
  }[];
}) {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    subtotal: order.subtotal,
    discountTotal: order.discountTotal,
    shipping: order.shipping,
    total: order.total,
    currency: order.currency,
    shippingAddress: {
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
    trackingNumber: order.trackingNumber,
    createdAt: order.createdAt,
    cancelledAt: order.cancelledAt,
    deliveredAt: order.deliveredAt,
    items: order.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      sku: i.sku,
      price: i.price,
      quantity: i.quantity,
      total: i.total,
    })),
  };
}

/** Customer reads their own order by public order number. */
export async function getCustomerOrder(orderNumber: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId },
    include: { items: true },
  });
  if (!order) throw new ApiError(404, "Order not found.");
  return order;
}

export async function listCustomerOrders(userId: string, page = 1, pageSize = 10) {
  const [total, orders] = await Promise.all([
    prisma.order.count({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: true },
    }),
  ]);
  return { items: orders, total, page, pageSize };
}

// ── Admin ─────────────────────────────────────────────────────

export async function listOrdersAdmin(params: {
  q?: string;
  status?: OrderStatus;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(Math.max(1, params.pageSize), 100);

  const AND: Record<string, unknown>[] = [];
  if (params.status) AND.push({ status: params.status });
  if (params.q) {
    AND.push({
      OR: [
        { orderNumber: { contains: params.q, mode: "insensitive" } },
        { shippingName: { contains: params.q, mode: "insensitive" } },
        { shippingEmail: { contains: params.q, mode: "insensitive" } },
        { shippingPhone: { contains: params.q, mode: "insensitive" } },
      ],
    });
  }
  const where = AND.length ? { AND } : {};

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return { items: orders, total, page, pageSize };
}

export async function getOrderAdmin(idOrNumber: string) {
  const byNumber = await prisma.order.findUnique({
    where: { orderNumber: idOrNumber },
    include: ORDER_INCLUDE,
  });
  if (byNumber) return byNumber;
  return prisma.order.findUnique({ where: { id: idOrNumber }, include: ORDER_INCLUDE });
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  opts: { note?: string } = {},
) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new ApiError(404, "Order not found.");

  const data: Record<string, unknown> = { status };
  if (status === "CANCELLED") {
    data.cancelledAt = new Date();
  } else {
    data.cancelledAt = null;
  }
  if (status === "DELIVERED") {
    data.deliveredAt = new Date();
  } else {
    data.deliveredAt = null;
  }
  if (opts.note && opts.note.trim() !== "") {
    data.internalNotes = order.internalNotes
      ? `${order.internalNotes}\n${opts.note.trim()}`
      : opts.note.trim();
  }

  const updated = await prisma.order.update({ where: { id }, data: data as never });

  // Returning a cancelled order restocks it (single, audited transaction).
  if (status === "CANCELLED" && order.status !== "CANCELLED") {
    await restockOrder(order.id);
  }

  return updated;
}

export async function addOrderNote(id: string, note: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new ApiError(404, "Order not found.");
  return prisma.order.update({
    where: { id },
    data: {
      internalNotes: order.internalNotes ? `${order.internalNotes}\n${note}` : note,
    },
  });
}

async function restockOrder(orderId: string) {
  const items = await prisma.orderItem.findMany({ where: { orderId } });
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (!item.productId) continue;
      const inv = await tx.inventory.findUnique({ where: { productId: item.productId } });
      const previous = inv?.quantity ?? 0;
      const next = previous + item.quantity;
      if (inv) {
        await tx.inventory.update({ where: { id: inv.id }, data: { quantity: next } });
      } else {
        await tx.inventory.create({
          data: { productId: item.productId, quantity: item.quantity, lowStockThreshold: 5 },
        });
      }
      await tx.inventoryTransaction.create({
        data: {
          productId: item.productId,
          type: "RETURN",
          quantityDelta: item.quantity,
          previousQuantity: previous,
          newQuantity: next,
          orderId,
          reason: "Order cancelled",
        },
      });
      await tx.product.updateMany({
        where: { id: item.productId, status: "OUT_OF_STOCK" },
        data: { status: "ACTIVE" },
      });
    }
  });
}
