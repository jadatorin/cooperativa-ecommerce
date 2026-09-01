"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { addToCart } from "@/lib/api";
import { useState } from "react";

interface AddToCartButtonProps {
  productId: string;
  disabled?: boolean;
  stockLabel: string;
}

export function AddToCartButton({ productId, disabled, stockLabel }: AddToCartButtonProps) {
  const { token, isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!isAuthenticated || !token) {
      window.location.href = "/cart";
      return;
    }
    setAdding(true);
    try {
      await addToCart(token, productId, 1);
      await refreshCart();
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={disabled || adding}
      onClick={handleAdd}
    >
      <ShoppingCart className="h-5 w-5 mr-2" />
      {adding
        ? "Agregando..."
        : disabled
          ? "Agotado"
          : "Agregar al carrito"}
    </Button>
  );
}
