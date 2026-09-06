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
    total_paid?: number;
    payment_method?: string;
    customer_name?: string;
    shop_name?: string;
    shop_address?: string;
    shop_phone?: string;
  };
  onClose?: () => void;
}

export function ReceiptPrint({ order, onClose }: ReceiptPrintProps) {
  useEffect(() => {
    window.print();
    // Call onClose after print dialog closes
    const timer = setTimeout(() => {
      onClose?.();
    }, 1000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const formattedDate = new Date(order.date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatMoney = (amount: number) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const paymentMethod = order.payment_method || "No especificado";

  // Truncate long product names for thermal printer (80mm width constraint)
  const truncateProductName = (name: string | undefined) => {
    if (!name) return "-";
    if (name.length <= 30) return name;
    return name.substring(0, 27) + "...";
  };

  const items = order.items;

  // Use shop_name or fallback to generic name
  const shopName = order.shop_name || "Cooperativa 5 de Julio";

  return (
    <div className="fixed inset-0 z-50 bg-white receipt-print-container">
      {/* Print-only receipt */}
      <div className="receipt-print p-4">
        {/* Shop name/logo at top */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold">{shopName}</h1>
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
                  <TableCell className="text-right">{formatMoney(item.unit_price)}</TableCell>
                  <TableCell className="text-right">{formatMoney(item.subtotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground">No hay items en este pedido</p>
        )}

        {/* Totals */}
        <div className="mt-8 pt-8 border-t text-right">
          <p>Subtotal: {formatMoney(order.subtotal)}</p>
          <p>IVA (16%): {formatMoney(order.tax)}</p>
          <p>Total: {formatMoney(order.total)}</p>
          <p>Método: {paymentMethod}</p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          {order.shop_address && <div>Contacto: {order.shop_address}</div>}
          {order.shop_phone && <div>{order.shop_phone}</div>}
        </div>
      </div>

      {/* Close button (visible on screen, hidden on print) */}
      <button
        onClick={onClose}
        className="no-print fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 z-50"
      >
        Cerrar vista previa
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body > *:not(.receipt-print-container) {
            display: none !important;
          }
          .receipt-print-container {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            background: white !important;
            z-index: 999999 !important;
          }
          .receipt-print {
            font-family: monospace !important;
            font-size: 12pt !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}