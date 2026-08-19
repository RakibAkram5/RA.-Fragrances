"use client";

import * as React from "react";
import { api } from "@/lib/api-client";

export interface CartLine {
  productId: string;
  quantity: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  size: string;
  image: string | null;
  stock: number;
  lineTotal: number;
}

export interface CartState {
  id: string;
  items: CartLine[];
  subtotal: number;
  itemCount: number;
}

interface CartContextValue {
  cart: CartState | null;
  loading: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = React.useState<CartState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      const data = await api<{ cart: CartState }>("/api/cart");
      setCart(data.cart);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const add = React.useCallback(
    async (productId: string, quantity = 1) => {
      const data = await api<{ cart: CartState }>("/api/cart/items", {
        method: "POST",
        body: { productId, quantity },
      });
      setCart(data.cart);
    },
    [],
  );

  const update = React.useCallback(async (productId: string, quantity: number) => {
    const data = await api<{ cart: CartState }>("/api/cart/items", {
      method: "PATCH",
      body: { productId, quantity },
    });
    setCart(data.cart);
  }, []);

  const remove = React.useCallback(async (productId: string) => {
    const data = await api<{ cart: CartState }>(
      `/api/cart/items?productId=${encodeURIComponent(productId)}`,
      { method: "DELETE" },
    );
    setCart(data.cart);
  }, []);

  const clear = React.useCallback(async () => {
    const data = await api<{ cart: CartState }>("/api/cart", { method: "DELETE" });
    setCart(data.cart);
  }, []);

  return (
    <CartContext.Provider
      value={{ cart, loading, drawerOpen, setDrawerOpen, refresh, add, update, remove, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
