"use client";

import { ProductCard } from "./product-card";

/**
 * ProductGrid - Componente reusable para mostrar productos en diseño responsivo.
 * 
 * Uso:
 * <ProductGrid products={products} />
 * <ProductGrid products={products} cols={3} /> -- para forzar 3 columnas en móvil
 * 
 * Grid pattern por defecto:
 * - Móvil (< 640px): 2 columnas
 * - Small (≥ 640px): 2 columnas
 * - Medium (≥ 768px): 3 columnas
 * - Large (≥ 1024px): 4 columnas
 */
interface ProductGridProps {
  products: Product[];
  /** Número de columnas en móviles. Default: 2. Opcional paraforzar un breakout. */
  cols?: 2 | 3 | 4;
  /** Clases adicionales de Tailwind (gap, margin, etc.) */
  className?: string;
}

export function ProductGrid({ products, cols = 2, className }: ProductGridProps) {
  // Determina las clases de grid basándose en el número de columnas en móvil
  const gridClasses = `
    grid grid-cols-${cols} sm:grid-cols-${cols} lg:grid-cols-${
      cols === 2 ? 4 : cols + 1
    } xl:grid-cols-${
      cols === 2 ? 4 : cols + 2
    } gap-3 sm:gap-4 md:gap-6 ${className}
  `.trim();

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground">
        {products.length === 0 && "No hay productos disponibles."}
      </p>
    );
  }

  return <div className={gridClasses}>{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}

ProductGrid.displayName = "ProductGrid";