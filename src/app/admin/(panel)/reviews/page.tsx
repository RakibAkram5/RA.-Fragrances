"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/store/rating";
import { api } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  createdAt: string;
  product: { name: string; slug: string };
  user: { name: string; email: string };
}

const VARIANT: Record<string, "default" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  HIDDEN: "default",
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = React.useState<Review[] | null>(null);
  const [status, setStatus] = React.useState("");

  const load = React.useCallback(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "100" });
    if (status) params.set("status", status);
    api<{ items: Review[] }>(`/api/admin/reviews?${params}`).then((d) => setReviews(d.items));
  }, [status]);

  React.useEffect(load, [load]);

  async function moderate(id: string, next: string) {
    await api(`/api/admin/reviews/${id}`, { method: "PATCH", body: { status: next } });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink">Reviews</h1>
          <p className="mt-1 text-sm text-ink-secondary">Moderate customer reviews.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 border border-border bg-surface px-3 text-sm text-ink">
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="HIDDEN">Hidden</option>
        </select>
      </div>

      <div className="space-y-4">
        {reviews?.map((r) => (
          <div key={r.id} className="border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-ink">{r.user.name}</span>
                <span className="ml-2 text-xs text-ink-muted">on {r.product.name}</span>
              </div>
              <Badge variant={VARIANT[r.status] ?? "default"}>{r.status}</Badge>
            </div>
            <div className="mt-2"><Rating value={r.rating} /></div>
            {r.title && <p className="mt-2 text-sm font-medium text-ink">{r.title}</p>}
            {r.body && <p className="mt-1 text-sm text-ink-secondary">{r.body}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-ink-muted">{formatDate(r.createdAt)}</span>
              <div className="flex gap-3 text-xs">
                <button onClick={() => moderate(r.id, "APPROVED")} className="text-success hover:underline">Approve</button>
                <button onClick={() => moderate(r.id, "REJECTED")} className="text-danger hover:underline">Reject</button>
                <button onClick={() => moderate(r.id, "HIDDEN")} className="text-ink-muted hover:underline">Hide</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
