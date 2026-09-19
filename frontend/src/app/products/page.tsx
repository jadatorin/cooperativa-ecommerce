import { Suspense } from "react";
import { ProductGrid } from "@/components/products/product-grid";
import { fetchProducts, fetchCategories } from "@/lib/api";

// ISR: Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Productos</h1>
          <ProductGrid products={[]} />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}