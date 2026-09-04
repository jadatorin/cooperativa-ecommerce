"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { Pagination } from "@/types";

interface PaginationControlsProps {
  pagination: Pagination | null;
  page: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}

function PaginationControlsInner({
  pagination,
  page,
  onPageChange,
  loading,
}: PaginationControlsProps) {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-muted-foreground">
        Página {pagination.page} de {pagination.totalPages} ({pagination.total} resultados)
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          Anterior
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= pagination.totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          aria-label="Página siguiente"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

export const PaginationControls = React.memo(PaginationControlsInner);
