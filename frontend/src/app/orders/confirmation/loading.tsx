import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function OrderConfirmationLoading() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <LoadingSpinner size="md" text="Cargando confirmación..." />
    </div>
  );
}
