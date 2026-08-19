"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { api } from "@/lib/api-client";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const [initial, setInitial] = React.useState<Record<string, unknown> | null>(null);

  React.useEffect(() => {
    api<{ categories: { id: string; name: string }[] }>("/api/admin/categories")
      .then((d) => setCategories(d.categories))
      .catch(() => {});
    api<{ product: Record<string, unknown> }>(`/api/admin/products/${params.id}`)
      .then((d) => setInitial(d.product))
      .catch(() => {});
  }, [params.id]);

  if (!initial) return <p className="text-ink-secondary">Loading…</p>;

  const product = initial as {
    name: string; slug: string; description: string; price: number;
    compareAtPrice: number | null; sku: string; categoryId: string | null;
    family: string | null; topNotes: string[]; heartNotes: string[]; baseNotes: string[];
    size: string; ingredients: string[]; occasions: string[]; timeOfDay: string | null;
    personality: string | null; status: string; featured: boolean;
    images: { url: string; alt: string | null }[];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Edit Product</h1>
        <p className="mt-1 text-sm text-ink-secondary">{product.name}</p>
      </div>
      <ProductForm
        mode="edit"
        productId={params.id}
        categories={categories}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : "",
          sku: product.sku,
          categoryId: product.categoryId ?? "",
          family: product.family ?? "",
          topNotes: product.topNotes.join(", "),
          heartNotes: product.heartNotes.join(", "),
          baseNotes: product.baseNotes.join(", "),
          size: product.size,
          ingredients: product.ingredients.join(", "),
          occasions: product.occasions.join(", "),
          timeOfDay: product.timeOfDay ?? "",
          personality: product.personality ?? "",
          status: product.status,
          featured: product.featured,
          images: product.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
        }}
      />
    </div>
  );
}
