import { loadEnv } from "./env.mjs";

loadEnv();

const { default: pg } = await import("pg");

const url = process.env.DATABASE_URL || "postgresql://ra:ra_local_dev_secret@127.0.0.1:5432/ra";
const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  await client.query(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
      END LOOP;
      FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS "' || r.typname || '" CASCADE';
      END LOOP;
    END $$;
  `);
  console.log("[db] dropped public schema objects");
} finally {
  await client.end();
}
