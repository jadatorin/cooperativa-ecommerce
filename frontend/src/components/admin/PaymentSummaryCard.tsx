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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <LoadingSpinner size="sm" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <ErrorMessage message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{summary.total_orders}</p>
          <p className="text-sm text-muted-foreground">{formatPrice(summary.total_amount)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos Recibidos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">{summary.paid_count}</p>
          <p className="text-sm text-muted-foreground">{formatPrice(summary.paid_amount)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-yellow-600">{summary.pending_count}</p>
          <p className="text-sm text-muted-foreground">{formatPrice(summary.pending_amount)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatPrice(summary.total_tax)}</p>
          <p className="text-sm text-muted-foreground">Subtotal: {formatPrice(summary.total_subtotal)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
