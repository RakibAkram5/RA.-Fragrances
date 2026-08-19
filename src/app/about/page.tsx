import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: "The RA philosophy — affordable luxury fragrance, composed for Pakistan.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6">
          <p className="eyebrow">About RA</p>
          <h1 className="mt-4 font-display text-5xl text-ink">The RA Philosophy</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="space-y-8 text-lg leading-relaxed text-ink-secondary">
          <p className="font-display text-2xl leading-snug text-ink">
            Fragrance is more than a scent. It becomes part of your presence, your confidence, and
            the moments people remember.
          </p>
          <p>
            RA is a Pakistani fragrance house built on a simple conviction: premium fragrance
            should not require a premium price. We compose considered, modern Eau de Parfum with a
            visual identity that feels expensive — because how you present should match how you
            are perceived.
          </p>
          <p>
            Every composition is designed around personality and occasion rather than trends. We
            work with carefully selected fragrance materials, keep our formulations honest, and
            package with the same restraint we bring to the scents themselves.
          </p>
          <p>
            Designed with Pakistani customers, climate and occasions in mind — from office
            mornings to the evenings that matter.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
          {[
            { k: "50ml", v: "Signature Eau de Parfum" },
            { k: "PKR 1,890", v: "Maximum selling price" },
            { k: "COD", v: "Cash on Delivery across Pakistan" },
          ].map((s) => (
            <div key={s.k} className="bg-surface p-8 text-center">
              <div className="font-display text-3xl text-accent">{s.k}</div>
              <div className="mt-2 text-sm text-ink-secondary">{s.v}</div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center bg-accent px-8 text-sm uppercase tracking-wider text-background transition-colors hover:bg-accent-strong"
          >
            Explore the Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
