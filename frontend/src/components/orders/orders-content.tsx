"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, ChevronDown, ChevronUp, ShoppingBag, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { fetchOrders, fetchOrder, Order } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

function statusBadge(status: string) {
  const styles = STATUS_STYLES[status] || "";
  const label = STATUS_LABELS[status] || status;
  return (
    <Badge variant="outline" className={`text-[10px] sm:text-xs ${styles}`}>
      {label}
    </Badge>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-VE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrdersContent() {
  const { token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<Order | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchOrders(token, page, 10)
      .then((res) => {
        setOrders(res.orders);
        setTotalPages(res.pagination.totalPages);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token, page]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedOrder(null);
      return;
    }
    setExpandedId(id);
    setLoadingDetails(true);
    try {
      const order = await fetchOrder(token!, id);
      setExpandedOrder(order);
    } catch {
      setExpandedOrder(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 sm:py-16 text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Mobile: Stack | Desktop: Side by side */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Mis órdenes</h1>
        <Link href="/orders/payments">
          <Button variant="outline" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 mr-1.5 sm:mr-2" />
            Mis pagos
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm sm:text-base">Cargando órdenes...</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-base sm:text-lg font-medium mb-2">No tienes órdenes aún</p>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Cuando realices tu primera compra, aparecerá aquí.
            </p>
            <Link href="/products">
              <Button>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Ver productos
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              return (
                <Card key={order.id}>
                  <button
                    className="w-full text-left"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <CardHeader className="pb-2 sm:pb-3">
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                          <CardTitle className="text-sm sm:text-base">
                            Orden #{order.order_number || order.id.slice(0, 8)}
                          </CardTitle>
                          {statusBadge(order.status)}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <div className="text-right">
                            <p className="font-bold text-sm sm:text-base">{formatPrice(order.total)}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="border-t pt-3 sm:pt-4">
                        <h3 className="font-medium text-sm sm:text-base mb-2 sm:mb-3">Detalle de la orden</h3>
                        {loadingDetails ? (
                          <p className="text-xs sm:text-sm text-muted-foreground">Cargando detalles...</p>
                        ) : expandedOrder?.items && expandedOrder.items.length > 0 ? (
                          <div className="space-y-1.5 sm:space-y-2">
                            {expandedOrder.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between text-xs sm:text-sm py-1.5 sm:py-2 border-b last:border-0"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium line-clamp-1">
                                    {item.product_name || `Producto ${item.product_id.slice(0, 8)}`}
                                  </span>
                                  <span className="text-muted-foreground ml-1 sm:ml-2">
                                    × {item.quantity}
                                  </span>
                                </div>
                                <span className="flex-shrink-0 ml-2">{formatPrice(item.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground">No hay detalles disponibles</p>
                        )}
                        {expandedOrder?.notes && (
                          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-muted rounded-lg text-xs sm:text-sm">
                            <span className="font-medium">Notas:</span> {expandedOrder.notes}
                          </div>
                        )}
                        <div className="mt-2 sm:mt-3 flex justify-end font-bold text-base sm:text-lg">
                          Total: {formatPrice(order.total)}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <span className="flex items-center px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}