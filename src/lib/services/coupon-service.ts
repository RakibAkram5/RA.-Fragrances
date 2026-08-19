import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/route-helpers";
import { roundMoney } from "@/lib/utils";
import type { Coupon, CouponType } from "@/generated/prisma/client";

export interface CouponValidationContext {
  subtotal: number;
  userId?: string;
  items: { productId: string; categoryId: string | null; lineTotal: number }[];
}

export interface CouponValidationResult {
  coupon: Coupon;
  discount: number;
  eligibleSubtotal: number;
}

type CouponDb = Pick<typeof prisma, "coupon" | "couponUsage">;

/**
 * Validate a coupon entirely server-side and compute the discount. The client
 * only ever supplies the coupon code — never a discount amount.
 */
export async function validateCoupon(
  code: string,
  ctx: CouponValidationContext,
  db: CouponDb = prisma,
): Promise<CouponValidationResult> {
  const normalized = code.trim().toUpperCase();
  const coupon = await db.coupon.findUnique({
    where: { code: normalized },
    include: { products: true, categories: true },
  });
  if (!coupon) throw new ApiError(400, "This coupon code is not valid.");

  if (!coupon.active) throw new ApiError(400, "This coupon is no longer active.");
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(400, "This coupon has expired.");
  }
  if (coupon.minOrder && ctx.subtotal < coupon.minOrder) {
    throw new ApiError(
      400,
      `This coupon requires a minimum order of PKR ${coupon.minOrder.toLocaleString()}.`,
    );
  }

  if (coupon.usageLimit) {
    const used = await db.couponUsage.count({ where: { couponId: coupon.id } });
    if (used >= coupon.usageLimit) {
      throw new ApiError(400, "This coupon has reached its usage limit.");
    }
  }

  if (ctx.userId && coupon.perUserLimit) {
    const usedByUser = await db.couponUsage.count({
      where: { couponId: coupon.id, userId: ctx.userId },
    });
    if (usedByUser >= coupon.perUserLimit) {
      throw new ApiError(400, "You have already used this coupon.");
    }
  }

  // Product / category restrictions: the discount only applies to matching items.
  const productIds = new Set(coupon.products.map((p) => p.productId));
  const categoryIds = new Set(coupon.categories.map((c) => c.categoryId));
  const hasRestrictions = productIds.size > 0 || categoryIds.size > 0;

  let eligibleSubtotal = ctx.subtotal;
  if (hasRestrictions) {
    eligibleSubtotal = ctx.items
      .filter(
        (i) =>
          productIds.has(i.productId) ||
          (i.categoryId !== null && categoryIds.has(i.categoryId)),
      )
      .reduce((sum, i) => sum + i.lineTotal, 0);
  }

  if (eligibleSubtotal <= 0) {
    throw new ApiError(400, "This coupon does not apply to the items in your cart.");
  }

  let discount =
    coupon.type === ("PERCENTAGE" as CouponType)
      ? roundMoney((eligibleSubtotal * coupon.value) / 100)
      : coupon.value;

  if (coupon.maxDiscount && discount > coupon.maxDiscount) {
    discount = coupon.maxDiscount;
  }
  discount = Math.min(discount, eligibleSubtotal);

  return { coupon, discount, eligibleSubtotal };
}

export async function recordCouponUsage(
  couponId: string,
  userId: string,
  orderId?: string,
) {
  await prisma.couponUsage.create({
    data: { couponId, userId, orderId },
  });
}

// ── Admin CRUD ────────────────────────────────────────────────

export async function listCoupons() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { usages: true, orders: true } },
      products: { select: { productId: true } },
      categories: { select: { categoryId: true } },
    },
  });
}

export async function getCoupon(id: string) {
  return prisma.coupon.findUnique({
    where: { id },
    include: {
      products: { select: { productId: true } },
      categories: { select: { categoryId: true } },
    },
  });
}

export async function assertUniqueCouponCode(code: string, excludeId?: string) {
  const clash = await prisma.coupon.findFirst({
    where: { code: code.trim().toUpperCase(), id: { not: excludeId } },
  });
  if (clash) throw new ApiError(409, "A coupon with this code already exists.");
}

export interface CouponInput {
  code: string;
  type: CouponType;
  value: number;
  minOrder?: number | null;
  maxDiscount?: number | null;
  expiresAt?: string | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  active: boolean;
  categoryIds?: string[];
  productIds?: string[];
}

export async function createCoupon(input: CouponInput) {
  const code = input.code.trim().toUpperCase();
  await assertUniqueCouponCode(code);
  return prisma.coupon.create({
    data: {
      code,
      type: input.type,
      value: input.value,
      minOrder: input.minOrder ?? null,
      maxDiscount: input.maxDiscount ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      usageLimit: input.usageLimit ?? null,
      perUserLimit: input.perUserLimit ?? null,
      active: input.active,
      ...(input.categoryIds?.length
        ? { categories: { create: input.categoryIds.map((categoryId) => ({ categoryId })) } }
        : {}),
      ...(input.productIds?.length
        ? { products: { create: input.productIds.map((productId) => ({ productId })) } }
        : {}),
    },
  });
}

export async function updateCoupon(id: string, input: Partial<CouponInput>) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Coupon not found.");

  if (input.code !== undefined) {
    const code = input.code.trim().toUpperCase();
    await assertUniqueCouponCode(code, id);
  }

  await prisma.$transaction(async (tx) => {
    await tx.coupon.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code.trim().toUpperCase() } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.value !== undefined ? { value: input.value } : {}),
        ...(input.minOrder !== undefined ? { minOrder: input.minOrder ?? null } : {}),
        ...(input.maxDiscount !== undefined ? { maxDiscount: input.maxDiscount ?? null } : {}),
        ...(input.expiresAt !== undefined
          ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }
          : {}),
        ...(input.usageLimit !== undefined ? { usageLimit: input.usageLimit ?? null } : {}),
        ...(input.perUserLimit !== undefined
          ? { perUserLimit: input.perUserLimit ?? null }
          : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });

    if (input.categoryIds !== undefined) {
      await tx.couponCategory.deleteMany({ where: { couponId: id } });
      if (input.categoryIds.length) {
        await tx.couponCategory.createMany({
          data: input.categoryIds.map((categoryId) => ({ couponId: id, categoryId })),
        });
      }
    }
    if (input.productIds !== undefined) {
      await tx.couponProduct.deleteMany({ where: { couponId: id } });
      if (input.productIds.length) {
        await tx.couponProduct.createMany({
          data: input.productIds.map((productId) => ({ couponId: id, productId })),
        });
      }
    }
  });

  return getCoupon(id);
}

/** Deactivate (soft delete) rather than hard-delete, preserving history. */
export async function deactivateCoupon(id: string) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Coupon not found.");
  await prisma.coupon.update({ where: { id }, data: { active: false } });
}

export async function deleteCoupon(id: string) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Coupon not found.");
  await prisma.coupon.delete({ where: { id } });
}
