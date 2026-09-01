"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { fetchFavorites, fetchProducts, Favorite } from "@/lib/api";
import { Product } from "@/types";
import { ProductCard } from "@/components/products/product-card";

export default function FavoritesPage() {
  const { token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const loadFavorites = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const favs = await fetchFavorites(token);
      if (favs.length === 0) {
        setProducts([]);
        return;
      }
      const allProducts = await fetchProducts({ limit: 1000 });
      const favProductIds = new Set(favs.map((f: Favorite) => f.product_id));
      const filtered = allProducts.products.filter((p: Product) =>
        favProductIds.has(p.id)
      );
      setProducts(filtered);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites, refreshKey]);

  const handleFavoriteToggle = () => {
    setRefreshKey((k) => k + 1);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mis favoritos</h1>

      {loading ? (
        <p className="text-muted-foreground">Cargando favoritos...</p>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No tienes favoritos</p>
            <p className="text-muted-foreground mb-4">
              Marca productos como favoritos para verlos aquí.
            </p>
            <Link href="/products">
              <Button>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Ver productos
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
