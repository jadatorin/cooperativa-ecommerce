"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { PaginationControls } from "./PaginationControls";
import { ReceiptPrint } from "./ReceiptPrint";
import { fetchAdminOrderDetail, type OrderDetail } from "@/lib/api";
import type { AdminOrder } from "@/types/admin";
import type { Pagination } from "@/types";

interface OrdersTableProps {
  orders: AdminOrder[];
  pagination: Pagination | null;
  currentPage: number;
  loading: boolean;
  error: string | null;
  token: string;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
  // Dialog state lifted from parent
  statusDialogOpen: boolean;
  onStatusDialogOpenChange: (open: boolean) => void;
  orderStatusToUpdate: string | null;
  targetOrderId: string | null;
  isUpdating: boolean;
  onConfirmStatusUpdate: () => void;
}

const STATUS_NEXT: Record<string, string> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "ready",
  ready: "delivered",
};

export function OrdersTable({
  orders,
  pagination,
  currentPage,
  loading,
  error,
  token,
  onUpdateStatus,
  onPageChange,
  onRetry,
  statusDialogOpen,
  onStatusDialogOpenChange,
  orderStatusToUpdate,
  targetOrderId,
  isUpdating,
  onConfirmStatusUpdate,
}: OrdersTableProps) {
  const [orderToPrint, setOrderToPrint] = useState<OrderDetail | null>(null);
  const [loadingPrint, setLoadingPrint] = useState(false);

  const openStatusDialog = (order: AdminOrder) => {
    const nextStatus = STATUS_NEXT[order.status] || "pending";
    onUpdateStatus(order.id, nextStatus);
  };

  const handlePrint = async (order: AdminOrder) => {
    setLoadingPrint(true);
    try {
      const detail = await fetchAdminOrderDetail(token, order.id);
      setOrderToPrint(detail);
    } catch {
      alert("Error al cargar los detalles del pedido para imprimir");
    } finally {
      setLoadingPrint(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner text="Cargando pedidos..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (orders.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No hay pedidos
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="border-b">
              <TableCell>{order.order_number || order.id}</TableCell>
              <TableCell>{order.user_id}</TableCell>
              <TableCell>${order.total}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    order.status === "delivered"
                      ? "bg-green-100 text-green-800"
                      : order.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : order.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {order.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrint(order)}
                    disabled={loadingPrint}
                    aria-label={`Imprimir pedido ${order.order_number || order.id}`}
                  >
                    {loadingPrint ? "Cargando..." : "🖨️ Imprimir"}
                  </Button>
                  {order.status !== "delivered" && order.status !== "cancelled" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openStatusDialog(order)}
                      aria-label={`Actualizar estado del pedido ${order.order_number || order.id}`}
                    >
                      {order.status === "pending" ? "Confirmar" : "Avanzar estado"}
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PaginationControls
        pagination={pagination}
        page={currentPage}
        onPageChange={onPageChange}
        loading={loading}
      />

      {/* Order Status Update AlertDialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={onStatusDialogOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Actualizar estado del pedido</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cambiar el estado a{" "}
              <strong>{orderStatusToUpdate}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmStatusUpdate} disabled={isUpdating}>
              {isUpdating ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receipt Print */}
      {orderToPrint && (() => {
        const subtotal = orderToPrint.subtotal || orderToPrint.total / 1.16;
        const tax = orderToPrint.tax || orderToPrint.total - subtotal;
        return (
          <ReceiptPrint
            order={{
              order_number: orderToPrint.order_number,
              date: orderToPrint.date || orderToPrint.created_at,
              items: orderToPrint.items || [],
              total: orderToPrint.total,
              tax: tax,
              subtotal: subtotal,
              total_paid: orderToPrint.total_paid || orderToPrint.total,
              payment_method: orderToPrint.payment_method || "Efectivo",
              customer_name: orderToPrint.customer_name || orderToPrint.customer_email,
            }}
            onClose={() => setOrderToPrint(null)}
          />
        );
      })()}
    </>
  );
}
