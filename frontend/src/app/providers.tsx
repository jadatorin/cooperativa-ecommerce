"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>{children}</ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
