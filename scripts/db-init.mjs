import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "./env.mjs";

loadEnv();

const { default: pg } = await import("pg");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const url =
  process.env.DATABASE_URL || "postgresql://ra:ra_local_dev_secret@127.0.0.1:5432/ra";

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const schemaCheck = await client.query(
    'SELECT to_regclass(\'public."Product"\') AS tbl',
  );
  if (schemaCheck.rows[0]?.tbl) {
    console.log("[db] schema already applied — nothing to do");
  } else {
    const sqlPath = path.resolve(
      __dirname,
      "../prisma/migrations/0001_init/migration.sql",
    );
    const sql = fs.readFileSync(sqlPath, "utf8");
    await client.query(sql);
    console.log("[db] schema applied from prisma/migrations/0001_init/migration.sql");
  }
} finally {
  await client.end();
}
