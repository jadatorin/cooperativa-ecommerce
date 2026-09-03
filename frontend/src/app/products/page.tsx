import { Suspense } from "react";
import { ProductsContent } from "@/components/products/products-content";

// ISR: Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

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
