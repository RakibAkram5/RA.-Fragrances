import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Starts a dedicated in-memory PostgreSQL (PGlite) instance on port 5433 for
 * tests and applies the schema. Kept separate from the development database
 * so tests never touch real data.
 */
export default async function globalSetup() {
  const { PGlite } = await import("@electric-sql/pglite");
  const { PGLiteSocketServer } = await import("@electric-sql/pglite-socket");
  const { default: pg } = await import("pg");

  const db = new PGlite();
  await db.waitReady;
  const server = new PGLiteSocketServer({ db, port: 5433, host: "127.0.0.1" });
  await server.start();

  const client = new pg.Client({
    connectionString: "postgresql://ra:ra_local_dev_secret@127.0.0.1:5433/ra",
  });
  await client.connect();
  const sql = fs.readFileSync(
    path.resolve(__dirname, "../prisma/migrations/0001_init/migration.sql"),
    "utf8",
  );
  await client.query(sql);
  await client.end();

  return async () => {
    try {
      await server.stop();
    } catch {}
    try {
      await db.close();
    } catch {}
  };
}
