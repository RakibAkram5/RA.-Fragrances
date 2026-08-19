import type { NextRequest } from "next/server";

import { jsonError, jsonOk, mapRouteError } from "@/lib/route-helpers";
import { getProductBySlug } from "@/lib/services/product-service";
import { listApprovedReviews } from "@/lib/services/review-service";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const product = await getProductBySlug(slug);
    if (!product) return jsonError("Product not found.", 404);

    const reviews = await listApprovedReviews(product.id);
    return jsonOk({
      product,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        createdAt: r.createdAt,
        authorName: r.user.name.split(" ")[0] ?? "Customer",
        verified: true,
      })),
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
