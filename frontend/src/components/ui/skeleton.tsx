"use client";

import { cn } from "@/lib/utils";

/**
 * Skeleton - Componente de estado de carga estilo osificación.
 * 
 * Proporciona una experiencia visual consistente mientras se cargan datos asíncronos.
 * Reemplaza divs inline con bg-muted animate-pulse con un componente reutilizable.
 */
interface SkeletonProps {
  /** Ancho del skeleton. "full" por defecto, o un valor Tailwind como "w-48" */
  width?: "full" | string;
  /** Alto del skeleton. "full" por defecto, o un valor Tailwind como "h-48" */
  height?: "full" | string;
  /** Si true, usa border-radius rounded. Si false, skeleton rectangular. */
  rounds?: boolean;
  /** Clases adicionales de Tailwind */
  className?: string;
}

export function Skeleton({
  width = "full",
  height = "full",
  rounds = true,
  className,
}: SkeletonProps) {
  const widthClass = width === "full" ? "w-full" : `w-${width}`;
  const heightClass = height === "full" ? "h-full" : `h-${height}`;
  const roundsClass = rounds ? "rounded" : "";
  const baseClasses = "animate-hamburger bg-border rounded-border border-2";

  return (
    <div
      className={cn(baseClasses, widthClass, heightClass, roundsClass, className)}
      data-testid="skeleton"
    />
  );
}

Skeleton.displayName = "Skeleton";