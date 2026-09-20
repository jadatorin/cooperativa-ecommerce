import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/ui/hero-carousel";
import { ProductGrid } from "@/components/products/product-grid";
import { fetchProducts, fetchCategories } from "@/lib/api";

const heroSlides = [
  { image: "/images/imageCoop.jpg", alt: "Cooperativa - Productos frescos" },
  { image: "/images/imageCoop2.jpg", alt: "Cooperativa - Calidad y precio justo" },
  { image: "/images/image-feria.jpg", alt: "Cooperativa - Feria de productos" },
];

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof fetchProducts>>["products"] = [];
  let categories: Awaited<ReturnType<typeof fetchCategories>> = [];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetchProducts({ limit: 6 }),
      fetchCategories(),
    ]);
    products = productsRes.products;
    categories = categoriesRes;
  } catch {
    // API not available — render empty state
  }

  const categoryEmojis: Record<string, string> = {
    basicos: "🍚",
    lacteos: "🥛",
    carnes: "🥩",
    "frutas-verduras": "🍌",
    bebidas: "🥤",
    higiene: "🧴",
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Hero Section with Carousel */}
      <section className="mb-8 sm:mb-12">
        <div className="relative">
          <HeroCarousel slides={heroSlides} autoPlayInterval={5000} />
          {/* Overlay content */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center pointer-events-none">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-white drop-shadow-lg">
              Bienvenido a Cooperativa
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-8 drop-shadow-md">
              Productos de calidad a precios justos para ti y tu familia
            </p>
            <Link href="/products" className="pointer-events-auto">
              <Button size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all bg-white text-gray-900 hover:bg-gray-100">
                Ver Productos →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mb-8 sm:mb-12">
          <h2 className="text-2xl font-bold mb-6">Categorías</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <a
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <span className="text-3xl mb-2">
                  {categoryEmojis[cat.slug] ?? "📦"}
                </span>
                <span className="text-sm font-medium text-center">{cat.name}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Productos Igual que la página Products */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Productos</h2>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="text-muted-foreground">
            No se pudieron cargar los productos. Verifica que el backend esté
            corriendo en localhost:3000.
          </p>
        )}
      </section>
    </div>
  );
}