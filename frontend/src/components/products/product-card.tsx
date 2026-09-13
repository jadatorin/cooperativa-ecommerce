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
    e.preventDefault();
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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <Link href={`/products/${product.id}`}>
        {/* Mobile: Horizontal layout | Desktop: Vertical layout */}
        <div className="flex flex-col sm:flex-row">
          {/* Image Container */}
          <div className="relative aspect-square sm:aspect-square w-full sm:w-32 md:w-40 flex-shrink-0 bg-muted">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs sm:text-sm text-center p-2">
                {product.name}
              </div>
            )}
            <button
              onClick={toggleFavorite}
              disabled={togglingFav}
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
              aria-label={isFavorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
            >
              <Heart
                className={cn(
                  "h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors",
                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
                )}
              />
            </button>
            {product.weight_sold && (
              <Badge className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 text-[10px] sm:text-xs" variant="secondary">
                Por peso
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 min-w-0 p-3 sm:p-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-sm sm:text-base md:text-lg line-clamp-1">{product.name}</CardTitle>
              {product.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 hidden sm:block">
                  {product.description}
                </p>
              )}
            </CardHeader>

            <CardContent className="p-0 pb-3 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-lg sm:text-xl md:text-2xl font-bold">{formatPrice(product.price)}</span>
                {product.quantity_stock > 0 ? (
                  <Badge variant="outline" className="text-green-600 text-[10px] sm:text-xs">
                    Disponible
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px] sm:text-xs">Agotado</Badge>
                )}
              </div>
            </CardContent>

            <CardFooter className="p-0">
              <Button
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
                disabled={product.quantity_stock === 0 || adding}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {adding ? "Agregando..." : "Agregar al carrito"}
              </Button>
            </CardFooter>
          </div>
        </div>
      </Link>
    </Card>
  );
}