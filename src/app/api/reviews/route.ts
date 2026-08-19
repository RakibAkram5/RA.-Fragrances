import type { NextRequest } from "next/server";

import { jsonOk, mapRouteError, parseJson, requireUser } from "@/lib/route-helpers";
import { assertSafeRequest, clientIp } from "@/lib/security/request-meta";
import { rateLimit } from "@/lib/security/rate-limit";
import { reviewCreateSchema } from "@/lib/validation/schemas";
import { createReview, listApprovedReviews, listOwnReviews } from "@/lib/services/review-service";

export async function POST(req: NextRequest) {
  try {
    assertSafeRequest(req);
    const rl = rateLimit(`review:${clientIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return jsonOk({ error: "Too many reviews. Please try again later." }, { status: 429 });

    const user = await requireUser();
    const body = await parseJson(req, reviewCreateSchema);
    await createReview({
      userId: user.id,
      productId: body.productId,
      orderNumber: body.orderNumber,
      rating: body.rating,
      title: body.title,
      body: body.body,
    });
    return jsonOk({ message: "Thank you — your review is pending approval." });
  } catch (err) {
    return mapRouteError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const productId = req.nextUrl.searchParams.get("productId");
    if (productId) {
      const reviews = await listApprovedReviews(productId);
      return jsonOk({
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
    }
    const user = await requireUser();
    const reviews = await listOwnReviews(user.id);
    return jsonOk({
      reviews: reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        productName: r.product.name,
        productSlug: r.product.slug,
        productImage: r.product.images[0]?.url ?? null,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: r.status,
        createdAt: r.createdAt,
        orderId: r.orderId,
      })),
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
