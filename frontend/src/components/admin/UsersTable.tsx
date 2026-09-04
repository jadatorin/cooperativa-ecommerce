"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
} from "@/components/ui/table";
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
import { PaginationControls } from "./PaginationControls";
import type { AdminUser } from "@/types/admin";
import type { Pagination } from "@/types";

interface UsersTableProps {
  users: AdminUser[];
  pagination: Pagination | null;
  currentPage: number;
  loading: boolean;
  error: string | null;
  onUpdateRole: (userId: string, newRole: string) => void;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
  // Dialog state lifted from parent
  roleDialogOpen: boolean;
  onRoleDialogOpenChange: (open: boolean) => void;
  roleToUpdate: string | null;
  targetUserId: string | null;
  isUpdating: boolean;
  onConfirmRoleUpdate: () => void;
}

export function UsersTable({
  users,
  pagination,
  currentPage,
  loading,
  error,
  onUpdateRole,
  onPageChange,
  onRetry,
  roleDialogOpen,
  onRoleDialogOpenChange,
  roleToUpdate,
  targetUserId,
  isUpdating,
  onConfirmRoleUpdate,
}: UsersTableProps) {
  const openRoleDialog = (user: AdminUser) => {
    const newRole = user.role === "user" ? "admin" : "user";
    onUpdateRole(user.id, newRole);
  };

  if (loading) {
    return (
      <div className="py-12">
        <LoadingSpinner text="Cargando usuarios..." />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} />;
  }

  if (users.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No hay usuarios registrados
      </div>
    );
  }

  return (
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
        pagination={pagination}
        page={currentPage}
        onPageChange={onPageChange}
        loading={loading}
      />

      {/* Role Update AlertDialog */}
      <AlertDialog open={roleDialogOpen} onOpenChange={onRoleDialogOpenChange}>
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
            <AlertDialogAction onClick={onConfirmRoleUpdate} disabled={isUpdating}>
              {isUpdating ? "Actualizando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
