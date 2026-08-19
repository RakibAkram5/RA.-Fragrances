import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The native schema engine is normally downloaded from binaries.prisma.sh.
// In offline environments we point it at a local placeholder so `prisma
// generate` can run (generation uses the WASM schema parser). In normal
// environments this is harmless and can be removed.
const placeholder = path.resolve(__dirname, "../prisma/.schema-engine-placeholder");

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["prisma", "generate"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      PRISMA_SCHEMA_ENGINE_BINARY: process.env.PRISMA_SCHEMA_ENGINE_BINARY || placeholder,
    },
  },
);

process.exit(result.status ?? 1);
