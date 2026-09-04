"use client";

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
import type { AdminOrder } from "@/types/admin";
import type { Pagination } from "@/types";

interface OrdersTableProps {
  orders: AdminOrder[];
  pagination: Pagination | null;
  currentPage: number;
  loading: boolean;
  error: string | null;
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
  const openStatusDialog = (order: AdminOrder) => {
    const nextStatus = STATUS_NEXT[order.status] || "pending";
    onUpdateStatus(order.id, nextStatus);
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
    </>
  );
}
