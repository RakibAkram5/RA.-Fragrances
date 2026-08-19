import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center" aria-label={`Rated ${value} out of 5`}>
        {stars.map((s) => (
          <Star
            key={s}
            className={cn(
              size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4",
              s <= Math.round(value) ? "fill-accent text-accent" : "text-ink-muted/40",
            )}
          />
        ))}
      </div>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-ink-muted">({count})</span>
      )}
    </div>
  );
}
