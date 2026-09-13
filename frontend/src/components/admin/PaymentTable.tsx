"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { PaginationControls } from "./PaginationControls";
import { formatPrice } from "@/lib/utils";
import type { PaymentReport, PaymentMethod } from "@/types/admin";
import type { Pagination } from "@/types";

interface PaymentTableProps {
  payments: PaymentReport[];
  pagination: Pagination | null;
  currentPage: number;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

const METHOD_BADGE: Record<PaymentMethod, string> = {
  cash: "bg-green-100 text-green-800",
  card: "bg-blue-100 text-blue-800",
  transfer: "bg-purple-100 text-purple-800",
  other: "bg-gray-100 text-gray-800",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  partial: "bg-blue-100 text-blue-800",
  refunded: "bg-orange-100 text-orange-800",
  failed: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  partial: "Parcial",
  refunded: "Reembolsado",
  failed: "Fallido",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PaymentTable({
  payments,
  pagination,
  currentPage,
  loading,
  error,
  onPageChange,
  onRetry,
}: PaymentTableProps) {
  if (loading) {
    return (
      <div className="py-8 sm:py-12">
        <LoadingSpinner text="Cargando pagos..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (payments.length === 0) {
    return (
      <div className="py-8 sm:py-12 text-center text-sm sm:text-base text-muted-foreground">
        No hay registros de pagos
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.order_id} className="border-b">
                <TableCell className="font-medium">#{p.order_number}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm">{p.user_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{p.user_email || ""}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${METHOD_BADGE[p.payment_method] || ""}`}
                  >
                    {METHOD_LABELS[p.payment_method] || p.payment_method}
                  </span>
                </TableCell>
                <TableCell className="font-medium">{formatPrice(p.total)}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${STATUS_BADGE[p.status] || "bg-gray-100 text-gray-800"}`}
                  >
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(p.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {payments.map((p) => (
          <Card key={p.order_id}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-sm">#{p.order_number}</p>
                  <p className="text-xs text-muted-foreground">{p.user_name || "—"}</p>
                </div>
                <p className="font-bold text-sm">{formatPrice(p.total)}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${METHOD_BADGE[p.payment_method] || ""}`}
                >
                  {METHOD_LABELS[p.payment_method] || p.payment_method}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] sm:text-xs ${STATUS_BADGE[p.status] || "bg-gray-100 text-gray-800"}`}
                >
                  {STATUS_LABELS[p.status] || p.status}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground ml-auto">
                  {formatDate(p.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PaginationControls
        pagination={pagination}
        page={currentPage}
        onPageChange={onPageChange}
        loading={loading}
      />
    </>
  );
}