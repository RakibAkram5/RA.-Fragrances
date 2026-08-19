import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/route-helpers";
import { roundMoney } from "@/lib/utils";
import { generateOrderNumber } from "@/lib/security/tokens";
import { getSettings } from "@/lib/settings";
import { computeShipping } from "@/lib/services/shipping-service";
import { validateCoupon } from "@/lib/services/coupon-service";
import { tryDecrementStock } from "@/lib/services/inventory-service";
import type { Prisma } from "@/generated/prisma/client";

export interface CheckoutAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  province: string;
  postalCode?: string | null;
}

export interface CheckoutInput {
  userId: string;
  userEmail: string;
  items: { productId: string; quantity: number }[];
  couponCode?: string | null;
  address: CheckoutAddress;
  notes?: string | null;
}

async function loadProductsForCheckout(
  items: { productId: string; quantity: number }[],
) {
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: { inventory: true, category: true },
  });
  const map = new Map(products.map((p) => [p.id, p]));
  return map;
}

export async function createOrder(input: CheckoutInput) {
  const settings = await getSettings();
  if (settings.storeStatus === "maintenance") {
    throw new ApiError(503, "The store is temporarily unavailable.");
  }

  // 1) Load authoritative product data (never trust client-sent prices).
  const productMap = await loadProductsForCheckout(input.items);

  const lines = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new ApiError(400, "A product in your cart no longer exists.");
    if (product.status !== "ACTIVE") {
      throw new ApiError(400, `"${product.name}" is not available right now.`);
    }
    const stock = product.inventory?.quantity ?? 0;
    if (stock < item.quantity) {
      throw new ApiError(
        409,
        stock <= 0
          ? `"${product.name}" is out of stock.`
          : `Only ${stock} of "${product.name}" left in stock.`,
      );
    }
    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      quantity: item.quantity,
      lineTotal: product.price * item.quantity,
      categoryId: product.categoryId,
      stock,
    };
  });

  const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.lineTotal, 0));

  // 2) Coupon — validated server-side from the code only.
  let discount = 0;
  let couponId: string | null = null;
  if (input.couponCode && input.couponCode.trim() !== "") {
    const result = await validateCoupon(input.couponCode, {
      subtotal,
      userId: input.userId,
      items: lines.map((l) => ({
        productId: l.productId,
        categoryId: l.categoryId,
        lineTotal: l.lineTotal,
      })),
    });
    discount = result.discount;
    couponId = result.coupon.id;
  }

  // 3) Shipping — computed from configured rules.
  const shipping = computeShipping(subtotal, input.address, settings.shipping);

  // 4) Authoritative write: create order, atomically decrement stock,
  //    record coupon usage. Any failure rolls back everything.
  const order = await prisma.$transaction(async (tx) => {
    // Re-verify coupon limits inside the transaction.
    let finalDiscount = discount;
    let finalCouponId = couponId;
    if (couponId && input.couponCode) {
      const recheck = await validateCoupon(
        input.couponCode,
        {
          subtotal,
          userId: input.userId,
          items: lines.map((l) => ({
            productId: l.productId,
            categoryId: l.categoryId,
            lineTotal: l.lineTotal,
          })),
        },
        tx,
      );
      finalDiscount = recheck.discount;
      finalCouponId = recheck.coupon.id;
    }

    const orderNumber = await uniqueOrderNumber(tx);

    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: input.userId,
        status: "PENDING",
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        subtotal,
        discountTotal: finalDiscount,
        shipping,
        total: Math.max(0, subtotal - finalDiscount) + shipping,
        currency: settings.currency,
        couponId: finalCouponId,
        shippingName: input.address.fullName,
        shippingPhone: input.address.phone,
        shippingEmail: input.userEmail,
        shippingLine1: input.address.line1,
        shippingLine2: input.address.line2 || null,
        shippingCity: input.address.city,
        shippingProvince: input.address.province,
        shippingPostal: input.address.postalCode || null,
        notes: input.notes || null,
      },
    });

    // Authoritative stock decrement — aborts if any item oversells.
    for (const line of lines) {
      const ok = await tryDecrementStock(
        tx,
        line.productId,
        line.quantity,
        created.id,
      );
      if (!ok) {
        throw new ApiError(409, `"${line.name}" sold out before your order could be placed.`);
      }
    }

    await tx.orderItem.createMany({
      data: lines.map((l) => ({
        orderId: created.id,
        productId: l.productId,
        productName: l.name,
        sku: l.sku,
        price: l.price,
        quantity: l.quantity,
        total: l.lineTotal,
      })),
    });

    if (finalCouponId) {
      await tx.couponUsage.create({
        data: { couponId: finalCouponId, userId: input.userId, orderId: created.id },
      });
    }

    for (const line of lines) {
      await tx.product.update({
        where: { id: line.productId },
        data: { salesCount: { increment: line.quantity } },
      });
    }

    return created;
  });

  return order;
}

async function uniqueOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateOrderNumber();
    const existing = await tx.order.findUnique({ where: { orderNumber: candidate } });
    if (!existing) return candidate;
  }
  throw new ApiError(500, "Could not allocate an order number.");
}
