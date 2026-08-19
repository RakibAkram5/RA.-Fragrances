import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    hookTimeout: 60_000,
    testTimeout: 60_000,
    pool: "forks",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
      "next/headers": path.resolve(__dirname, "tests/mocks/next-headers.ts"),
      "next/server": path.resolve(__dirname, "tests/mocks/next-server.ts"),
    },
  },
});
