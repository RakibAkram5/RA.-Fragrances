import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Banknote,
  Gem,
  Leaf,
  MapPin,
  Sparkles,
  Truck,
} from "lucide-react";
import { listProducts } from "@/lib/services/product-service";
import { ProductCard } from "@/components/store/product-card";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Price } from "@/components/store/price";
import { Rating } from "@/components/store/rating";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await listProducts({
    statuses: ["ACTIVE"],
    featured: true,
    sort: "featured",
    page: 1,
    pageSize: 1,
  });
  const heroProduct = featured.items[0];

  const collection = await listProducts({
    statuses: ["ACTIVE"],
    sort: "newest",
    page: 1,
    pageSize: 4,
  });

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/hero.jpg"
          alt="RA matte black Eau de Parfum bottle with gold logo"
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-8xl items-center px-4 sm:px-6">
          <div className="max-w-xl animate-fade-up">
            <p className="eyebrow">Eau de Parfum · Pakistan</p>
            <h1 className="mt-5 font-display text-7xl leading-none tracking-[0.15em] text-ink sm:text-8xl">
              RA
            </h1>
            <p className="mt-4 font-display text-3xl text-ink-secondary sm:text-4xl">
              Own Your Presence.
            </p>
            <p className="mt-6 max-w-md text-ink-secondary">
              Affordable luxury fragrance, carefully composed. A scent is not just a scent —
              it becomes part of your presence.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex h-12 items-center bg-accent px-8 text-sm uppercase tracking-wider text-background transition-colors hover:bg-accent-strong"
              >
                Shop Fragrance
              </Link>
              <Link
                href="/quiz"
                className="inline-flex h-12 items-center border border-border bg-background/40 px-8 text-sm uppercase tracking-wider text-ink backdrop-blur transition-colors hover:bg-surface"
              >
                Find Your Scent
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured product ─────────────────────────────────── */}
      {heroProduct && (
        <section className="border-t border-border bg-surface">
          <div className="mx-auto grid max-w-8xl grid-cols-1 gap-0 md:grid-cols-2">
            <Link
              href={`/shop/${heroProduct.slug}`}
              className="relative block aspect-square overflow-hidden bg-surface-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroProduct.images[0]?.url ?? "/brand/product-placeholder.png"}
                alt={heroProduct.name}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </Link>
            <div className="flex flex-col justify-center px-6 py-14 sm:px-12 lg:px-20">
              <p className="eyebrow">Featured · {heroProduct.size} Eau de Parfum</p>
              <h2 className="mt-4 font-display text-5xl text-ink">{heroProduct.name}</h2>
              <div className="mt-3">
                <Price amount={heroProduct.price} compareAt={heroProduct.compareAtPrice} size="lg" />
              </div>
              <div className="mt-3">
                <Rating value={heroProduct.ratingAvg} count={heroProduct.ratingCount} size="md" />
              </div>
              <p className="mt-6 leading-relaxed text-ink-secondary">{heroProduct.description}</p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs uppercase tracking-widest2 text-ink-muted">Personality</h3>
                  <p className="mt-2 text-sm text-ink-secondary">{heroProduct.personality}</p>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-widest2 text-ink-muted">Notes</h3>
                  <p className="mt-2 text-sm text-ink-secondary">
                    <span className="text-accent">Top:</span> {heroProduct.topNotes.join(", ")}
                    <br />
                    <span className="text-accent">Heart:</span> {heroProduct.heartNotes.join(", ")}
                    <br />
                    <span className="text-accent">Base:</span> {heroProduct.baseNotes.join(", ")}
                  </p>
                </div>
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <AddToCartButton
                  productId={heroProduct.id}
                  variant="accent"
                  disabled={heroProduct.stockStatus === "out_of_stock"}
                  className="h-12 px-8"
                />
                <Link
                  href="/checkout"
                  className="inline-flex h-12 items-center border border-border px-8 text-sm uppercase tracking-wider text-ink transition-colors hover:bg-surface-2"
                >
                  Buy Now
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Brand story ──────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
          <p className="eyebrow">The RA Philosophy</p>
          <h2 className="mt-5 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Fragrance is more than a scent.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-secondary">
            It becomes part of your presence, your confidence, and the moments people remember.
            RA composes affordable luxury — considered fragrances with a premium identity, made for
            Pakistan.
          </p>
        </div>
      </section>

      {/* ── Why RA ───────────────────────────────────────────── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-8xl px-4 py-20 sm:px-6">
          <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sparkles,
                title: "Premium Fragrance",
                text: "Carefully selected fragrance compositions, blended to feel considered and complete.",
              },
              {
                icon: Gem,
                title: "Designed for Presence",
                text: "Scents created around personality and occasion — not trends.",
              },
              {
                icon: Award,
                title: "Premium Experience",
                text: "Elegant packaging and a considered experience, without unnecessary pricing.",
              },
              {
                icon: MapPin,
                title: "Made for Pakistan",
                text: "Designed with Pakistani customers, climate and occasions in mind.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-surface p-8">
                <f.icon className="h-6 w-6 text-accent" />
                <h3 className="mt-5 font-display text-xl text-ink">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collection ───────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-8xl px-4 py-20 sm:px-6">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow">The Collection</p>
              <h2 className="mt-3 font-display text-4xl text-ink">Signature Fragrances</h2>
            </div>
            <Link
              href="/shop"
              className="hidden text-sm uppercase tracking-wider text-accent hover:text-accent-strong sm:block"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {collection.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────── */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-8xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { icon: Banknote, title: "Cash on Delivery", text: "Pay when your fragrance arrives." },
              { icon: BadgeCheck, title: "Secure Checkout", text: "Verified orders, protected data." },
              { icon: Leaf, title: "Authentic Information", text: "Honest notes and ingredients." },
              { icon: Truck, title: "Delivery Information", text: "Clear shipping across Pakistan." },
            ].map((t) => (
              <div key={t.title} className="flex items-start gap-3">
                <t.icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-medium text-ink">{t.title}</p>
                  <p className="mt-1 text-xs text-ink-muted">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
