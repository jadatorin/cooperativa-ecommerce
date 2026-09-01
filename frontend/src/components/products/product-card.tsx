"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { addToCart, fetchFavorites, addFavorite, removeFavorite } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";

interface ProductCardProps {
  product: Product;
  onAddedToCart?: () => void;
  onFavoriteToggle?: () => void;
}

export function ProductCard({ product, onAddedToCart, onFavoriteToggle }: ProductCardProps) {
  const { token, isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  useEffect(() => {
    if (!token || !isAuthenticated) return;
    fetchFavorites(token)
      .then((favs) => {
        setIsFavorite(favs.some((f) => f.product_id === product.id));
      })
      .catch(() => {});
  }, [token, isAuthenticated, product.id]);

  const toggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isAuthenticated || !token) {
        window.location.href = "/login";
        return;
      }
      setTogglingFav(true);
      try {
        if (isFavorite) {
          await removeFavorite(token, product.id);
          setIsFavorite(false);
        } else {
          await addFavorite(token, product.id);
          setIsFavorite(true);
        }
        onFavoriteToggle?.();
      } catch (err) {
        console.error("Error toggling favorite:", err);
      } finally {
        setTogglingFav(false);
      }
    },
    [isAuthenticated, token, isFavorite, product.id]
  );

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
          <button
            onClick={toggleFavorite}
            disabled={togglingFav}
            className="absolute top-2 right-2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
            aria-label={isFavorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )}
            />
          </button>
          {product.weight_sold && (
            <Badge className="absolute top-2 left-2" variant="secondary">
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
