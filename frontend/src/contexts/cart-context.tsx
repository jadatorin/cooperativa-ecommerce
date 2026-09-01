"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./auth-context";
import { fetchCart } from "@/lib/api";

interface CartContextValue {
  itemCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  itemCount: 0,
  refreshCart: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [itemCount, setItemCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setItemCount(0);
      return;
    }
    try {
      const cart = await fetchCart(token);
      setItemCount(cart.itemCount);
    } catch {
      setItemCount(0);
    }
  }, [token, isAuthenticated]);

  // Load cart on auth change
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ itemCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
