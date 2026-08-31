"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_slug?: string;
  quantity_stock: number;
  is_available: boolean;
  weight_sold: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Sin imagen
            </div>
          )}
          {product.weight_sold && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              Por peso
            </Badge>
          )}
        </div>
      </Link>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
          {product.quantity_stock > 0 ? (
            <Badge variant="outline" className="text-green-600">
              Disponible
            </Badge>
          ) : (
            <Badge variant="destructive">Agotado</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" disabled={product.quantity_stock === 0}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Agregar al carrito
        </Button>
      </CardFooter>
    </Card>
  );
}
