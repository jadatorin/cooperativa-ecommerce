"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const RegisterForm = dynamic(
  () => import("@/components/register/register-form").then((mod) => mod.RegisterForm),
  {
    loading: () => (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <LoadingSpinner size="md" text="Cargando formulario..." />
      </div>
    ),
    ssr: false,
  }
);

export default function RegisterPage() {
  return <RegisterForm />;
}
