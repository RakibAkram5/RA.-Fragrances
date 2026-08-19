import type { Metadata, Viewport } from "next";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";

import { ToastProvider } from "@/components/ui/toast";
import { CartProvider } from "@/components/store/cart-provider";
import { SiteHeader } from "@/components/store/site-header";
import { SiteFooter } from "@/components/store/site-footer";
import { CartDrawer } from "@/components/store/cart-drawer";
import { organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "RA — Own Your Presence",
    template: "%s — RA Fragrances",
  },
  description:
    "RA is a Pakistani premium fragrance brand. Affordable luxury Eau de Parfum, carefully composed. Own Your Presence.",
  openGraph: {
    title: "RA — Own Your Presence",
    description:
      "Affordable luxury Eau de Parfum, carefully composed for Pakistan. Own Your Presence.",
    type: "website",
    siteName: "RA Fragrances",
  },
  twitter: {
    card: "summary_large_image",
    title: "RA — Own Your Presence",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0B",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <ToastProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
            <CartDrawer />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
