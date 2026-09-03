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
      <div className="container mx-auto px-4 py-16">
        <LoadingSpinner size="md" text="Cargando carrito..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Inicia sesión para ver tu carrito</h1>
          <p className="text-muted-foreground mb-6">
            Necesitas una cuenta para agregar productos
          </p>
          <LoginForm />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <ErrorMessage
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Tu carrito está vacío</h1>
        <p className="text-muted-foreground mb-6">
          Agrega productos para comenzar tu compra
        </p>
        <Link href="/products">
          <Button>Ver productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Carrito de compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {item.product_image && (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="h-16 w-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.unit_price)} c/u
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(item, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formatPrice(item.unit_price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => removeItem(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                <span className="text-muted-foreground">Calculado al final</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Link href="/checkout" className="w-full">
                <Button className="w-full" size="lg" disabled={items.length === 0}>
                  Proceder al pago
                </Button>
              </Link>
              <Link href="/products" className="w-full">
                <Button variant="outline" className="w-full">
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
