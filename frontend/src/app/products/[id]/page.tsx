import { fetchProduct } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingCart, ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await fetchProduct(id);
    return { title: `${product.name} - Cooperativa` };
  } catch {
    return { title: "Producto no encontrado" };
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;
  let product;

  try {
    product = await fetchProduct(id);
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a productos
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image / Placeholder */}
        <div className="aspect-square rounded-xl bg-muted flex items-center justify-center">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Package className="h-16 w-16" />
              <span className="text-lg font-medium">{product.name}</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            {product.category_slug && (
              <Badge variant="secondary" className="mt-2">
                {product.category_slug}
              </Badge>
            )}
          </div>

          <p className="text-4xl font-bold">{formatPrice(product.price)}</p>

          {product.description && (
            <p className="text-muted-foreground">{product.description}</p>
          )}

          {/* Meta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock</span>
                {product.quantity_stock > 0 ? (
                  <span className="text-green-600 font-medium">
                    Disponible ({product.quantity_stock} unidades)
                  </span>
                ) : (
                  <span className="text-destructive font-medium">
                    Agotado
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Venta</span>
                <span>
                  {product.weight_sold ? "Por peso" : "Por unidad"}
                </span>
              </div>
              {product.barcode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Código</span>
                  <span className="font-mono">{product.barcode}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add to cart */}
          <Button
            size="lg"
            className="w-full"
            disabled={product.quantity_stock === 0}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            {product.quantity_stock > 0
              ? "Agregar al carrito"
              : "Agotado"}
          </Button>
        </div>
      </div>
    </div>
  );
}
