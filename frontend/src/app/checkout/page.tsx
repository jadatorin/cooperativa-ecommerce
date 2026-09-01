"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { fetchCart, fetchProduct, createOrder } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import type { CartItem } from "@/types";

interface EnrichedCartItem extends CartItem {
  product_name?: string;
  product_image?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { refreshCart } = useCart();
  const [items, setItems] = useState<EnrichedCartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

        if (cart.items.length === 0) {
          router.replace("/cart");
          return;
        }

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
    return () => {
      cancelled = true;
    };
  }, [token, isAuthenticated, authLoading, router]);

  const handleSubmit = async () => {
    if (!token) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createOrder(token, notes || undefined);
      await refreshCart();

      const params = new URLSearchParams({
        order_number: String(result.order.order_number),
        total: String(result.order.total),
        status: result.order.status,
      });
      router.push(`/orders/confirmation?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la orden");
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <LoadingSpinner size="md" text="Cargando resumen del pedido..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Inicia sesión para continuar</h1>
          <p className="text-muted-foreground mb-6">
            Necesitas una cuenta para realizar un pedido
          </p>
          <LoginForm />
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <ErrorMessage
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Finalizar pedido</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Productos</h2>
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
                      {formatPrice(item.unit_price)} c/u × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatPrice(item.unit_price * item.quantity)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notas del pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instrucciones de entrega, dirección, referencias... (opcional)"
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {items.length} {items.length === 1 ? "producto" : "productos"}
                </span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="text-muted-foreground">A definir</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {error && (
                <ErrorMessage message={error} onRetry={handleSubmit} />
              )}
              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Confirmar pedido"
                )}
              </Button>
              <Link href="/cart" className="w-full">
                <Button variant="outline" className="w-full" disabled={isSubmitting}>
                  Volver al carrito
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
