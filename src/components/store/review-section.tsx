"use client";

import * as React from "react";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";
import { Rating } from "@/components/store/rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { api, ApiRequestError } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  authorName: string;
  verified: boolean;
}

interface OrderLike {
  orderNumber: string;
  status: string;
  id?: string;
}

export function ReviewSection({
  productId,
  reviews,
}: {
  productId: string;
  reviews: Review[];
}) {
  const { toast } = useToast();
  const [me, setMe] = React.useState<{ id: string } | null>(null);
  const [eligibleOrders, setEligibleOrders] = React.useState<OrderLike[]>([]);
  const [orderNumber, setOrderNumber] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const [session, ordersData] = await Promise.all([
          api<{ user: { id: string } | null }>("/api/auth/me"),
          api<{ orders: OrderLike[] }>("/api/orders"),
        ]);
        setMe(session.user);
        const eligible = ordersData.orders.filter((o) => o.status !== "CANCELLED");
        setEligibleOrders(eligible);
        if (eligible[0]) setOrderNumber(eligible[0].orderNumber);
      } catch {
        // not signed in
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api("/api/reviews", {
        method: "POST",
        body: { productId, orderNumber, rating, title, body },
      });
      toast({ title: "Review submitted", description: "It will appear once approved.", variant: "success" });
      setTitle("");
      setBody("");
    } catch (err) {
      toast({
        title: "Could not submit review",
        description: err instanceof ApiRequestError ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Existing reviews */}
      <div>
        <h3 className="font-display text-2xl text-ink">Customer Reviews</h3>
        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-ink-secondary">
            No reviews yet. Be the first to share your experience.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-border">
            {reviews.map((r) => (
              <li key={r.id} className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{r.authorName}</span>
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-accent">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-ink-muted">{formatDate(r.createdAt)}</span>
                </div>
                <div className="mt-2">
                  <Rating value={r.rating} />
                </div>
                {r.title && <p className="mt-2 font-medium text-ink">{r.title}</p>}
                {r.body && <p className="mt-1 text-sm leading-relaxed text-ink-secondary">{r.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Review form */}
      {loaded && (
        <div className="border border-border bg-surface p-6">
          {!me ? (
            <div className="text-sm text-ink-secondary">
              <Link href="/account/login" className="text-accent hover:underline">
                Sign in
              </Link>{" "}
              to write a review. Only customers who purchased this product can review it.
            </div>
          ) : eligibleOrders.length === 0 ? (
            <p className="text-sm text-ink-secondary">
              Only verified purchasers can review this product. Your review option appears after
              you receive an order containing it.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-widest2 text-ink-muted">Rating</label>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      className={`text-2xl ${n <= rating ? "text-accent" : "text-ink-muted/40"}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="review-title">
                  Title (optional)
                </label>
                <Input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="review-body">
                  Your review
                </label>
                <Textarea
                  id="review-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  minLength={5}
                  className="mt-2"
                />
              </div>
              <Button type="submit" variant="accent" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Review"}
              </Button>
              <p className="text-[11px] text-ink-muted">
                Reviews are verified against your order history and moderated before publishing.
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
