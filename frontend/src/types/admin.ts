import { Pagination } from "./index";

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at?: string;
}

export interface AdminOrder {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  order_number?: number;
}

export interface DashboardStats {
  users: number;
  products: number;
  orders: number;
  revenue: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: Pagination;
}

export interface AdminOrdersResponse {
  orders: AdminOrder[];
  pagination: Pagination;
}

// ── Payment Reports ─────────────────────────────────────────────────────────

export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export interface PaymentReport {
  order_id: string;
  order_number: number;
  user_id: string;
  user_name?: string;
  user_email?: string;
  total: number;
  payment_method: PaymentMethod;
  status: string;
  created_at: string;
}

export interface PaymentSummary {
  total_orders: number;
  total_amount: number;
  total_subtotal: number;
  total_tax: number;
  paid_count: number;
  paid_amount: number;
  pending_count: number;
  pending_amount: number;
}

export interface PaymentReportResponse {
  payments: PaymentReport[];
  summary: PaymentSummary;
  pagination: Pagination;
}