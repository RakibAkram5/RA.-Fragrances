import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/store/rating";
import { Price } from "@/components/store/price";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import type { ProductDto } from "@/lib/services/product-service";

const stockLabel = {
  in_stock: { text: "In Stock", variant: "success" },
  low_stock: { text: "Low Stock", variant: "warning" },
  out_of_stock: { text: "Out of Stock", variant: "danger" },
} as const;

type StockKey = keyof typeof stockLabel;

export function ProductCard({ product }: { product: ProductDto }) {
  const image = product.images[0]?.url ?? "/brand/product-placeholder.png";
  const out = product.stockStatus === "out_of_stock";
  const s = stockLabel[product.stockStatus as StockKey];

  return (
    <div className="group relative flex flex-col border border-border bg-surface transition-colors hover:border-border-strong">
      <Link
        href={`/shop/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-surface-2"
        aria-label={product.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.discountPercent ? (
            <Badge variant="accent">-{product.discountPercent}%</Badge>
          ) : null}
          {product.featured ? <Badge variant="outline">Featured</Badge> : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg leading-tight text-ink">
              <Link href={`/shop/${product.slug}`} className="hover:text-accent">
                {product.name}
              </Link>
            </h3>
            <p className="mt-0.5 text-xs uppercase tracking-wider text-ink-muted">
              {product.size} Eau de Parfum
            </p>
          </div>
        </div>

        <div className="mt-2">
          <Rating value={product.ratingAvg} count={product.ratingCount} />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <Price amount={product.price} compareAt={product.compareAtPrice} size="sm" />
          <Badge variant={s.variant}>{s.text}</Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <AddToCartButton
            productId={product.id}
            disabled={out}
            variant="accent"
            className="h-10 w-full px-3 text-xs"
            label="Add"
          />
          <Link
            href={`/shop/${product.slug}`}
            className="inline-flex h-10 items-center justify-center border border-border text-xs tracking-wide text-ink transition-colors hover:bg-surface-2"
          >
            Quick View
          </Link>
        </div>
      </div>
    </div>
  );
}
