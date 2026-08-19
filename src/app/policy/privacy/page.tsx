import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/legal";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How RA handles your personal information.",
  path: "/policy/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 2026">
      <Section title="What we collect">
        <p>
          We collect the information you provide when you create an account, place an order, or
          contact us — including your name, email, phone number and delivery address. We also keep
          an order history so you can track deliveries.
        </p>
      </Section>
      <Section title="How we use it">
        <p>
          We use your information to process and deliver orders, provide support, and — where you
          have agreed — send order updates. We never sell your personal data.
        </p>
      </Section>
      <Section title="Security">
        <p>
          Passwords are stored using a one-way hash and are never kept in plain text. Access to
          your account is protected by secure, signed sessions, and all traffic is served over
          HTTPS.
        </p>
      </Section>
      <Section title="Your choices">
        <p>
          You can update your account information at any time, request deletion of your account, or
          contact us at care@ra-fragrances.pk for any privacy question.
        </p>
      </Section>
    </LegalPage>
  );
}
