"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { addToCart } from "@/lib/api";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  onAddedToCart?: () => void;
}

export function ProductCard({ product, onAddedToCart }: ProductCardProps) {
  const { token, isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation to product detail
    if (!isAuthenticated || !token) {
      window.location.href = "/cart";
      return;
    }
    setAdding(true);
    try {
      await addToCart(token, product.id, 1);
      await refreshCart();
      onAddedToCart?.();
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center p-4">
              {product.name}
            </div>
          )}
          {product.weight_sold && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              Por peso
            </Badge>
          )}
        </div>
      </Link>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
          {product.quantity_stock > 0 ? (
            <Badge variant="outline" className="text-green-600">
              Disponible
            </Badge>
          ) : (
            <Badge variant="destructive">Agotado</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          disabled={product.quantity_stock === 0 || adding}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {adding ? "Agregando..." : "Agregar al carrito"}
        </Button>
      </CardFooter>
    </Card>
  );
}
