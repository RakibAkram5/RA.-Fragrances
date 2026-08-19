import type { Metadata } from "next";

const APP_URL = () =>
  process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

export function absoluteUrl(path: string): string {
  return `${APP_URL().replace(/\/$/, "")}${path}`;
}

export function buildMetadata(opts: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const title = opts.title ?? "RA — Own Your Presence";
  const description =
    opts.description ??
    "RA is a Pakistani premium fragrance brand. Affordable luxury, carefully composed Eau de Parfum. Own Your Presence.";
  const url = absoluteUrl(opts.path ?? "/");
  const image = opts.image ?? absoluteUrl("/brand/hero.jpg");

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "RA Fragrances",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: opts.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RA Fragrances",
    description: "Pakistani premium fragrance brand — affordable luxury Eau de Parfum.",
    url: APP_URL(),
    logo: absoluteUrl("/brand/logo.png"),
    sameAs: ["https://instagram.com/ra.fragrances"],
    areaServed: "PK",
  };
}

export function productJsonLd(product: {
  name: string;
  description: string;
  price: number;
  slug: string;
  size: string;
  image?: string | null;
  ratingAvg: number;
  ratingCount: number;
  sku: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.image ? absoluteUrl(product.image) : undefined,
    aggregateRating:
      product.ratingCount > 0
        ? { "@type": "AggregateRating", ratingValue: product.ratingAvg, reviewCount: product.ratingCount }
        : undefined,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/shop/${product.slug}`),
      priceCurrency: "PKR",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
