import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireUser } from "@/lib/route-helpers";
import { assertSafeRequest } from "@/lib/security/request-meta";
import { z } from "zod";
import { deleteOwnReview, updateOwnReview } from "@/lib/services/review-service";

const updateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().min(5).max(2000),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const user = await requireUser();
    const { id } = await ctx.params;
    const body = await parseJson(req, updateSchema);
    await updateOwnReview(user.id, id, body);
    return jsonOk({ message: "Review updated and sent for approval." });
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    assertSafeRequest(req);
    const user = await requireUser();
    const { id } = await ctx.params;
    await deleteOwnReview(user.id, id);
    return jsonOk({ message: "Review deleted." });
  } catch (err) {
    return mapRouteError(err);
  }
}
