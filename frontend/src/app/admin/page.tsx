"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { DashboardStatsCard } from "@/components/admin/DashboardStatsCard";
import { UsersTable } from "@/components/admin/UsersTable";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { useToast } from "@/components/ui/toast";
import {
  fetchAdminUsers,
  fetchAdminOrders,
  updateUserRole,
  updateOrderStatus,
  fetchAdminDashboard,
} from "@/lib/api";
import { AdminUser, AdminOrder, DashboardStats } from "@/types/admin";
import { Pagination } from "@/types";

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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0,
  });
  const [usersPage, setUsersPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);
  const [ordersPagination, setOrdersPagination] = useState<Pagination | null>(null);

  // ── Loading & error state ────────────────────────────────────────────
  const [loadingStates, setLoadingStates] = useState({
    dashboard: true,
    users: true,
    orders: true,
  });
  const [errors, setErrors] = useState<{
    dashboard: string | null;
    users: string | null;
    orders: string | null;
  }>({
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

  // ── AbortController refs for fetch cleanup ──────────────────────────
  const dashboardAbortRef = useRef<AbortController | null>(null);
  const usersAbortRef = useRef<AbortController | null>(null);
  const ordersAbortRef = useRef<AbortController | null>(null);

  // ── AlertDialog state ────────────────────────────────────────────────
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // ── Fetch: Dashboard ─────────────────────────────────────────────────
  const loadDashboard = async () => {
    if (!token) return;
    dashboardAbortRef.current?.abort();
    const controller = new AbortController();
    dashboardAbortRef.current = controller;
    setLoadingStates((s) => ({ ...s, dashboard: true }));
    setErrors((s) => ({ ...s, dashboard: null }));
    try {
      const stats = await fetchAdminDashboard(token);
      if (!controller.signal.aborted) {
        setDashboardStats(stats);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setErrors((s) => ({ ...s, dashboard: "Error al cargar las estadísticas del dashboard" }));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingStates((s) => ({ ...s, dashboard: false }));
      }
    }
  };

  // ── Fetch: Users ─────────────────────────────────────────────────────
  const loadUsers = async (page: number) => {
    if (!token) return;
    usersAbortRef.current?.abort();
    const controller = new AbortController();
    usersAbortRef.current = controller;
    setLoadingStates((s) => ({ ...s, users: true }));
    setErrors((s) => ({ ...s, users: null }));
    try {
      const res = await fetchAdminUsers(token, page);
      if (!controller.signal.aborted) {
        setUsers(res.users);
        setUsersPagination(res.pagination);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setErrors((s) => ({ ...s, users: "Error al cargar los usuarios" }));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingStates((s) => ({ ...s, users: false }));
      }
    }
  };

  // ── Fetch: Orders ────────────────────────────────────────────────────
  const loadOrders = async (page: number) => {
    if (!token) return;
    ordersAbortRef.current?.abort();
    const controller = new AbortController();
    ordersAbortRef.current = controller;
    setLoadingStates((s) => ({ ...s, orders: true }));
    setErrors((s) => ({ ...s, orders: null }));
    try {
      const res = await fetchAdminOrders(token, page);
      if (!controller.signal.aborted) {
        setOrders(res.orders);
        setOrdersPagination(res.pagination);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setErrors((s) => ({ ...s, orders: "Error al cargar los pedidos" }));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingStates((s) => ({ ...s, orders: false }));
      }
    }
  };

  // ── Initial fetches ──────────────────────────────────────────────────
  useEffect(() => {
    loadDashboard();
    loadUsers(1);
    loadOrders(1);
  }, [token]);

  // ── AbortController cleanup on unmount ──────────────────────────────
  useEffect(() => {
    return () => {
      dashboardAbortRef.current?.abort();
      usersAbortRef.current?.abort();
      ordersAbortRef.current?.abort();
    };
  }, []);

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
      const message = err instanceof Error ? err.message : "Error desconocido";
      addToast(`Error al actualizar el rol: ${message}`, "error");
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
      const message = err instanceof Error ? err.message : "Error desconocido";
      addToast(`Error al actualizar el estado: ${message}`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Callbacks for child components ───────────────────────────────────
  const handleUsersUpdateRole = (userId: string, newRole: string) => {
    setRoleToUpdate(newRole);
    setTargetUserId(userId);
    setRoleDialogOpen(true);
  };

  const handleOrdersUpdateStatus = (orderId: string, newStatus: string) => {
    setOrderStatusToUpdate(newStatus);
    setTargetOrderId(orderId);
    setStatusDialogOpen(true);
  };

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
      <DashboardStatsCard
        stats={dashboardStats}
        loading={loadingStates.dashboard}
        error={errors.dashboard}
        onRetry={loadDashboard}
      />

      {/* Users Management */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
        <UsersTable
          users={users}
          pagination={usersPagination}
          currentPage={usersPage}
          loading={loadingStates.users}
          error={errors.users}
          onUpdateRole={handleUsersUpdateRole}
          onPageChange={setUsersPage}
          onRetry={() => loadUsers(usersPage)}
          roleDialogOpen={roleDialogOpen}
          onRoleDialogOpenChange={setRoleDialogOpen}
          roleToUpdate={roleToUpdate}
          targetUserId={targetUserId}
          isUpdating={isUpdating}
          onConfirmRoleUpdate={handleUpdateRole}
        />
      </div>

      {/* Orders Management */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Gestión de Pedidos</h2>
        <OrdersTable
          orders={orders}
          pagination={ordersPagination}
          currentPage={ordersPage}
          loading={loadingStates.orders}
          error={errors.orders}
          onUpdateStatus={handleOrdersUpdateStatus}
          onPageChange={setOrdersPage}
          onRetry={() => loadOrders(ordersPage)}
          statusDialogOpen={statusDialogOpen}
          onStatusDialogOpenChange={setStatusDialogOpen}
          orderStatusToUpdate={orderStatusToUpdate}
          targetOrderId={targetOrderId}
          isUpdating={isUpdating}
          onConfirmStatusUpdate={handleUpdateOrderStatus}
        />
      </div>
    </div>
  );
}
