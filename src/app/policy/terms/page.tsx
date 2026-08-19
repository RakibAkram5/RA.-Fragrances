import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/legal";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Terms & Conditions",
  description: "Terms of use for the RA fragrance store.",
  path: "/policy/terms",
});

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="August 2026">
      <Section title="Use of the store">
        <p>
          By using this website you agree to provide accurate information when ordering and to use
          the store only for lawful purchases. Product pricing is shown in Pakistani Rupees (PKR).
        </p>
      </Section>
      <Section title="Orders">
        <p>
          Placing an order constitutes an offer to purchase. Orders are confirmed by us and may be
          subject to stock availability; we will contact you if an item cannot be fulfilled.
        </p>
      </Section>
      <Section title="Pricing">
        <p>
          Prices are as displayed at the time of ordering. Final totals (including any discount and
          shipping) are calculated by us at checkout and shown before you confirm your order.
        </p>
      </Section>
      <Section title="Intellectual property">
        <p>
          The RA name, logo and brand content are the property of RA and may not be reproduced
          without permission.
        </p>
      </Section>
    </LegalPage>
  );
}
