"use client";

import * as React from "react";
import { ProductForm } from "@/components/admin/product-form";
import { api } from "@/lib/api-client";

export default function NewProductPage() {
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    api<{ categories: { id: string; name: string }[] }>("/api/admin/categories")
      .then((d) => setCategories(d.categories))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Add Product</h1>
        <p className="mt-1 text-sm text-ink-secondary">Create a new fragrance in the store.</p>
      </div>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
