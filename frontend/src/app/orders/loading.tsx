import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function OrdersLoading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <LoadingSpinner size="md" text="Cargando órdenes..." />
    </div>
  );
}
