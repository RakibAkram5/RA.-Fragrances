import { prisma } from "@/lib/db";

export { prisma as db };

/** Wipe all data between tests (keep schema). */
export async function resetTestData() {
  await prisma.$transaction([
    prisma.contactMessage.deleteMany(),
    prisma.review.deleteMany(),
    prisma.couponUsage.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.inventoryTransaction.deleteMany(),
    prisma.order.deleteMany(),
    prisma.cartItem.deleteMany(),
    prisma.cart.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.product.deleteMany(),
    prisma.couponProduct.deleteMany(),
    prisma.couponCategory.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.category.deleteMany(),
    prisma.address.deleteMany(),
    prisma.session.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.emailVerificationToken.deleteMany(),
    prisma.adminAuditLog.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/** Create a fresh customer + admin for tests. */
export async function seedUsers() {
  const { hashPassword } = await import("@/lib/auth");
  const passwordHash = await hashPassword("Password123");
  const stamp = Date.now();
  const customer = await prisma.user.create({
    data: {
      name: "Test Customer",
      email: `customer-${stamp}@test.com`,
      passwordHash,
      role: "CUSTOMER",
      emailVerifiedAt: new Date(),
    },
  });
  const admin = await prisma.user.create({
    data: {
      name: "Test Admin",
      email: `admin-${stamp}@test.com`,
      passwordHash,
      role: "ADMIN",
      emailVerifiedAt: new Date(),
    },
  });
  return { customer, admin, password: "Password123" };
}

export async function seedProduct(overrides: Record<string, unknown> = {}) {
  const stamp = Date.now().toString(36);
  const product = await prisma.product.create({
    data: {
      name: "Test Scent",
      slug: `test-scent-${stamp}`,
      description: "A test fragrance for automated tests.",
      price: 1890,
      sku: `TS-${stamp}`,
      size: "50ml",
      topNotes: ["Lemon"],
      heartNotes: ["Lavender"],
      baseNotes: ["Musk"],
      ingredients: ["Alcohol", "Parfum"],
      occasions: ["Everyday"],
      status: "ACTIVE",
      ...overrides,
    },
  });
  await prisma.inventory.create({
    data: { productId: product.id, quantity: 10, lowStockThreshold: 3 },
  });
  return product;
}
