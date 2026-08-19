import fs from "node:fs/promises";
import type { NextRequest } from "next/server";

import { mapRouteError, jsonError } from "@/lib/route-helpers";
import { LocalStorageProvider } from "@/lib/storage/local-storage";

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await ctx.params;
    // Only filesystem storage is served through this route.
    const storage = new LocalStorageProvider(
      process.env.STORAGE_LOCAL_DIR || "storage/uploads",
    );
    const resolved = storage.resolve(name);
    if (!resolved) return jsonError("Not found.", 404);

    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (!IMAGE_EXT.has(ext)) return jsonError("Not found.", 404);

    const data = await fs.readFile(resolved.path);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": resolved.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
