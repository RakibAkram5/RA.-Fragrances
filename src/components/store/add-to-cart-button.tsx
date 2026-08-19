"use client";

import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";
import { useToast } from "@/components/ui/toast";
import { ApiRequestError } from "@/lib/api-client";

export function AddToCartButton({
  productId,
  quantity = 1,
  disabled,
  variant = "accent",
  className,
  label = "Add to Cart",
}: {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  variant?: "accent" | "outline" | "default";
  className?: string;
  label?: string;
}) {
  const { add, setDrawerOpen } = useCart();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);

  async function handleAdd() {
    setPending(true);
    try {
      await add(productId, quantity);
      setDrawerOpen(true);
      toast({ title: "Added to your collection", variant: "success" });
    } catch (err) {
      toast({
        title: "Could not add to cart",
        description: err instanceof ApiRequestError ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant={variant}
      className={className}
      disabled={disabled || pending}
      onClick={handleAdd}
    >
      <ShoppingBag className="h-4 w-4" />
      {pending ? "Adding…" : label}
    </Button>
  );
}
