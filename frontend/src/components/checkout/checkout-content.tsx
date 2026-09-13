"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2 } from "lucide-react";
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
import Image from "next/image";
import { fetchCart, createOrder } from "@/lib/api";
import { enrichCartItems, EnrichedCartItem } from "@/lib/enrichment";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { LoginForm } from "@/components/auth/login-form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";

export function CheckoutContent() {
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

        const enriched = await enrichCartItems(cart.items);

        if (cancelled) return;

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
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <LoadingSpinner size="md" text="Cargando resumen del pedido..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Inicia sesión para continuar</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Necesitas una cuenta para realizar un pedido
          </p>
          <LoginForm />
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <ErrorMessage
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Finalizar pedido</h1>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Productos</h2>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  {item.product_image && (
                    <div className="relative h-12 w-12 sm:h-16 sm:w-16 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={item.product_image}
                        alt={item.product_name || "Producto"}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{item.product_name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {formatPrice(item.unit_price)} c/u × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-sm sm:text-base flex-shrink-0">
                    {formatPrice(item.unit_price * item.quantity)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Notas del pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Instrucciones de entrega, dirección, referencias... (opcional)"
                className="w-full min-h-[80px] sm:min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg">Resumen del pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-muted-foreground">
                  {items.length} {items.length === 1 ? "producto" : "productos"}
                </span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-muted-foreground">Envío</span>
                <span className="text-muted-foreground">A definir</span>
              </div>
              <div className="border-t pt-3 sm:pt-4">
                <div className="flex justify-between font-bold text-base sm:text-lg">
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
                className="w-full h-10 sm:h-11 text-sm sm:text-base"
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
                <Button variant="outline" className="w-full h-9 sm:h-10 text-sm sm:text-base" disabled={isSubmitting}>
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