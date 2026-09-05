"use client";

import { useEffect } from "react";
import { Table, TableHeader, TableRow, TableCell, TableHead, TableBody } from "@/components/ui/table";

interface OrderItem {
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ReceiptPrintProps {
  order: {
    order_number: number;
    date: string;
    items: OrderItem[];
    total: number;
    tax: number;
    subtotal: number;
    payment_method?: string;
    customer_name?: string;
    shop_name?: string;
    shop_address?: string;
    shop_phone?: string;
  };
}

export function ReceiptPrint({ order }: ReceiptPrintProps) {
  useEffect(() => {
    window.print();
  }, []);

  const formattedDate = new Date(order.date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const paymentMethod = order.payment_method || "No especificado";

  // Truncate long product names for thermal printer (80mm width constraint)
  const truncateProductName = (name: string | undefined) => {
    if (!name) return "-";
    if (name.length <= 30) return name;
    return name.substring(0, 27) + "...";
  };

  const items = order.items;

  if (!order.shop_name) {
    return <div>Datos de tienda incompletos</div>;
  }

  return (
    <div className="max-w-max">
      <div className="p-4">
        {/* Shop name/logo at top */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">{order.shop_name}</h1>
          {order.shop_address && <p className="text-sm text-muted-foreground">{order.shop_address}</p>}
          {order.shop_phone && <p className="text-xs text-muted-foreground">{order.shop_phone}</p>}
        </div>

        {/* Order info */}
        <div className="mb-6">
          <p>Número: {order.order_number}</p>
          <p>Fecha: {formattedDate}</p>
        </div>

        {/* Items table */}
        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-left">Producto</TableHead>
                <TableHead className="text-center">Cantidad</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.product_name || `${item.quantity}-${item.unit_price}`} className="border-b">
                  <TableCell className="text-left">
                    {truncateProductName(item.product_name)}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unit_price}</TableCell>
                  <TableCell className="text-right">${item.subtotal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground">No hay items en este pedido</p>
        )}

        {/* Totals */}
        <div className="mt-8 pt-8 border-t text-right">
          <p>Subtotal: ${order.subtotal}</p>
          <p>IVA (16%): ${order.tax}</p>
          <p>Total: ${order.total}</p>
          <p>Método: {paymentMethod}</p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          {order.shop_address && <div>Contacto: {order.shop_address}</div>}
          {order.shop_phone && <div>{order.shop_phone}</div>}
        </div>
      </div>
    </div>
  );
}