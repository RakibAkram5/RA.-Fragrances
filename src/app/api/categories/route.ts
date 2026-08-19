import { jsonOk, mapRouteError } from "@/lib/route-helpers";
import { listCategories } from "@/lib/services/category-service";

export async function GET() {
  try {
    const categories = await listCategories();
    return jsonOk({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        productCount: c._count.products,
      })),
    });
  } catch (err) {
    return mapRouteError(err);
  }
}
