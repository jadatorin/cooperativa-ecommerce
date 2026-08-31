import { ProductCard } from "@/components/products/product-card";
import { fetchProducts, fetchCategories } from "@/lib/api";

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
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg mb-12">
        <h1 className="text-4xl font-bold mb-4">Bienvenido a Cooperativa</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Productos de calidad a precios justos para ti y tu familia
        </p>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Categorías</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <a
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <span className="text-3xl mb-2">
                  {categoryEmojis[cat.slug] ?? "📦"}
                </span>
                <span className="text-sm font-medium">{cat.name}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Productos Destacados</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
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
