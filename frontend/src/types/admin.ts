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