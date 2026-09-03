"use client";

import dynamic from "next/dynamic";
import { ShoppingCart } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Dynamic import for heavy checkout content
const CheckoutContent = dynamic(
  () => import("@/components/checkout/checkout-content").then((mod) => mod.CheckoutContent),
  {
    loading: () => (
      <div className="container mx-auto px-4 py-16">
        <LoadingSpinner size="md" text="Cargando checkout..." />
      </div>
    ),
    ssr: false,
  }
);

export default function CheckoutPage() {
  return <CheckoutContent />;
}
