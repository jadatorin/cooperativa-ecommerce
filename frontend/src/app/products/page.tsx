import { ProductCard } from "@/components/products/product-card";

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
    name: "Aceite Optimus 1L",
    description: "Aceite vegetal refinado para freír y cocinar",
    price: 4.25,
    category_slug: "basicos",
    quantity_stock: 150,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "3",
    name: "Sal Bahamontes 1kg",
    description: "Sal fina yodificada",
    price: 1.2,
    category_slug: "basicos",
    quantity_stock: 300,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "4",
    name: "Azúcar Montalbán 1kg",
    description: "Azúcar blanca refinada",
    price: 2.8,
    category_slug: "basicos",
    quantity_stock: 180,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "5",
    name: "Harina P.A.N. 1kg",
    description: "Harina de maíz precocida para arepas",
    price: 2.5,
    category_slug: "basicos",
    quantity_stock: 250,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "6",
    name: "Pasta Primor 500g",
    description: "Espaguetis de trigo durazno",
    price: 1.9,
    category_slug: "basicos",
    quantity_stock: 200,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "7",
    name: "Leche Completa 1L",
    description: "Leche entera pasteurizada",
    price: 2.8,
    category_slug: "lacteos",
    quantity_stock: 100,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "8",
    name: "Queso Blanco 500g",
    description: "Queso fresco artesanal",
    price: 5.5,
    category_slug: "lacteos",
    quantity_stock: 50,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "9",
    name: "Mantequilla Manicera 500g",
    description: "Mantequilla con sal",
    price: 4.2,
    category_slug: "lacteos",
    quantity_stock: 80,
    is_available: true,
    weight_sold: false,
  },
  {
    id: "10",
    name: "Pollo entero",
    description: "Pollo entero fresco",
    price: 4.5,
    category_slug: "carnes",
    quantity_stock: 40,
    is_available: true,
    weight_sold: true,
  },
  {
    id: "11",
    name: "Carne molida 1kg",
    description: "Carne de res molida fresca",
    price: 8.9,
    category_slug: "carnes",
    quantity_stock: 30,
    is_available: true,
    weight_sold: true,
  },
  {
    id: "12",
    name: "Plátano",
    description: "Plátano verde maduro",
    price: 0.8,
    category_slug: "frutas-verduras",
    quantity_stock: 100,
    is_available: true,
    weight_sold: true,
  },
];

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Productos</h1>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <a
          href="/products"
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium"
        >
          Todos
        </a>
        {[
          { name: "Básicos", slug: "basicos" },
          { name: "Lácteos", slug: "lacteos" },
          { name: "Carnes", slug: "carnes" },
          { name: "Frutas y Verduras", slug: "frutas-verduras" },
          { name: "Bebidas", slug: "bebidas" },
          { name: "Higiene", slug: "higiene" },
        ].map((cat) => (
          <a
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            className="px-4 py-2 rounded-full border text-sm font-medium hover:bg-accent"
          >
            {cat.name}
          </a>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
