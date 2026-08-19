import { formatPKR } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  amount,
  compareAt,
  size = "md",
  className,
}: {
  amount: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const base =
    size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-base";
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn(base, "font-medium text-ink")}>{formatPKR(amount)}</span>
      {compareAt && compareAt > amount && (
        <span className={cn(size === "lg" ? "text-base" : "text-sm", "text-ink-muted line-through")}>
          {formatPKR(compareAt)}
        </span>
      )}
    </span>
  );
}
