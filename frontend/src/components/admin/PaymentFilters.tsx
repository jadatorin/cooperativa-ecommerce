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
  "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

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
    <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Método de pago</label>
        <select
          value={local.payment_method}
          onChange={(e) => update({ payment_method: e.target.value })}
          className={cn(selectClass, "w-[160px]")}
        >
          <option value="">Todos</option>
          <option value="cash">Efectivo</option>
          <option value="card">Tarjeta</option>
          <option value="transfer">Transferencia</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Estado</label>
        <select
          value={local.status}
          onChange={(e) => update({ status: e.target.value })}
          className={cn(selectClass, "w-[140px]")}
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="confirmed">Confirmado</option>
          <option value="delivered">Entregado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Desde</label>
        <Input
          type="date"
          value={local.from}
          onChange={(e) => update({ from: e.target.value })}
          className="w-[160px]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Hasta</label>
        <Input
          type="date"
          value={local.to}
          onChange={(e) => update({ to: e.target.value })}
          className="w-[160px]"
        />
      </div>

      <Button onClick={apply} size="sm">
        Filtrar
      </Button>
      <Button onClick={reset} variant="outline" size="sm">
        Limpiar
      </Button>
      {onExport && (
        <Button onClick={onExport} variant="outline" size="sm" disabled={exporting}>
          {exporting ? "Exportando..." : "Exportar CSV"}
        </Button>
      )}
      {onExportPDF && (
        <Button onClick={onExportPDF} variant="outline" size="sm">
          Exportar PDF
        </Button>
      )}
    </div>
  );
}
