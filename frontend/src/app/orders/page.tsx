"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Dynamic import for heavy orders content
const OrdersContent = dynamic(
  () => import("@/components/orders/orders-content").then((mod) => mod.OrdersContent),
  {
    loading: () => (
      <div className="container mx-auto px-4 py-16">
        <LoadingSpinner size="md" text="Cargando órdenes..." />
      </div>
    ),
    ssr: false,
  }
);

export default function OrdersPage() {
  return <OrdersContent />;
}
