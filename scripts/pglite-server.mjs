import fs from "node:fs";
import path from "node:path";
import { loadEnv } from "./env.mjs";

loadEnv();

// Load PGlite lazily so this script never runs inside the Next.js process.
const { PGlite } = await import("@electric-sql/pglite");
const { PGLiteSocketServer } = await import("@electric-sql/pglite-socket");

const port = Number(process.env.DB_PORT || 5432);
const dataDir = path.resolve(process.cwd(), process.env.DB_DATA_DIR || ".data/pglite");

fs.mkdirSync(dataDir, { recursive: true });

const db = new PGlite(dataDir);
await db.waitReady;

const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1" });
await server.start();

console.log(`[db] PostgreSQL (PGlite) listening on 127.0.0.1:${port}`);
console.log(`[db] data directory: ${dataDir}`);

async function shutdown() {
  try {
    await server.stop();
  } catch {}
  try {
    await db.close();
  } catch {}
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
