"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { fetchCart, fetchProduct, updateCartItem, removeFromCart } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import type { CartItem } from "@/types";

export function CartContent() {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshCart } = useCart();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const cart = await fetchCart(token!);

        const uniqueProductIds = [...new Set(cart.items.map((i) => i.product_id))];
        const productMap = new Map<string, { name: string; image_url?: string }>();

        await Promise.all(
          uniqueProductIds.map(async (pid) => {
            try {
              const product = await fetchProduct(pid);
              productMap.set(pid, { name: product.name, image_url: product.image_url });
            } catch {
              productMap.set(pid, { name: "Producto desconocido" });
            }
          })
        );

        if (cancelled) return;

        const enriched = cart.items.map((item) => ({
          ...item,
          product_name: productMap.get(item.product_id)?.name ?? "Producto",
          product_image: productMap.get(item.product_id)?.image_url,
        }));

        setItems(enriched);
        setTotal(cart.total);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar el carrito");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token, isAuthenticated, authLoading]);

  const updateQuantity = useCallback(async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      return removeItem(item);
    }

    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, quantity: newQty, subtotal: i.unit_price * newQty } : i
      )
    );
    setTotal((prev) => prev + item.unit_price * delta);

    try {
      await updateCartItem(token!, item.id, newQty);
      await refreshCart();
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, quantity: item.quantity, subtotal: i.subtotal } : i
        )
      );
      setTotal((prev) => prev - item.unit_price * delta);
    }
  }, [token]);

  const removeItem = useCallback(async (item: CartItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setTotal((prev) => prev - item.subtotal);

    try {
      await removeFromCart(token!, item.id);
      await refreshCart();
    } catch {
      setItems((prev) => [...prev, item]);
      setTotal((prev) => prev + item.subtotal);
    }
  }, [token]);

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <LoadingSpinner size="md" text="Cargando carrito..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Inicia sesión para ver tu carrito</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Necesitas una cuenta para agregar productos
          </p>
          <LoginForm />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <ErrorMessage
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-16 text-center">
        <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Tu carrito está vacío</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
          Agrega productos para comenzar tu compra
        </p>
        <Link href="/products">
          <Button>Ver productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Carrito de compras</h1>

      {/* Mobile: Stack | Desktop: Side by side */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-3 sm:p-4">
                {/* Mobile: Compact layout */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Image + Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-14 w-14 sm:h-16 sm:w-16 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{item.product_name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatPrice(item.unit_price)} c/u
                      </p>
                    </div>
                  </div>

                  {/* Controls row */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => updateQuantity(item, -1)}
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="w-6 sm:w-8 text-center text-sm sm:font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8"
                        onClick={() => updateQuantity(item, 1)}
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>

                    {/* Price + Delete */}
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm sm:text-base">
                        {formatPrice(item.unit_price * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 text-destructive"
                        onClick={() => removeItem(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary - sticky on desktop */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex justify-between text-sm sm:text-base">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span>Envío</span>
                <span className="text-muted-foreground">Calculado al final</span>
              </div>
              <div className="border-t pt-3 sm:pt-4">
                <div className="flex justify-between font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Link href="/checkout" className="w-full">
                <Button className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={items.length === 0}>
                  Proceder al pago
                </Button>
              </Link>
              <Link href="/products" className="w-full">
                <Button variant="outline" className="w-full h-9 sm:h-10 text-sm sm:text-base">
                  Seguir comprando
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}