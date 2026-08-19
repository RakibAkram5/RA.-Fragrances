import { afterEach, describe, expect, it } from "vitest";
import { createOrder } from "@/lib/services/checkout-service";
import { getCustomerOrder, updateOrderStatus } from "@/lib/services/order-service";
import { ApiError } from "@/lib/route-helpers";
import { prisma } from "@/lib/db";
import { resetTestData, seedProduct, seedUsers } from "./helpers";

const ADDRESS = {
  fullName: "Buyer",
  phone: "03000000000",
  line1: "House 1, Street 2",
  city: "Lahore",
  province: "Punjab",
};

afterEach(async () => {
  await resetTestData();
});

describe("checkout", () => {
  it("computes the total server-side from database prices", async () => {
    const { customer } = await seedUsers();
    const p = await seedProduct({ price: 1890 });

    const order = await createOrder({
      userId: customer.id,
      userEmail: customer.email,
      items: [{ productId: p.id, quantity: 2 }],
      address: ADDRESS,
    });

    // subtotal 3780 >= free threshold 2500 → free shipping
    expect(order.subtotal).toBe(3780);
    expect(order.total).toBe(3780);
    expect(order.status).toBe("PENDING");
  });

  it("adds shipping below the free threshold", async () => {
    const { customer } = await seedUsers();
    const p = await seedProduct({ price: 1000 });
    const order = await createOrder({
      userId: customer.id,
      userEmail: customer.email,
      items: [{ productId: p.id, quantity: 1 }],
      address: ADDRESS,
    });
    expect(order.total).toBe(1000 + 199); // default flat rate
  });

  it("rejects orders that exceed stock (no overselling)", async () => {
    const { customer } = await seedUsers();
    const p = await seedProduct();
    await expect(
      createOrder({
        userId: customer.id,
        userEmail: customer.email,
        items: [{ productId: p.id, quantity: 999 }],
        address: ADDRESS,
      }),
    ).rejects.toThrowError(ApiError);

    const inv = await prisma.inventory.findUnique({ where: { productId: p.id } });
    expect(inv!.quantity).toBe(10); // unchanged
  });

  it("decrements stock atomically on success", async () => {
    const { customer } = await seedUsers();
    const p = await seedProduct();
    await createOrder({
      userId: customer.id,
      userEmail: customer.email,
      items: [{ productId: p.id, quantity: 3 }],
      address: ADDRESS,
    });
    const inv = await prisma.inventory.findUnique({ where: { productId: p.id } });
    expect(inv!.quantity).toBe(7);
  });
});

describe("order ownership", () => {
  it("prevents a customer from reading another customer's order", async () => {
    const { customer } = await seedUsers();
    const other = await prisma.user.create({
      data: { name: "Other", email: `other-${Date.now()}@x.com`, passwordHash: "x" },
    });
    const p = await seedProduct();
    const order = await createOrder({
      userId: customer.id,
      userEmail: customer.email,
      items: [{ productId: p.id, quantity: 1 }],
      address: ADDRESS,
    });

    await expect(getCustomerOrder(order.orderNumber, other.id)).rejects.toThrowError(/Order not found/);
    const own = await getCustomerOrder(order.orderNumber, customer.id);
    expect(own.id).toBe(order.id);
  });
});

describe("order status + restock", () => {
  it("restocks inventory when an order is cancelled", async () => {
    const { customer } = await seedUsers();
    const p = await seedProduct();
    const order = await createOrder({
      userId: customer.id,
      userEmail: customer.email,
      items: [{ productId: p.id, quantity: 2 }],
      address: ADDRESS,
    });
    let inv = await prisma.inventory.findUnique({ where: { productId: p.id } });
    expect(inv!.quantity).toBe(8);

    await updateOrderStatus(order.id, "CANCELLED");
    inv = await prisma.inventory.findUnique({ where: { productId: p.id } });
    expect(inv!.quantity).toBe(10);
  });
});
