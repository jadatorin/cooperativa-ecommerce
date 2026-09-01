"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { ProductCard } from "@/components/products/product-card";
import { fetchProducts, fetchCategories } from "@/lib/api";
import { Product, Category } from "@/types";
import { ErrorMessage } from "@/components/ui/error-message";

function ProductsContent() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const searchQuery = searchParams.get("search") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetchProducts({
          category: activeCategory || undefined,
          search: searchQuery || undefined,
          limit: 50,
        }),
        fetchCategories(),
      ]);
      setProducts(productsRes.products);
      setCategories(categoriesRes);
    } catch {
      setProducts([]);
      setCategories([]);
      setError("No se pudieron cargar los productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeCategory, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {searchQuery ? `Resultados para "${searchQuery}"` : "Productos"}
      </h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href="/products"
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            !activeCategory
              ? "bg-primary text-primary-foreground"
              : "border hover:bg-accent"
          }`}
        >
          Todos
        </a>
        {categories.map((cat) => (
          <a
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeCategory === cat.slug
                ? "bg-primary text-primary-foreground"
                : "border hover:bg-accent"
            }`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-80 rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={load} />
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          {activeCategory
            ? "No hay productos en esta categoría."
            : "No se pudieron cargar los productos."}
        </p>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Productos</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-80 rounded-xl bg-muted animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
