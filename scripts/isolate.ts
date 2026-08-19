import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: "postgresql://ra:ra_local_dev_secret@127.0.0.1:5432/ra" });
const prisma = new PrismaClient({ adapter });
async function t(label: string, fn: () => Promise<unknown>) {
  try { await fn(); console.log("OK  ", label); }
  catch (e) { console.log("FAIL", label, "->", (e as Error).message?.slice(0,80)); }
}
async function main() {
  await t("a: findUnique no include", () => prisma.product.findUnique({ where: { slug: "ra-noir" } }));
  await t("b: include inventory", () => prisma.product.findUnique({ where: { slug: "ra-noir" }, include: { inventory: true } }));
  await t("c: include category", () => prisma.product.findUnique({ where: { slug: "ra-noir" }, include: { category: true } }));
  await t("d: include inventoryChanges", () => prisma.product.findUnique({ where: { slug: "ra-noir" }, include: { inventoryChanges: true } }));
  await t("e: include inv+cat", () => prisma.product.findUnique({ where: { slug: "ra-noir" }, include: { inventory: true, category: true } }));
  await t("f: include all", () => prisma.product.findUnique({ where: { slug: "ra-noir" }, include: { inventory: true, category: true, inventoryChanges: true } }));
  await t("g: findMany products", () => prisma.product.findMany({ include: { inventory: true } }));
  await t("h: user with sessions", () => prisma.user.findUnique({ where: { email: "t@t.com" }, include: { sessions: true } }));
}
main().then(()=>process.exit(0)).catch(e=>{console.error("top",e);process.exit(1)});
