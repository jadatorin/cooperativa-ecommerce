"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";
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
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-card">
      <Link href={`/products/${product.id}`}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 48vw, (max-width: 1024px) 32vw, 24vw"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNjAiIHZpZXdCb3glPSIwIDAgMzAgNjAiIHBvaW50cz0oNDAwLjUwMiwgNDAwLjUwMiwgc2Vuc2l0aXZlPlR5cGUgYXN0aW88L3N2Zz4="
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center p-2">
              {product.name}
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Favorite Button */}
          <button
            onClick={toggleFavorite}
            disabled={togglingFav}
            className="absolute top-3 right-3 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white hover:scale-110 transition-all duration-200"
            aria-label={isFavorite ? "Eliminar de favoritos" : "Agregar a favoritos"}
            aria-pressed={isFavorite}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-all duration-200",
                isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-gray-500 hover:text-red-400"
              )}
            />
          </button>

          {/* Weight Badge */}
          {product.weight_sold && (
            <Badge className="absolute top-3 left-3 bg-amber-500 text-white border-0 shadow-sm">
              ⚖️ Por peso
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title & Description */}
          <div className="space-y-1">
            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Price & Stock */}
          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Precio</p>
              <p className="text-xl font-bold text-primary">
                {formatPrice(product.price)}
              </p>
            </div>
            {product.quantity_stock > 0 ? (
              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                ✓ Disponible
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                Agotado
              </Badge>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <div className="px-4 pb-4">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 shadow-sm hover:shadow-md transition-all duration-200"
            disabled={product.quantity_stock === 0 || adding}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {adding ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Agregando...
              </span>
            ) : (
              "Agregar"
            )}
          </Button>
        </div>
      </Link>
    </Card>
  );
}