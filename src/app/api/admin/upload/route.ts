import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, requireAdmin } from "@/lib/route-helpers";
import { assertSafeRequest } from "@/lib/security/request-meta";
import { validateImageBuffer } from "@/lib/storage/file-validation";
import { getStorage } from "@/lib/storage/storage";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    await requireAdmin();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonOk({ error: "No file provided." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { filename, contentType } = validateImageBuffer(buffer, file.name);

    const storage = getStorage();
    const url = await storage.save(filename, buffer, contentType);

    return jsonOk({ url });
  } catch (err) {
    return mapRouteError(err);
  }
}
