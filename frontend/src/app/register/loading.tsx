import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function RegisterLoading() {
  return (
    <div className="container mx-auto px-4 py-16 flex justify-center">
      <LoadingSpinner size="md" text="Cargando formulario..." />
    </div>
  );
}
