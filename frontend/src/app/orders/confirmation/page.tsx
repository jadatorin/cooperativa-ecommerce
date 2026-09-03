"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const ConfirmationContent = dynamic(
  () =>
    import("@/components/confirmation/confirmation-content").then(
      (mod) => mod.ConfirmationContent
    ),
  {
    loading: () => (
      <div className="container mx-auto px-4 py-16 text-center">
        <LoadingSpinner size="md" text="Cargando confirmación..." />
      </div>
    ),
    ssr: false,
  }
);

export default function OrderConfirmationPage() {
  return <ConfirmationContent />;
}
