import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Rating } from "@/components/store/rating";
import { Price } from "@/components/store/price";
import { ProductGallery } from "@/components/store/product-gallery";
import { ProductActions } from "@/components/store/product-actions";
import { ReviewSection } from "@/components/store/review-section";
import { getProductBySlug } from "@/lib/services/product-service";
import { listApprovedReviews } from "@/lib/services/review-service";
import { breadcrumbJsonLd, buildMetadata, productJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const stockBadge = {
  in_stock: { text: "In Stock", variant: "success" as const },
  low_stock: { text: "Low Stock", variant: "warning" as const },
  out_of_stock: { text: "Out of Stock", variant: "danger" as const },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return buildMetadata({ title: "Product not found", noIndex: true });
  return buildMetadata({
    title: `${product.name} — ${product.size} Eau de Parfum`,
    description: product.description.slice(0, 160),
    path: `/shop/${product.slug}`,
    image: product.images[0]?.url,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const reviews = await listApprovedReviews(product.id);
  const sb = stockBadge[product.stockStatus];

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", path: "/" },
              { name: "Shop", path: "/shop" },
              { name: product.name, path: `/shop/${product.slug}` },
            ]),
          ),
        }}
      />

      <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6">
        <nav className="text-xs text-ink-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-ink">Home</Link> <span className="mx-1">/</span>
          <Link href="/shop" className="hover:text-ink">Shop</Link> <span className="mx-1">/</span>
          <span className="text-ink-secondary">{product.name}</span>
        </nav>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductGallery images={product.images} name={product.name} />

          <div>
            <div className="flex items-center gap-3">
              {product.discountPercent ? <Badge variant="accent">-{product.discountPercent}%</Badge> : null}
              <Badge variant={sb.variant}>{sb.text}</Badge>
            </div>

            <h1 className="mt-4 font-display text-5xl text-ink">{product.name}</h1>
            <p className="mt-2 text-sm uppercase tracking-wider text-ink-muted">
              {product.size} Eau de Parfum
            </p>

            <div className="mt-4 flex items-center gap-4">
              <Price amount={product.price} compareAt={product.compareAtPrice} size="lg" />
              <Rating value={product.ratingAvg} count={product.ratingCount} />
            </div>

            <p className="mt-6 leading-relaxed text-ink-secondary">{product.description}</p>

            <div className="mt-8">
              <ProductActions
                productId={product.id}
                maxQuantity={Math.max(1, product.stock)}
                disabled={product.stockStatus === "out_of_stock"}
              />
            </div>

            <Separator className="my-8" />

            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <Info label="Top Notes" value={product.topNotes.join(", ")} />
              <Info label="Heart Notes" value={product.heartNotes.join(", ")} />
              <Info label="Base Notes" value={product.baseNotes.join(", ")} />
              <Info label="Fragrance Family" value={product.family ?? "—"} />
              <Info label="Recommended Occasions" value={product.occasions.join(", ")} />
              <Info label="Recommended Time" value={product.timeOfDay ?? "Any time"} />
              <Info label="Size" value={product.size} />
            </dl>

            <Separator className="my-8" />

            <div>
              <h3 className="text-xs uppercase tracking-widest2 text-ink-muted">Ingredients</h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                {product.ingredients.join(", ")}
              </p>
            </div>

            {product.personality && (
              <div className="mt-6 border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-widest2 text-accent">Fragrance Personality</p>
                <p className="mt-2 text-sm italic leading-relaxed text-ink-secondary">
                  {product.personality}
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-14" />

        <ReviewSection
          productId={product.id}
          reviews={reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            title: r.title,
            body: r.body,
            createdAt: r.createdAt.toISOString(),
            authorName: r.user.name.split(" ")[0] ?? "Customer",
            verified: true,
          }))}
        />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest2 text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink-secondary">{value}</dd>
    </div>
  );
}
