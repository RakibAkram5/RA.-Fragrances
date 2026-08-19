import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/legal";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Returns & Refunds",
  description: "RA returns and refunds policy.",
  path: "/policy/returns",
});

export default function ReturnsPage() {
  return (
    <LegalPage title="Returns & Refunds" updated="August 2026">
      <Section title="Eligibility">
        <p>
          Unopened products in their original, undamaged packaging may be eligible for return
          within 7 days of delivery. For hygiene reasons we cannot accept opened fragrances unless
          the product is faulty.
        </p>
      </Section>
      <Section title="Damaged or incorrect items">
        <p>
          If your order arrives damaged or contains the wrong item, contact us within 48 hours of
          delivery with your order number and photos, and we will arrange a replacement or refund.
        </p>
      </Section>
      <Section title="How to start a return">
        <p>
          Contact us via WhatsApp or email with your order number. We will confirm eligibility and
          share the next steps.
        </p>
      </Section>
    </LegalPage>
  );
}
