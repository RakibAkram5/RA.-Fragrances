import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/legal";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Shipping Policy",
  description: "How RA ships orders across Pakistan.",
  path: "/policy/shipping",
});

export default function ShippingPage() {
  return (
    <LegalPage title="Shipping Policy" updated="August 2026">
      <Section title="Coverage">
        <p>We deliver across Pakistan using third-party courier services.</p>
      </Section>
      <Section title="Cost">
        <p>
          A flat shipping fee applies to orders below the free-shipping threshold. The exact
          shipping cost for your city or province is calculated and shown at checkout before you
          confirm.
        </p>
      </Section>
      <Section title="Timing">
        <p>
          Delivery typically takes 3–5 working days in major cities and 5–7 working days elsewhere,
          depending on the courier and your location.
        </p>
      </Section>
      <Section title="Payment">
        <p>Orders are currently payable by Cash on Delivery at the time of delivery.</p>
      </Section>
    </LegalPage>
  );
}
