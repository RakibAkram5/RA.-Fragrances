import { afterEach, describe, expect, it } from "vitest";
import {
  archiveProduct,
  createProduct,
  deleteProduct,
  listProducts,
  restoreProduct,
} from "@/lib/services/product-service";
import { prisma } from "@/lib/db";
import { resetTestData, seedProduct, seedUsers } from "./helpers";

const base = {
  name: "Test Scent",
  slug: "test-scent",
  description: "A test fragrance.",
  price: 1890,
  sku: "TS-1",
  topNotes: ["Lemon"],
  heartNotes: ["Lavender"],
  baseNotes: ["Musk"],
  size: "50ml",
  ingredients: ["Alcohol"],
  occasions: ["Everyday"],
  status: "ACTIVE" as const,
  featured: false,
  initialStock: 5,
};

afterEach(async () => {
  await resetTestData();
});

describe("product CRUD", () => {
  it("creates a product with inventory and a transaction", async () => {
    const id = await createProduct({ ...base, slug: `s-${Date.now()}`, sku: `sku-${Date.now()}` });
    const product = await prisma.product.findUnique({ where: { id }, include: { inventory: true } });
    expect(product).not.toBeNull();
    expect(product!.inventory?.quantity).toBe(5);
    const txs = await prisma.inventoryTransaction.count({ where: { productId: id } });
    expect(txs).toBe(1);
  });

  it("rejects duplicate slugs", async () => {
    await seedProduct({ slug: "dupe", sku: "D-1" });
    await expect(createProduct({ ...base, slug: "dupe", sku: "D-2" })).rejects.toThrowError(/slug/);
  });

  it("archives and restores", async () => {
    const p = await seedProduct();
    await archiveProduct(p.id);
    let row = await prisma.product.findUnique({ where: { id: p.id } });
    expect(row!.status).toBe("ARCHIVED");

    await restoreProduct(p.id);
    row = await prisma.product.findUnique({ where: { id: p.id } });
    expect(row!.status).toBe("ACTIVE");
  });

  it("refuses permanent deletion when order items exist", async () => {
    const { customer } = await seedUsers();
    const p = await seedProduct();
    const order = await prisma.order.create({
      data: {
        orderNumber: `RA-TEST-${Date.now()}`,
        userId: customer.id,
        status: "PENDING",
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        subtotal: p.price,
        shipping: 0,
        total: p.price,
        shippingName: "X",
        shippingPhone: "03000000000",
        shippingEmail: "x@x.com",
        shippingLine1: "addr",
        shippingCity: "Lahore",
        shippingProvince: "Punjab",
        items: {
          create: [{ productId: p.id, productName: p.name, sku: p.sku, price: p.price, quantity: 1, total: p.price }],
        },
      },
    });
    expect(order.id).toBeTruthy();
    await expect(deleteProduct(p.id)).rejects.toThrowError(/cannot be permanently deleted/);
  });

  it("searches products", async () => {
    await seedProduct({ name: "Unique Scent Name", slug: `u-${Date.now()}` });
    const result = await listProducts({ q: "Unique", statuses: ["ACTIVE"], page: 1, pageSize: 10 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0]!.name).toBe("Unique Scent Name");
  });
});
