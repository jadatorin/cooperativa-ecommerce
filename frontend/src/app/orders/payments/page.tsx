"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getUserPaymentReport } from "@/lib/api";
import { PaymentSummaryCard } from "@/components/admin/PaymentSummaryCard";
import { PaymentFilters, type PaymentFiltersState } from "@/components/admin/PaymentFilters";
import { PaymentTable } from "@/components/admin/PaymentTable";
import type { PaymentReport, PaymentSummary } from "@/types/admin";
import type { Pagination } from "@/types";

export default function UserPaymentsPage() {
  const { token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [payments, setPayments] = useState<PaymentReport[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentFiltersState>({
    payment_method: "",
    status: "",
    from: "",
    to: "",
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getUserPaymentReport(token, {
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

  const handleExportPDF = () => {
    window.print();
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mis pagos</h1>

      <PaymentSummaryCard
        summary={summary}
        loading={loading && !payments.length}
        error={null}
      />

      <PaymentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onExportPDF={handleExportPDF}
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
