"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { CheckCircle, Package, ShoppingBag } from "lucide-react";
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
import { useAuth } from "@/contexts/auth-context";

function ConfirmationInner() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order_number");
  const total = searchParams.get("total");
  const status = searchParams.get("status");
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!orderNumber) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">No se encontró información de la orden</p>
        <Link href="/products">
          <Button>Ver productos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">¡Pedido confirmado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Tu pedido ha sido recibido correctamente.
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número de pedido</span>
                <span className="font-semibold">#{orderNumber}</span>
              </div>
              {total && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatPrice(Number(total))}</span>
                </div>
              )}
              {status && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <span className="font-semibold capitalize">{status}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Te notificaremos cuando tu pedido sea procesado.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/products" className="w-full">
              <Button className="w-full">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Seguir comprando
              </Button>
            </Link>
            <Link href="/orders" className="w-full">
              <Button variant="outline" className="w-full">
                <Package className="mr-2 h-4 w-4" />
                Ver mis órdenes
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export function ConfirmationContent() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <ConfirmationInner />
    </Suspense>
  );
}
