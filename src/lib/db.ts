import "server-only";

import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma client singleton.
 *
 * The local development database is PGlite (a real PostgreSQL 16 engine
 * compiled to WASM) exposed over the wire protocol. PGlite is single-writer,
 * so we pin the connection pool to `max: 1` to serialise queries and avoid
 * concurrent-connection failures. When deploying against a managed PostgreSQL
 * instance you can raise the pool size safely.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString =
    process.env.DATABASE_URL ??
    "postgresql://ra:ra_local_dev_secret@127.0.0.1:5432/ra";
  const pool = new pg.Pool({ connectionString, max: 1 });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
