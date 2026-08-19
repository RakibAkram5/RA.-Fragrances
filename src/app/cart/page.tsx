"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/store/cart-provider";
import { formatPKR } from "@/lib/money";

export default function CartPage() {
  const { cart, update, remove, clear } = useCart();

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-32 text-center">
        <p className="eyebrow">Your Cart</p>
        <h1 className="mt-4 font-display text-4xl text-ink">Your collection is empty</h1>
        <p className="mt-4 text-ink-secondary">Discover your signature scent.</p>
        <Link
          href="/shop"
          className="mt-8 inline-flex h-12 items-center bg-accent px-8 text-sm uppercase tracking-wider text-background transition-colors hover:bg-accent-strong"
        >
          Shop Fragrances
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="eyebrow">Your Cart</p>
          <h1 className="mt-3 font-display text-4xl text-ink">Your Collection</h1>
        </div>
        <button
          onClick={clear}
          className="text-xs uppercase tracking-wider text-ink-muted hover:text-danger"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-border border-y border-border">
          {cart.items.map((item) => (
            <li key={item.productId} className="flex gap-4 py-5">
              <Link
                href={`/shop/${item.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden border border-border bg-surface-2"
              >
                {item.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                )}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/shop/${item.slug}`}
                      className="font-display text-xl text-ink hover:text-accent"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs uppercase tracking-wider text-ink-muted">
                      {item.size} · {formatPKR(item.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(item.productId)}
                    aria-label={`Remove ${item.name}`}
                    className="text-ink-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center border border-border">
                    <button
                      onClick={() => update(item.productId, item.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="flex h-9 w-9 items-center justify-center text-ink-secondary hover:text-ink"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-sm tabular-nums text-ink">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => update(item.productId, item.quantity + 1)}
                      aria-label="Increase quantity"
                      disabled={item.quantity >= item.stock}
                      className="flex h-9 w-9 items-center justify-center text-ink-secondary hover:text-ink disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="font-medium text-ink">{formatPKR(item.lineTotal)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-border bg-surface p-6">
          <h2 className="font-display text-2xl text-ink">Summary</h2>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between text-ink-secondary">
              <span>Items</span>
              <span>{cart.itemCount}</span>
            </div>
            <div className="flex justify-between text-ink-secondary">
              <span>Subtotal</span>
              <span>{formatPKR(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-ink">
              <span className="font-medium">Total</span>
              <span className="font-display text-xl">{formatPKR(cart.subtotal)}</span>
            </div>
            <p className="pt-1 text-xs text-ink-muted">
              Shipping and any discounts are calculated at checkout.
            </p>
          </div>
          <Link
            href="/checkout"
            className="mt-6 flex h-12 w-full items-center justify-center bg-accent text-sm uppercase tracking-wider text-background transition-colors hover:bg-accent-strong"
          >
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
