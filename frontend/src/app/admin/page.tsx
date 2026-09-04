"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { fetchAdminUsers, fetchAdminOrders, updateUserRole, updateOrderStatus, fetchAdminDashboard, DashboardStats } from "@/lib/api";

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

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading, login, logout, token } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // TODOS los hooks ANTES de cualquier return
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || (user && user.role !== "admin"))) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, user, router]);

  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashboardStats, setDashboardStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 });
  const [usersPage, setUsersPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [roleToUpdate, setRoleToUpdate] = useState<string | null>(null);
  const [orderStatusToUpdate, setOrderStatusToUpdate] = useState<string | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch dashboard stats
  useEffect(() => {
    if (!token) return;
    fetchAdminDashboard(token)
      .then((stats) => setDashboardStats(stats))
      .catch((err) => console.error("Error fetching dashboard:", err));
  }, [token]);

  // Fetch users
  useEffect(() => {
    if (!token) return;
    fetchAdminUsers(token)
      .then((res) => setUsers(res.users))
      .catch((err) => console.error("Error fetching users:", err));
  }, [token]);

  // Fetch orders
  useEffect(() => {
    if (!token) return;
    fetchAdminOrders(token)
      .then((res) => setOrders(res.orders))
      .catch((err) => console.error("Error fetching orders:", err));
  }, [token]);

  // Loading state — DESPUÉS de todos los hooks
  if (isLoading) {
    return (
      <div className="min-h-80 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  // Update user role
  const handleUpdateRole = async () => {
    if (!targetUserId || !roleToUpdate) return;
    setIsUpdating(true);
    try {
      const res = await updateUserRole(token!, targetUserId, roleToUpdate);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, role: res.role } : u))
      );
      setRoleToUpdate(null);
      setTargetUserId(null);
    } catch (err) {
      console.error("Error updating user role:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async () => {
    if (!targetOrderId || !orderStatusToUpdate) return;
    setIsUpdating(true);
    try {
      const res = await updateOrderStatus(token!, targetOrderId, orderStatusToUpdate);
      setOrders((prev) =>
        prev.map((o) => (o.id === targetOrderId ? { ...o, status: res.status } : o))
      );
      setOrderStatusToUpdate(null);
      setTargetOrderId(null);
    } catch (err) {
      console.error("Error updating order status:", err);
    } finally {
      setIsUpdating(false);
    }
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

      {/* Users Management */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>
        
        {/* Users Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell className="text-right">Acciones</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-b">
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.full_name || "Sin nombre"}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.role === "admin"
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/10 text-secondary"
                    }`}
                  >
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {user.role !== "admin" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRoleToUpdate(user.role === "user" ? "admin" : "user");
                          setTargetUserId(user.id);
                        }}
                      >
                        {user.role === "user" ? "Hacer admin" : "Quitar admin"}
                      </Button>
                    </>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Role Update Modal / Form */}
        {roleToUpdate && targetUserId && (
          <div className="mt-4 p-4 border rounded-md">
            <h3 className="font-medium mb-2">Actualizar rol para {targetUserId}</h3>
            <select
              value={roleToUpdate}
              onChange={(e) => setRoleToUpdate(e.target.value)}
              className="border rounded px-3 py-2 mb-4"
            >
              <option value="user">Usuario</option>
              <option value="admin">Admin</option>
            </select>
            <Button size="sm" onClick={handleUpdateRole}>
              Actualizar
            </Button>
            <button
              onClick={() => {
                setRoleToUpdate(null);
                setTargetUserId(null);
              }}
              className="ml-2 text-sm hover:underline"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Orders Management */}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Gestión de Pedidos</h2>

        {/* Orders Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell className="text-right">Acciones</TableCell>
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
                      order.status === "completed"
                        ? "bg-primary/10 text-primary"
                        : order.status === "pending"
                        ? "bg-secondary/10 text-secondary"
                        : "bg-muted/10 text-muted"
                    }`}
                  >
                    {order.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {order.status !== "completed" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setOrderStatusToUpdate(order.status === "pending" ? "shipped" : "pending");
                          setTargetOrderId(order.id);
                        }}
                      >
                        {order.status === "pending" ? "Enviar" : "Cancelar"}
                      </Button>
                    </>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Order Status Update Modal / Form */}
        {orderStatusToUpdate && targetOrderId && (
          <div className="mt-4 p-4 border rounded-md">
            <h3 className="font-medium mb-2">Actualizar estado para pedido {targetOrderId}</h3>
            <select
              value={orderStatusToUpdate}
              onChange={(e) => setOrderStatusToUpdate(e.target.value)}
              className="border rounded px-3 py-2 mb-4"
            >
              <option value="pending">Pendiente</option>
              <option value="shipped">Enviado</option>
              <option value="completed">Completado</option>
            </select>
            <Button size="sm" onClick={handleUpdateOrderStatus}>
              Actualizar
            </Button>
            <button
              onClick={() => {
                setOrderStatusToUpdate(null);
                setTargetOrderId(null);
              }}
              className="ml-2 text-sm hover:underline"
              >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}