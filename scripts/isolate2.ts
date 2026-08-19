import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
const pool = new pg.Pool({ connectionString: "postgresql://ra:ra_local_dev_secret@127.0.0.1:5432/ra", max: 1 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  const full = await prisma.product.findUnique({ where: { slug: "ra-noir" }, include: { inventory: true, category: true, inventoryChanges: true } });
  console.log("full:", full?.name, full?.inventory?.quantity, full?.category?.name, full?.inventoryChanges?.length);
  // nested include + multiple relations
  const p2 = await prisma.product.findMany({ include: { inventory: true, images: true, category: true, reviews: true } });
  console.log("findMany include:", p2.length);
  console.log("POOL1 OK");
}
main().then(()=>process.exit(0)).catch(e=>{console.error("FAIL", e.message);process.exit(1)});
