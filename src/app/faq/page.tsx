import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "FAQ",
  description: "Frequently asked questions about RA fragrances, delivery and ordering.",
  path: "/faq",
});

const FAQS = [
  {
    q: "How much does shipping cost?",
    a: "Standard shipping is a flat rate, and shipping is free once your order reaches the free-shipping threshold shown at checkout. Final shipping is always calculated at checkout.",
  },
  {
    q: "Do you offer Cash on Delivery?",
    a: "Yes. Cash on Delivery (COD) is currently our primary payment method across Pakistan.",
  },
  {
    q: "How long does delivery take?",
    a: "Typical delivery is 3–5 working days within major cities and 5–7 working days elsewhere, subject to courier availability.",
  },
  {
    q: "Can I return a fragrance?",
    a: "Unopened products in their original packaging may be eligible for return within a limited window. Please see our Returns & Refunds policy for full details.",
  },
  {
    q: "Are your fragrances authentic?",
    a: "RA is our own brand. Every product is composed and packaged by us, and product information on the site reflects the actual formulation.",
  },
  {
    q: "How do I track my order?",
    a: "Sign in to your account and open the Orders section to see your order status. You can also contact us directly for updates.",
  },
];

export default function FaqPage() {
  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-8xl px-4 py-16 sm:px-6">
          <p className="eyebrow">Support</p>
          <h1 className="mt-4 font-display text-5xl text-ink">Frequently Asked Questions</h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="divide-y divide-border border-y border-border">
          {FAQS.map((f) => (
            <div key={f.q} className="py-6">
              <h2 className="font-display text-xl text-ink">{f.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
