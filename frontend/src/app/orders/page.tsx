"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
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
    <Badge variant="outline" className={styles}>
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

export default function OrdersPage() {
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
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mis órdenes</h1>

      {loading ? (
        <p className="text-muted-foreground">Cargando órdenes...</p>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No tienes órdenes aún</p>
            <p className="text-muted-foreground mb-4">
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
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedId === order.id;
              return (
                <Card key={order.id}>
                  <button
                    className="w-full text-left"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <CardTitle className="text-base">
                            Orden #{order.order_number || order.id.slice(0, 8)}
                          </CardTitle>
                          {statusBadge(order.status)}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold">{formatPrice(order.total)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {isExpanded && (
                    <CardContent>
                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-3">Detalle de la orden</h3>
                        {loadingDetails ? (
                          <p className="text-sm text-muted-foreground">Cargando detalles...</p>
                        ) : expandedOrder?.items && expandedOrder.items.length > 0 ? (
                          <div className="space-y-2">
                            {expandedOrder.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex justify-between text-sm py-2 border-b last:border-0"
                              >
                                <div>
                                  <span className="font-medium">
                                    {item.product_name || `Producto ${item.product_id.slice(0, 8)}`}
                                  </span>
                                  <span className="text-muted-foreground ml-2">
                                    × {item.quantity}
                                  </span>
                                </div>
                                <span>{formatPrice(item.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No hay detalles disponibles</p>
                        )}
                        {expandedOrder?.notes && (
                          <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                            <span className="font-medium">Notas:</span> {expandedOrder.notes}
                          </div>
                        )}
                        <div className="mt-3 flex justify-end font-bold text-lg">
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
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
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
