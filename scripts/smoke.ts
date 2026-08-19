import { PrismaClient, Role, ProductStatus, OrderStatus, InventoryTransactionType } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || "postgresql://ra:ra_local_dev_secret@127.0.0.1:5432/ra" });
const prisma = new PrismaClient({ adapter });
async function main() {
  const u = await prisma.user.create({ data: { name: "Test", email: "t@t.com", passwordHash: "x", role: Role.ADMIN } });
  console.log("1 user ok", u.role);
  const cat = await prisma.category.create({ data: { name: "Eau de Parfum", slug: "eau-de-parfum" } });
  const p = await prisma.product.create({ data: {
    name: "RA NOIR", slug: "ra-noir", description: "desc", price: 1890, sku: "RA-NOIR-50",
    categoryId: cat.id, topNotes: ["Bergamot"], heartNotes: ["Cedar"], baseNotes: ["Amber"],
    size: "50ml", ingredients: ["Alcohol","Parfum"], occasions: ["Evening"], family: "Woody",
    status: ProductStatus.ACTIVE, featured: true,
  }});
  console.log("2 product ok", JSON.stringify(p.topNotes));
  await prisma.inventory.create({ data: { productId: p.id, quantity: 10, lowStockThreshold: 3 } });
  const [cnt] = await prisma.$transaction(async (tx) => {
    const upd = await tx.inventory.updateMany({ where: { productId: p.id, quantity: { gte: 5 } }, data: { quantity: { decrement: 5 } } });
    await tx.inventoryTransaction.create({ data: { productId: p.id, type: InventoryTransactionType.SALE, quantityDelta: -5, previousQuantity: 10, newQuantity: 5, performedByUserId: u.id } });
    return [upd.count];
  });
  console.log("3 txn decrement count", cnt);
  const full = await prisma.product.findUnique({ where: { slug: "ra-noir" }, include: { inventory: true, category: true, inventoryChanges: true } });
  console.log("4 full", full?.name, full?.inventory?.quantity, full?.category?.name, full?.inventoryChanges?.length);
  console.log("SMOKE OK");
}
main().then(()=>process.exit(0)).catch(e=>{console.error("FAIL:", e.message || e);process.exit(1)});
