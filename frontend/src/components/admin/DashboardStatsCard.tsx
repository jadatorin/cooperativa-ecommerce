"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import type { DashboardStats } from "@/types/admin";

interface DashboardStatsCardProps {
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function DashboardStatsCard({
  stats,
  loading,
  error,
  onRetry,
}: DashboardStatsCardProps) {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.users}</p>
          <p className="text-sm text-muted-foreground">Registrados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.products}</p>
          <p className="text-sm text-muted-foreground">En catálogo</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{stats.orders}</p>
          <p className="text-sm text-muted-foreground">Procesados</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${stats.revenue.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Totales</p>
        </CardContent>
      </Card>
    </div>
  );
}
