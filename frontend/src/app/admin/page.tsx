"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell, TableHead, TableBody } from "@/components/ui/table";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast";
import {
  fetchAdminUsers,
  fetchAdminOrders,
  updateUserRole,
  updateOrderStatus,
  fetchAdminDashboard,
  DashboardStats,
} from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  order_number?: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading, login, logout, token } = useAuth();
  const router = useRouter();
  const { addToast } = useToast();
  const [mounted, setMounted] = useState(false);

  // ── Mount check ──────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || (user && user.role !== "admin"))) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, user, router]);

  // ── Data state ───────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashboardStats, setDashboardStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [usersPage, setUsersPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);
  const [ordersPagination, setOrdersPagination] = useState<Pagination | null>(null);

  // ── Loading & error state ────────────────────────────────────────────
  const [loadingStates, setLoadingStates] = useState({ dashboard: true, users: true, orders: true });
  const [errors, setErrors] = useState<{ dashboard: string | null; users: string | null; orders: string | null }>({
    dashboard: null,
    users: null,
    orders: null,
  });

  // ── Mutation state ───────────────────────────────────────────────────
  const [roleToUpdate, setRoleToUpdate] = useState<string | null>(null);
  const [orderStatusToUpdate, setOrderStatusToUpdate] = useState<string | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // ── AlertDialog state ────────────────────────────────────────────────
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // ── Fetch: Dashboard ─────────────────────────────────────────────────
  const loadDashboard = async () => {
    if (!token) return;
    setLoadingStates((s) => ({ ...s, dashboard: true }));
    setErrors((s) => ({ ...s, dashboard: null }));
    try {
      const stats = await fetchAdminDashboard(token);
      setDashboardStats(stats);
    } catch (err) {
      setErrors((s) => ({ ...s, dashboard: "Error al cargar las estadísticas del dashboard" }));
    } finally {
      setLoadingStates((s) => ({ ...s, dashboard: false }));
    }
  };

  // ── Fetch: Users ─────────────────────────────────────────────────────
  const loadUsers = async (page: number) => {
    if (!token) return;
    setLoadingStates((s) => ({ ...s, users: true }));
    setErrors((s) => ({ ...s, users: null }));
    try {
      const res = await fetchAdminUsers(token, page);
      setUsers(res.users);
      setUsersPagination(res.pagination);
    } catch (err) {
      setErrors((s) => ({ ...s, users: "Error al cargar los usuarios" }));
    } finally {
      setLoadingStates((s) => ({ ...s, users: false }));
    }
  };

  // ── Fetch: Orders ────────────────────────────────────────────────────
  const loadOrders = async (page: number) => {
    if (!token) return;
    setLoadingStates((s) => ({ ...s, orders: true }));
    setErrors((s) => ({ ...s, orders: null }));
    try {
      const res = await fetchAdminOrders(token, page);
      setOrders(res.orders);
      setOrdersPagination(res.pagination);
    } catch (err) {
      setErrors((s) => ({ ...s, orders: "Error al cargar los pedidos" }));
    } finally {
      setLoadingStates((s) => ({ ...s, orders: false }));
    }
  };

  // ── Initial fetches ──────────────────────────────────────────────────
  useEffect(() => {
    loadDashboard();
    loadUsers(1);
    loadOrders(1);
  }, [token]);

  // ── Re-fetch on page change ──────────────────────────────────────────
  useEffect(() => {
    if (!loadingStates.users && usersPage > 1) loadUsers(usersPage);
  }, [usersPage]);

  useEffect(() => {
    if (!loadingStates.orders && ordersPage > 1) loadOrders(ordersPage);
  }, [ordersPage]);

  // ── Loading guard ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-80 flex items-center justify-center">
        <LoadingSpinner text="Cargando..." />
      </div>
    );
  }

  // ── Update user role ─────────────────────────────────────────────────
  const handleUpdateRole = async () => {
    if (!targetUserId || !roleToUpdate) return;
    setIsUpdating(true);
    try {
      const res = await updateUserRole(token!, targetUserId, roleToUpdate);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: res.role } : u))
      );
      addToast("Rol actualizado correctamente");
      setRoleToUpdate(null);
      setTargetUserId(null);
    } catch (err) {
      addToast("Error al actualizar el rol", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Update order status ──────────────────────────────────────────────
  const handleUpdateOrderStatus = async () => {
    if (!targetOrderId || !orderStatusToUpdate) return;
    setIsUpdating(true);
    try {
      const res = await updateOrderStatus(token!, targetOrderId, orderStatusToUpdate);
      setOrders((prev) =>
        prev.map((o) => (o.id === targetOrderId ? { ...o, status: res.status } : o))
      );
      addToast("Estado actualizado correctamente");
      setOrderStatusToUpdate(null);
      setTargetOrderId(null);
    } catch (err) {
      addToast("Error al actualizar el estado", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Role dialog helpers ──────────────────────────────────────────────
  const openRoleDialog = (userItem: User) => {
    const newRole = userItem.role === "user" ? "admin" : "user";
    setRoleToUpdate(newRole);
    setTargetUserId(userItem.id);
    setRoleDialogOpen(true);
  };

  const openStatusDialog = (order: Order) => {
    const nextStatus: Record<string, string> = {
      pending: "confirmed",
      confirmed: "processing",
      processing: "ready",
      ready: "delivered",
    };
    setOrderStatusToUpdate(nextStatus[order.status] || "pending");
    setTargetOrderId(order.id);
    setStatusDialogOpen(true);
  };

  // ── Pagination controls ──────────────────────────────────────────────
  function PaginationControls({
    pagination,
    page,
    setPage,
    loading,
  }: {
    pagination: Pagination | null;
    page: number;
    setPage: (p: number) => void;
    loading: boolean;
  }) {
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
            onClick={() => setPage(page - 1)}
            aria-label="Página anterior"
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => setPage(page + 1)}
            aria-label="Página siguiente"
          >
            Siguiente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">Bienvenido, {user?.full_name || "Admin"}</p>
        <button
          onClick={() => logout()}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Dashboard Stats */}
      {loadingStates.dashboard ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <LoadingSpinner size="sm" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : errors.dashboard ? (
        <div className="mb-6">
          <ErrorMessage message={errors.dashboard} onRetry={loadDashboard} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dashboardStats.users}</p>
              <p className="text-sm text-muted-foreground">Registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dashboardStats.products}</p>
              <p className="text-sm text-muted-foreground">En catálogo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pedidos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{dashboardStats.orders}</p>
              <p className="text-sm text-muted-foreground">Procesados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">${dashboardStats.revenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Totales</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Management */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>

        {loadingStates.users ? (
          <div className="py-12">
            <LoadingSpinner text="Cargando usuarios..." />
          </div>
        ) : errors.users ? (
          <ErrorMessage message={errors.users} onRetry={() => loadUsers(usersPage)} />
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No hay usuarios registrados
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-b">
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.full_name || "Sin nombre"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          u.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {u.role !== "admin" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openRoleDialog(u)}
                          aria-label={`Cambiar rol de ${u.full_name || u.email}`}
                        >
                          Hacer admin
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              pagination={usersPagination}
              page={usersPage}
              setPage={setUsersPage}
              loading={loadingStates.users}
            />
          </>
        )}
      </div>

      {/* Orders Management */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Gestión de Pedidos</h2>

        {loadingStates.orders ? (
          <div className="py-12">
            <LoadingSpinner text="Cargando pedidos..." />
          </div>
        ) : errors.orders ? (
          <ErrorMessage message={errors.orders} onRetry={() => loadOrders(ordersPage)} />
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No hay pedidos
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-b">
                    <TableCell>{order.order_number || order.id}</TableCell>
                    <TableCell>{order.user_id}</TableCell>
                    <TableCell>${order.total}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status !== "delivered" && order.status !== "cancelled" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openStatusDialog(order)}
                          aria-label={`Actualizar estado del pedido ${order.order_number || order.id}`}
                        >
                          {order.status === "pending" ? "Confirmar" : "Avanzar estado"}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationControls
              pagination={ordersPagination}
              page={ordersPage}
              setPage={setOrdersPage}
              loading={loadingStates.orders}
            />
          </>
        )}
      </div>

      {/* ── Role Update AlertDialog ───────────────────────────────────── */}
      <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Actualizar rol de usuario</AlertDialogTitle>
            <AlertDialogDescription>
              {roleToUpdate === "admin"
                ? "¿Estás seguro de que quieres hacer admin a este usuario?"
                : "¿Estás seguro de que quieres quitar el rol de admin a este usuario?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateRole} disabled={isUpdating}>
              {isUpdating ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Order Status Update AlertDialog ───────────────────────────── */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Actualizar estado del pedido</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cambiar el estado a{" "}
              <strong>{orderStatusToUpdate}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateOrderStatus} disabled={isUpdating}>
              {isUpdating ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
