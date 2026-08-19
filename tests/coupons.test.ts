import { afterEach, describe, expect, it } from "vitest";
import { validateCoupon, createCoupon } from "@/lib/services/coupon-service";
import { prisma } from "@/lib/db";
import { resetTestData, seedUsers } from "./helpers";

async function ctxWithUser() {
  const { customer } = await seedUsers();
  return {
    subtotal: 5000,
    userId: customer.id,
    items: [{ productId: "p1", categoryId: null, lineTotal: 5000 }],
  };
}

const ctx = {
  subtotal: 5000,
  userId: "u1",
  items: [{ productId: "p1", categoryId: null, lineTotal: 5000 }],
};

async function makeCoupon(overrides: Record<string, unknown> = {}) {
  return createCoupon({
    code: `C${Date.now()}${Math.floor(Math.random() * 1000)}`,
    type: "PERCENTAGE",
    value: 10,
    active: true,
    ...overrides,
  });
}

afterEach(async () => {
  await resetTestData();
});

describe("coupon validation", () => {
  it("applies a percentage discount", async () => {
    await makeCoupon({ code: "TENPCT", value: 10 });
    const r = await validateCoupon("TENPCT", ctx);
    expect(r.discount).toBe(500);
  });

  it("rejects an invalid code", async () => {
    await expect(validateCoupon("NOPE", ctx)).rejects.toThrowError(/not valid/);
  });

  it("rejects an expired coupon", async () => {
    await makeCoupon({ code: "EXPIRED", expiresAt: "2020-01-01T00:00:00.000Z" });
    await expect(validateCoupon("EXPIRED", ctx)).rejects.toThrowError(/expired/);
  });

  it("rejects when the minimum order is not met", async () => {
    await makeCoupon({ code: "MINORDER", minOrder: 10000 });
    await expect(validateCoupon("MINORDER", ctx)).rejects.toThrowError(/minimum order/);
  });

  it("applies a fixed discount", async () => {
    await makeCoupon({ code: "FIXED", type: "FIXED", value: 750 });
    const r = await validateCoupon("FIXED", ctx);
    expect(r.discount).toBe(750);
  });

  it("clamps to max discount", async () => {
    await makeCoupon({ code: "CAPPED", value: 50, maxDiscount: 300 });
    const r = await validateCoupon("CAPPED", ctx);
    expect(r.discount).toBe(300);
  });

  it("enforces the usage limit", async () => {
    const c = await makeCoupon({ code: "LIMITED", usageLimit: 1 });
    const { customer } = await seedUsers();
    await prisma.couponUsage.create({ data: { couponId: c.id, userId: customer.id } });
    const c2 = await ctxWithUser();
    await expect(validateCoupon("LIMITED", c2)).rejects.toThrowError(/usage limit/);
  });

  it("enforces the per-user limit", async () => {
    const c = await makeCoupon({ code: "PERUSER", perUserLimit: 1 });
    const c3 = await ctxWithUser();
    await prisma.couponUsage.create({ data: { couponId: c.id, userId: c3.userId } });
    await expect(validateCoupon("PERUSER", c3)).rejects.toThrowError(/already used/);
  });

  it("never discounts below zero", async () => {
    await makeCoupon({ code: "HUGE", type: "FIXED", value: 999999 });
    const r = await validateCoupon("HUGE", ctx);
    expect(r.discount).toBeLessThanOrEqual(ctx.subtotal);
  });
});
