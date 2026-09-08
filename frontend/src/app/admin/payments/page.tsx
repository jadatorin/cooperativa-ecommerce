"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { getAdminPaymentReport, exportAdminPaymentReport } from "@/lib/api";
import { PaymentSummaryCard } from "@/components/admin/PaymentSummaryCard";
import { PaymentFilters, type PaymentFiltersState } from "@/components/admin/PaymentFilters";
import { PaymentTable } from "@/components/admin/PaymentTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { PaymentReport, PaymentSummary } from "@/types/admin";
import type { Pagination } from "@/types";

export default function AdminPaymentsPage() {
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();

  const [payments, setPayments] = useState<PaymentReport[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<PaymentFiltersState>({
    payment_method: "",
    status: "",
    from: "",
    to: "",
  });

  // Auth + role guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
    if (!isLoading && isAuthenticated && user?.role !== "admin") {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminPaymentReport(token, {
        page,
        limit: 10,
        payment_method: filters.payment_method || undefined,
        payment_status: filters.status || undefined,
        start_date: filters.from || undefined,
        end_date: filters.to || undefined,
      });
      setPayments(res.payments);
      setSummary(res.summary);
      setPagination(res.pagination);
    } catch {
      setError("Error al cargar los pagos");
      setPayments([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [token, page, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (newFilters: PaymentFiltersState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const blob = await exportAdminPaymentReport(token, {
        payment_method: filters.payment_method || undefined,
        payment_status: filters.status || undefined,
        start_date: filters.from || undefined,
        end_date: filters.to || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pagos-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("Exportación completada");
    } catch {
      addToast("Error al exportar pagos", "error");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Reporte de Pagos</h1>
          <p className="text-sm text-muted-foreground">
            Vista general de todos los pagos registrados
          </p>
        </div>
      </div>

      <PaymentSummaryCard
        summary={summary}
        loading={loading && !payments.length}
        error={null}
      />

      <PaymentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        onExportPDF={handleExportPDF}
        exporting={exporting}
      />

      <PaymentTable
        payments={payments}
        pagination={pagination}
        currentPage={page}
        loading={loading}
        error={error}
        onPageChange={setPage}
        onRetry={fetchData}
      />
    </div>
  );
}
