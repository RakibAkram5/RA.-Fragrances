import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/route-helpers";
import type { InventoryTransactionType } from "@/generated/prisma/client";

/**
 * Set a product's stock to an absolute quantity and record an inventory
 * transaction. Every stock change is audited — stock is never modified
 * silently.
 */
export async function setStock(
  productId: string,
  quantity: number,
  type: InventoryTransactionType,
  opts: {
    adminUserId?: string;
    reason?: string;
    note?: string;
    orderId?: string;
  } = {},
) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new ApiError(400, "Stock quantity must be a non-negative integer.");
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });
    if (!product) throw new ApiError(404, "Product not found.");

    const inventory = product.inventory
      ? product.inventory
      : await tx.inventory.create({
          data: { productId, quantity: 0, lowStockThreshold: 5 },
        });

    const previous = inventory.quantity;
    const delta = quantity - previous;

    await tx.inventory.update({
      where: { id: inventory.id },
      data: { quantity },
    });

    // Keep the product's public status in sync with stock, unless it is
    // deliberately archived or still a draft.
    if (product.status === "OUT_OF_STOCK" && quantity > 0) {
      await tx.product.update({ where: { id: productId }, data: { status: "ACTIVE" } });
    } else if (product.status === "ACTIVE" && quantity === 0) {
      await tx.product.update({ where: { id: productId }, data: { status: "OUT_OF_STOCK" } });
    }

    await tx.inventoryTransaction.create({
      data: {
        productId,
        type,
        quantityDelta: delta,
        previousQuantity: previous,
        newQuantity: quantity,
        reason: opts.reason,
        note: opts.note,
        orderId: opts.orderId,
        performedByUserId: opts.adminUserId,
      },
    });

    return { previous, delta, next: quantity };
  });
}

/**
 * Atomically decrement stock during checkout. Returns false when there is
 * not enough stock — the caller must abort the order. The `quantity >= qty`
 * predicate in the WHERE clause prevents overselling under concurrency.
 */
export async function tryDecrementStock(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  productId: string,
  qty: number,
  orderId: string,
): Promise<boolean> {
  const inventory = await tx.inventory.findUnique({ where: { productId } });
  if (!inventory || inventory.quantity < qty) return false;

  const res = await tx.inventory.updateMany({
    where: { productId, quantity: { gte: qty } },
    data: { quantity: { decrement: qty } },
  });
  if (res.count === 0) return false;

  const updated = await tx.inventory.findUnique({ where: { productId } });

  if ((updated?.quantity ?? 0) === 0) {
    await tx.product.updateMany({
      where: { id: productId, status: "ACTIVE" },
      data: { status: "OUT_OF_STOCK" },
    });
  }

  await tx.inventoryTransaction.create({
    data: {
      productId,
      type: "SALE",
      quantityDelta: -qty,
      previousQuantity: inventory.quantity,
      newQuantity: updated?.quantity ?? inventory.quantity - qty,
      orderId,
      reason: "Order",
    },
  });

  return true;
}

export async function listInventory(params: {
  q?: string;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(Math.max(1, params.pageSize), 100);

  const AND: Record<string, unknown>[] = [];
  if (params.q) {
    AND.push({
      product: {
        OR: [
          { name: { contains: params.q, mode: "insensitive" } },
          { sku: { contains: params.q, mode: "insensitive" } },
        ],
      },
    });
  }
  if (params.outOfStockOnly) {
    AND.push({ quantity: { lte: 0 } });
  }

  const where = AND.length ? { AND } : {};

  const rows = await prisma.inventory.findMany({
    where,
    orderBy: { product: { name: "asc" } },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          status: true,
          price: true,
        },
      },
    },
  });

  const filtered = params.lowStockOnly
    ? rows.filter((r) => r.quantity <= r.lowStockThreshold)
    : rows;

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function listInventoryTransactions(params: {
  productId?: string;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(Math.max(1, params.pageSize), 100);

  const where = params.productId ? { productId: params.productId } : {};
  const [total, items] = await Promise.all([
    prisma.inventoryTransaction.count({ where }),
    prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: { select: { id: true, name: true, slug: true, sku: true } },
      },
    }),
  ]);

  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function lowStockProducts() {
  const inventories = await prisma.inventory.findMany({
    include: { product: { select: { id: true, name: true, slug: true, sku: true, status: true } } },
  });
  return inventories.filter((i) => i.quantity <= i.lowStockThreshold);
}
