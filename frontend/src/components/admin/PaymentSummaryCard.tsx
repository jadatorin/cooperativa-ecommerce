"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { formatPrice } from "@/lib/utils";
import type { PaymentSummary } from "@/types/admin";

interface PaymentSummaryCardProps {
  summary: PaymentSummary | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function PaymentSummaryCard({
  summary,
  loading,
  error,
  onRetry,
}: PaymentSummaryCardProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 sm:pt-6">
              <LoadingSpinner size="sm" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 sm:mb-6">
        <ErrorMessage message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <Card>
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 sm:pt-0">
          <p className="text-xl sm:text-3xl font-bold">{summary.total_orders}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{formatPrice(summary.total_amount)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Pagos Recibidos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 sm:pt-0">
          <p className="text-xl sm:text-3xl font-bold text-green-600">{summary.paid_count}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{formatPrice(summary.paid_amount)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Pendientes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 sm:pt-0">
          <p className="text-xl sm:text-3xl font-bold text-yellow-600">{summary.pending_count}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{formatPrice(summary.pending_amount)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 sm:pb-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Impuestos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 sm:pt-0">
          <p className="text-xl sm:text-3xl font-bold">{formatPrice(summary.total_tax)}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">Subtotal: {formatPrice(summary.total_subtotal)}</p>
        </CardContent>
      </Card>
    </div>
  );
}