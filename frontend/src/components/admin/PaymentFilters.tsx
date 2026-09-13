"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PaymentFiltersState {
  payment_method: string;
  status: string;
  from: string;
  to: string;
}

interface PaymentFiltersProps {
  filters: PaymentFiltersState;
  onFilterChange: (filters: PaymentFiltersState) => void;
  onExport?: () => void;
  onExportPDF?: () => void;
  exporting?: boolean;
}

const EMPTY_FILTERS: PaymentFiltersState = {
  payment_method: "",
  status: "",
  from: "",
  to: "",
};

const selectClass =
  "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function PaymentFilters({
  filters,
  onFilterChange,
  onExport,
  onExportPDF,
  exporting,
}: PaymentFiltersProps) {
  const [local, setLocal] = useState<PaymentFiltersState>(filters);

  const apply = () => onFilterChange(local);

  const reset = () => {
    setLocal(EMPTY_FILTERS);
    onFilterChange(EMPTY_FILTERS);
  };

  const update = (patch: Partial<PaymentFiltersState>) => {
    setLocal((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/50 rounded-lg">
      <div className="flex flex-col gap-1 flex-1 min-w-[140px] sm:min-w-[160px]">
        <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Método de pago</label>
        <select
          value={local.payment_method}
          onChange={(e) => update({ payment_method: e.target.value })}
          className={cn(selectClass, "w-full")}
        >
          <option value="">Todos</option>
          <option value="cash">Efectivo</option>
          <option value="card">Tarjeta</option>
          <option value="transfer">Transferencia</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[140px] sm:min-w-[140px]">
        <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Estado</label>
        <select
          value={local.status}
          onChange={(e) => update({ status: e.target.value })}
          className={cn(selectClass, "w-full")}
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[140px] sm:min-w-[160px]">
        <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Desde</label>
        <Input
          type="date"
          value={local.from}
          onChange={(e) => update({ from: e.target.value })}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[140px] sm:min-w-[160px]">
        <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Hasta</label>
        <Input
          type="date"
          value={local.to}
          onChange={(e) => update({ to: e.target.value })}
          className="w-full"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={apply} size="sm" className="h-9 text-xs sm:text-sm">
          Filtrar
        </Button>
        <Button onClick={reset} variant="outline" size="sm" className="h-9 text-xs sm:text-sm">
          Limpiar
        </Button>
        {onExport && (
          <Button onClick={onExport} variant="outline" size="sm" className="h-9 text-xs sm:text-sm" disabled={exporting}>
            {exporting ? "Exportando..." : "CSV"}
          </Button>
        )}
        {onExportPDF && (
          <Button onClick={onExportPDF} variant="outline" size="sm" className="h-9 text-xs sm:text-sm">
            PDF
          </Button>
        )}
      </div>
    </div>
  );
}