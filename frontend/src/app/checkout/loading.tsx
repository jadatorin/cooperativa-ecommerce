import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <LoadingSpinner size="md" text="Cargando checkout..." />
    </div>
  );
}
