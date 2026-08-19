"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";
import { formatPKR } from "@/lib/money";

export function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen, update, remove } = useCart();

  return (
    <Sheet open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Added to your collection">
      {!cart || cart.items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="text-sm text-ink-secondary">Your collection is empty.</p>
          <Button variant="outline" onClick={() => setDrawerOpen(false)}>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <ul className="flex-1 divide-y divide-border px-6">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex gap-4 py-4">
                <Link
                  href={`/shop/${item.slug}`}
                  onClick={() => setDrawerOpen(false)}
                  className="h-20 w-20 shrink-0 overflow-hidden border border-border bg-surface-2"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/shop/${item.slug}`}
                      onClick={() => setDrawerOpen(false)}
                      className="font-display text-base leading-tight text-ink hover:text-accent"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => remove(item.productId)}
                      aria-label={`Remove ${item.name}`}
                      className="text-ink-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">{formatPKR(item.price)}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="inline-flex items-center border border-border">
                      <button
                        onClick={() => update(item.productId, item.quantity - 1)}
                        aria-label="Decrease"
                        className="flex h-7 w-7 items-center justify-center text-ink-secondary hover:text-ink"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs tabular-nums text-ink">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => update(item.productId, item.quantity + 1)}
                        aria-label="Increase"
                        disabled={item.quantity >= item.stock}
                        className="flex h-7 w-7 items-center justify-center text-ink-secondary hover:text-ink disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-sm text-ink">{formatPKR(item.lineTotal)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-border px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-ink-secondary">Subtotal</span>
              <span className="font-display text-xl text-ink">{formatPKR(cart.subtotal)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                View Cart
              </Button>
              <Button
                variant="accent"
                onClick={() => {
                  setDrawerOpen(false);
                  window.location.href = "/checkout";
                }}
              >
                Checkout
              </Button>
            </div>
            <p className="mt-3 text-center text-[11px] uppercase tracking-wider text-ink-muted">
              Cash on Delivery · Secure Checkout
            </p>
          </div>
        </div>
      )}
    </Sheet>
  );
}
