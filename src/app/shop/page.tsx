import type { Metadata } from "next";
import { listCategories } from "@/lib/services/category-service";
import { listProducts } from "@/lib/services/product-service";
import { ProductCard } from "@/components/store/product-card";
import { buildMetadata } from "@/lib/seo";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Shop Fragrances",
  description: "Browse the RA collection — affordable luxury Eau de Parfum, composed for Pakistan.",
  path: "/shop",
});

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popular", label: "Most Popular" },
];

function num(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";
  const inStock = sp.inStock === "1";
  const minPrice = num(typeof sp.minPrice === "string" ? sp.minPrice : undefined);
  const maxPrice = num(typeof sp.maxPrice === "string" ? sp.maxPrice : undefined);
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const [categories, result] = await Promise.all([
    listCategories(),
    listProducts({
      q: q || undefined,
      categorySlug: category || undefined,
      minPrice,
      maxPrice,
      inStock,
      sort,
      statuses: ["ACTIVE"],
      page,
      pageSize: 12,
    }),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-8xl px-4 py-12 sm:px-6">
          <p className="eyebrow">The Collection</p>
          <h1 className="mt-3 font-display text-5xl text-ink">
            {activeCategory ? activeCategory.name : "All Fragrances"}
          </h1>
          <p className="mt-3 max-w-xl text-ink-secondary">
            {result.total} {result.total === 1 ? "fragrance" : "fragrances"}
            {q ? ` matching “${q}”` : ""}
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-8xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[240px_1fr]">
        {/* Filters */}
        <aside>
          <form method="get" action="/shop" className="space-y-6 lg:sticky lg:top-24">
            <div>
              <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="q">
                Search
              </label>
              <input
                id="q"
                name="q"
                defaultValue={q}
                placeholder="Search fragrances"
                className="mt-2 h-10 w-full border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue={category}
                className="mt-2 h-10 w-full border border-border bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="sort">
                Sort
              </label>
              <select
                id="sort"
                name="sort"
                defaultValue={sort}
                className="mt-2 h-10 w-full border border-border bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="minPrice">
                  Min (PKR)
                </label>
                <input
                  id="minPrice"
                  name="minPrice"
                  type="number"
                  min={0}
                  defaultValue={minPrice ?? ""}
                  className="mt-2 h-10 w-full border border-border bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest2 text-ink-muted" htmlFor="maxPrice">
                  Max (PKR)
                </label>
                <input
                  id="maxPrice"
                  name="maxPrice"
                  type="number"
                  min={0}
                  defaultValue={maxPrice ?? ""}
                  className="mt-2 h-10 w-full border border-border bg-surface px-3 text-sm text-ink focus:border-accent focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                name="inStock"
                value="1"
                defaultChecked={inStock}
                className="h-4 w-4 accent-[#C8A96B]"
              />
              In stock only
            </label>

            <button
              type="submit"
              className="h-11 w-full bg-accent text-sm uppercase tracking-wider text-background transition-colors hover:bg-accent-strong"
            >
              Apply Filters
            </button>
            {(q || category || inStock || minPrice || maxPrice || sort !== "newest") && (
              <Link
                href="/shop"
                className="block text-center text-xs uppercase tracking-wider text-ink-muted hover:text-ink"
              >
                Clear all
              </Link>
            )}
          </form>
        </aside>

        {/* Grid */}
        <div>
          {result.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-border bg-surface py-24 text-center">
              <p className="font-display text-2xl text-ink">No fragrances found</p>
              <p className="mt-2 text-sm text-ink-secondary">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {result.pageCount > 1 && (
            <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/shop?${new URLSearchParams({
                    ...(q ? { q } : {}),
                    ...(category ? { category } : {}),
                    ...(sort !== "newest" ? { sort } : {}),
                    ...(inStock ? { inStock: "1" } : {}),
                    ...(minPrice ? { minPrice: String(minPrice) } : {}),
                    ...(maxPrice ? { maxPrice: String(maxPrice) } : {}),
                    page: String(n),
                  }).toString()}`}
                  aria-current={n === page ? "page" : undefined}
                  className={
                    n === page
                      ? "flex h-10 w-10 items-center justify-center bg-accent text-sm text-background"
                      : "flex h-10 w-10 items-center justify-center border border-border text-sm text-ink-secondary hover:bg-surface"
                  }
                >
                  {n}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
