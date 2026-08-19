import "server-only";

import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/route-helpers";
import type { ReviewStatus } from "@/generated/prisma/client";

/**
 * Only a customer who actually purchased the product (verified against their
 * own order history) may submit a review. The `orderId` is recorded so the
 * "Verified Purchase" badge is always backed by a real order.
 */
export async function createReview(input: {
  userId: string;
  productId: string;
  orderNumber: string;
  rating: number;
  title?: string;
  body: string;
}) {
  const order = await prisma.order.findFirst({
    where: { orderNumber: input.orderNumber, userId: input.userId },
    include: { items: { where: { productId: input.productId } } },
  });
  if (!order) throw new ApiError(404, "Order not found.");
  if (order.status === "CANCELLED") {
    throw new ApiError(400, "You cannot review a cancelled order.");
  }
  if (order.items.length === 0) {
    throw new ApiError(400, "This order does not contain that product.");
  }

  const existing = await prisma.review.findUnique({
    where: {
      userId_productId_orderId: {
        userId: input.userId,
        productId: input.productId,
        orderId: order.id,
      },
    },
  });
  if (existing) throw new ApiError(409, "You have already reviewed this product for this order.");

  return prisma.review.create({
    data: {
      productId: input.productId,
      userId: input.userId,
      orderId: order.id,
      rating: input.rating,
      title: input.title || null,
      body: input.body,
      status: "PENDING",
    },
  });
}

export async function listApprovedReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
}

export async function listOwnReviews(userId: string) {
  return prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true, images: { where: { isPrimary: true }, take: 1 } } } },
  });
}

export async function updateOwnReview(
  userId: string,
  reviewId: string,
  input: { rating: number; title?: string; body: string },
) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, userId } });
  if (!review) throw new ApiError(404, "Review not found.");
  if (review.status === "REJECTED") {
    throw new ApiError(400, "This review can no longer be edited.");
  }
  return prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: input.rating,
      title: input.title || null,
      body: input.body,
      status: "PENDING", // re-moderate after edit
    },
  });
}

export async function deleteOwnReview(userId: string, reviewId: string) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, userId } });
  if (!review) throw new ApiError(404, "Review not found.");
  await prisma.review.delete({ where: { id: reviewId } });
  await recomputeProductRating(review.productId);
}

// ── Admin ─────────────────────────────────────────────────────

export async function listReviewsAdmin(params: {
  status?: ReviewStatus;
  page: number;
  pageSize: number;
}) {
  const page = Math.max(1, params.page);
  const pageSize = Math.min(Math.max(1, params.pageSize), 100);
  const where = params.status ? { status: params.status } : {};

  const [total, items] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        product: { select: { name: true, slug: true } },
        user: { select: { name: true, email: true } },
      },
    }),
  ]);
  return { items, total, page, pageSize };
}

export async function moderateReview(reviewId: string, status: ReviewStatus) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new ApiError(404, "Review not found.");
  await prisma.review.update({ where: { id: reviewId }, data: { status } });
  await recomputeProductRating(review.productId);
}

export async function recomputeProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: "APPROVED" },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      ratingCount: agg._count.rating,
    },
  });
}
