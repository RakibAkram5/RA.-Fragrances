"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/store/quantity-selector";
import { useCart } from "@/components/store/cart-provider";
import { useToast } from "@/components/ui/toast";
import { ApiRequestError } from "@/lib/api-client";

export function ProductActions({
  productId,
  maxQuantity,
  disabled,
}: {
  productId: string;
  maxQuantity: number;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { add, setDrawerOpen } = useCart();
  const { toast } = useToast();
  const [qty, setQty] = React.useState(1);
  const [pending, setPending] = React.useState<"add" | "buy" | null>(null);

  async function handleAdd() {
    setPending("add");
    try {
      await add(productId, qty);
      setDrawerOpen(true);
      toast({ title: "Added to your collection", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not add to cart",
        description: err instanceof ApiRequestError ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setPending(null);
    }
  }

  async function handleBuy() {
    setPending("buy");
    try {
      await add(productId, qty);
      router.push("/checkout");
    } catch (err) {
      toast({
        title: "Could not add to cart",
        description: err instanceof ApiRequestError ? err.message : "Please try again.",
        variant: "error",
      });
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantitySelector value={qty} onChange={setQty} max={maxQuantity} />
      <Button
        variant="accent"
        disabled={disabled || pending !== null}
        onClick={handleAdd}
        className="h-11 flex-1 min-w-[140px]"
      >
        <ShoppingBag className="h-4 w-4" />
        {pending === "add" ? "Adding…" : "Add to Cart"}
      </Button>
      <Button
        variant="outline"
        disabled={disabled || pending !== null}
        onClick={handleBuy}
        className="h-11 flex-1 min-w-[140px]"
      >
        <Zap className="h-4 w-4" />
        {pending === "buy" ? "Adding…" : "Buy Now"}
      </Button>
    </div>
  );
}
