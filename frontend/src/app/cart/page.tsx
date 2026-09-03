"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const CartContent = dynamic(
  () => import("@/components/cart/cart-content").then((mod) => mod.CartContent),
  {
    loading: () => (
      <div className="container mx-auto px-4 py-16">
        <LoadingSpinner size="md" text="Cargando carrito..." />
      </div>
    ),
    ssr: false,
  }
);

export default function CartPage() {
  return <CartContent />;
}
