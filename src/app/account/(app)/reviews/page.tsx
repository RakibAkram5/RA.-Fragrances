"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/store/rating";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

interface Review {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  createdAt: string;
}

const STATUS: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" }> = {
  PENDING: { label: "Pending approval", variant: "warning" },
  APPROVED: { label: "Published", variant: "success" },
  REJECTED: { label: "Rejected", variant: "danger" },
  HIDDEN: { label: "Hidden", variant: "default" },
};

export default function ReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[] | null>(null);

  React.useEffect(() => {
    api<{ reviews: Review[] }>("/api/reviews").then((d) => setReviews(d.reviews));
  }, []);

  async function remove(id: string) {
    await api(`/api/reviews/${id}`, { method: "DELETE" });
    setReviews((prev) => prev?.filter((r) => r.id !== id) ?? null);
  }

  if (!reviews) return <p className="text-ink-secondary">Loading…</p>;

  if (reviews.length === 0) {
    return <p className="border border-border bg-surface p-8 text-sm text-ink-secondary">You have not written any reviews yet.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="flex gap-4 border border-border bg-surface p-5">
          {r.productImage && (
            <Link href={`/shop/${r.productSlug}`} className="h-16 w-16 shrink-0 overflow-hidden bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.productImage} alt={r.productName} className="h-full w-full object-cover" />
            </Link>
          )}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/shop/${r.productSlug}`} className="font-medium text-ink hover:text-accent">
                {r.productName}
              </Link>
              <Badge variant={STATUS[r.status]?.variant ?? "default"}>
                {STATUS[r.status]?.label ?? r.status}
              </Badge>
            </div>
            <div className="mt-2"><Rating value={r.rating} /></div>
            {r.title && <p className="mt-2 text-sm font-medium text-ink">{r.title}</p>}
            {r.body && <p className="mt-1 text-sm text-ink-secondary">{r.body}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-ink-muted">{formatDate(r.createdAt)}</span>
              <button onClick={() => remove(r.id)} className="text-xs uppercase tracking-wider text-ink-muted hover:text-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
