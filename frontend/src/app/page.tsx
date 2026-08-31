import { ProductCard } from "@/components/products/product-card";

// Mock data for now - will connect to API later
const mockProducts = [
  {
    id: "1",
    name: "Arroz Polar 1kg",
    description: "Arroz de grano largo, ideal para el día a día",
    price: 3.5,
    category_slug: "basicos",
    quantity_stock: 200,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "2",
    name: "Leche Completa 1L",
    description: "Leche entera pasteurizada",
    price: 2.8,
    category_slug: "lacteos",
    quantity_stock: 100,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "3",
    name: "Pollo entero",
    description: "Pollo entero fresco",
    price: 4.5,
    category_slug: "carnes",
    quantity_stock: 40,
    is_available: true,
    weight_sold: true,
  },
  {
    id: "4",
    name: "Plátano",
    description: "Plátano verde maduro",
    price: 0.8,
    category_slug: "frutas-verduras",
    quantity_stock: 100,
    is_available: true,
    weight_sold: true,
  },
  {
    id: "5",
    name: "Agua Minalba 1.5L",
    description: "Agua purificada sin gas",
    price: 0.9,
    category_slug: "bebidas",
    quantity_stock: 200,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "6",
    name: "Jabón Protex 150g",
    description: "Jabón antibacterial",
    price: 1.8,
    category_slug: "higiene",
    quantity_stock: 120,
    is_available: true,
    weight_sold: false,
  },
];

export default function HomePage() {
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
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Básicos", slug: "basicos", emoji: "🍚" },
            { name: "Lácteos", slug: "lacteos", emoji: "🥛" },
            { name: "Carnes", slug: "carnes", emoji: "🥩" },
            { name: "Frutas y Verduras", slug: "frutas-verduras", emoji: "🍌" },
            { name: "Bebidas", slug: "bebidas", emoji: "🥤" },
            { name: "Higiene", slug: "higiene", emoji: "🧴" },
          ].map((cat) => (
            <a
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
            >
              <span className="text-3xl mb-2">{cat.emoji}</span>
              <span className="text-sm font-medium">{cat.name}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Productos Destacados</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
