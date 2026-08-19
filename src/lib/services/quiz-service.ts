import "server-only";

import { prisma } from "@/lib/db";

export interface QuizAnswers {
  timeOfDay: "day" | "night" | "any";
  character: "fresh" | "warm" | "any";
  intensity: "subtle" | "bold" | "any";
  setting: "office" | "casual" | "any";
  vibe: "clean" | "mysterious" | "any";
  occasion: "everyday" | "special" | "any";
}

const TIME_DAY = new Set(["citrus", "fresh", "floral", "aromatic"]);
const TIME_NIGHT = new Set(["woody", "oriental", "spicy"]);
const FRESH = new Set(["citrus", "fresh", "aromatic"]);
const WARM = new Set(["woody", "oriental", "spicy"]);
const CLEAN = new Set(["citrus", "fresh", "aromatic", "floral"]);
const MYSTERIOUS = new Set(["woody", "oriental", "spicy"]);

function familyOf(family: string | null): string {
  return (family ?? "").toLowerCase();
}

/**
 * Recommendation logic runs against controlled product data (the database),
 * never hardcoded products. Each answer contributes a score and a reason.
 */
export async function recommendProducts(answers: QuizAnswers) {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    include: { inventory: true, images: { where: { isPrimary: true }, take: 1 } },
  });

  const scored = products
    .map((product) => {
      const family = familyOf(product.family);
      const occasions = product.occasions.map((o) => o.toLowerCase());
      const text = [
        product.description,
        product.personality ?? "",
        product.timeOfDay ?? "",
        ...product.occasions,
        ...product.topNotes,
        ...product.heartNotes,
        ...product.baseNotes,
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      const reasons: string[] = [];

      const bump = (n: number, reason: string) => {
        score += n;
        reasons.push(reason);
      };

      if (answers.timeOfDay === "day" && (TIME_DAY.has(family) || /day|fresh|light/.test(text))) {
        bump(2, "Day-worn profile");
      }
      if (answers.timeOfDay === "night" && (TIME_NIGHT.has(family) || /night|evening|intense/.test(text))) {
        bump(2, "Night-worn profile");
      }

      if (answers.character === "fresh" && FRESH.has(family)) bump(2, "Fresh composition");
      if (answers.character === "warm" && WARM.has(family)) bump(2, "Warm composition");

      if (answers.intensity === "subtle" && /subtle|soft|understated|close/.test(text)) bump(2, "Subtle projection");
      if (answers.intensity === "bold" && /bold|intense|strong|confident/.test(text)) bump(2, "Bold presence");

      if (answers.setting === "office" && occasions.includes("office")) bump(2, "Suited to the office");
      if (answers.setting === "casual" && (occasions.includes("casual") || occasions.includes("everyday"))) {
        bump(2, "Suited to casual wear");
      }

      if (answers.vibe === "clean" && CLEAN.has(family)) bump(2, "Clean character");
      if (answers.vibe === "mysterious" && MYSTERIOUS.has(family)) bump(2, "Mysterious character");

      if (answers.occasion === "special" && /evening|formal|special|date/.test(text)) bump(2, "Made for special occasions");
      if (answers.occasion === "everyday" && (occasions.includes("everyday") || occasions.includes("office"))) {
        bump(2, "Made for everyday wear");
      }

      return { product, score, reasons };
    })
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.product.ratingAvg - a.product.ratingAvg ||
        b.product.salesCount - a.product.salesCount,
    )
    .slice(0, 3);

  return scored.map((s) => ({
    id: s.product.id,
    name: s.product.name,
    slug: s.product.slug,
    price: s.product.price,
    size: s.product.size,
    family: s.product.family,
    image: s.product.images[0]?.url ?? null,
    stock: s.product.inventory?.quantity ?? 0,
    ratingAvg: s.product.ratingAvg,
    reasons: s.reasons.slice(0, 3),
    match: Math.min(100, Math.round((s.score / 12) * 100)),
  }));
}
