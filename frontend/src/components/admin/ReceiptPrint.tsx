"use client";

import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

function ReceiptContent({ order, onClose }: { order: ReceiptPrintProps["order"]; onClose?: () => void }) {
  const formattedDate = new Date(order.date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatMoney = (amount: number) => `$${Number(amount).toFixed(2)}`;
  const paymentMethod = order.payment_method || "No especificado";

  const truncateProductName = (name: string | undefined) => {
    if (!name) return "-";
    if (name.length <= 30) return name;
    return name.substring(0, 27) + "...";
  };

  const items = order.items;
  const shopName = order.shop_name || "Cooperativa 5 de Julio";

  const handlePrint = () => {
    // Inject print styles
    const existingStyle = document.getElementById("receipt-print-styles");
    if (existingStyle) existingStyle.remove();

    const style = document.createElement("style");
    style.id = "receipt-print-styles";
    style.textContent = `
      @media print {
        body > * {
          display: none !important;
        }
        #receipt-print-root {
          display: block !important;
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: 80mm !important;
          background: white !important;
          z-index: 999999 !important;
          padding: 4mm !important;
          font-family: 'Courier New', monospace !important;
          font-size: 12pt !important;
          color: black !important;
        }
        #receipt-print-root * {
          visibility: visible !important;
        }
        .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    window.print();

    const handleAfterPrint = () => {
      style.remove();
      window.removeEventListener("afterprint", handleAfterPrint);
      onClose?.();
      // Set focus back to the close button for accessibility
      const closeBtn = document.querySelector('.no-print .bg-gray-800') as HTMLButtonElement;
      closeBtn?.focus();
    };
    window.addEventListener("afterprint", handleAfterPrint);
  };

  return (
    <div
      id="receipt-print-root"
      className="fixed inset-0 z-50 bg-white"
      style={{ overflow: "auto" }}
    >
      {/* Action buttons — hidden on print */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-medium"
        >
          🖨️ Imprimir
        </button>
        <button
          onClick={onClose}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Cerrar
        </button>
      </div>

      {/* Receipt content */}
      <div style={{ maxWidth: "80mm", margin: "0 auto", padding: "4mm" }}>
        {/* Shop name */}
        <div style={{ textAlign: "center", marginBottom: "6mm" }}>
          <h1 style={{ fontSize: "16pt", fontWeight: "bold", margin: 0 }}>{shopName}</h1>
          {order.shop_address && <p style={{ fontSize: "10pt", color: "#666", margin: "2mm 0 0" }}>{order.shop_address}</p>}
          {order.shop_phone && <p style={{ fontSize: "9pt", color: "#666", margin: "1mm 0 0" }}>{order.shop_phone}</p>}
        </div>

        {/* Order info */}
        <div style={{ marginBottom: "6mm" }}>
          <p style={{ margin: "1mm 0" }}>Número: {order.order_number}</p>
          <p style={{ margin: "1mm 0" }}>Fecha: {formattedDate}</p>
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
              {items.map((item, idx) => (
                <TableRow key={idx} className="border-b">
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
          <p style={{ textAlign: "center", color: "#999" }}>No hay items en este pedido</p>
        )}

        {/* Totals */}
        <div style={{ marginTop: "8mm", paddingTop: "4mm", borderTop: "1px solid #ccc", textAlign: "right" }}>
          <p style={{ margin: "1mm 0" }}>Subtotal: {formatMoney(order.subtotal)}</p>
          <p style={{ margin: "1mm 0" }}>IVA (16%): {formatMoney(order.tax)}</p>
          <p style={{ margin: "1mm 0", fontWeight: "bold" }}>Total: {formatMoney(order.total)}</p>
          <p style={{ margin: "1mm 0" }}>Método: {paymentMethod}</p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "8mm", textAlign: "center", fontSize: "8pt", color: "#999" }}>
          {order.shop_address && <div>Contacto: {order.shop_address}</div>}
          {order.shop_phone && <div>{order.shop_phone}</div>}
        </div>
      </div>
    </div>
  );
}

export function ReceiptPrint(props: ReceiptPrintProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Render directly into <body> so it's a direct child — CSS body > * can target it
  return createPortal(
    <ReceiptContent order={props.order} onClose={props.onClose} />,
    document.body
  );
}
