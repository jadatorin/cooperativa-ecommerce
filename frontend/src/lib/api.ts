import { Product, Category, DollarRate, PaginatedResponse, Cart, CartItem, AuthResponse, UserProfile, Pagination } from "@/types";
import { AdminUser, AdminOrder, DashboardStats, AdminUsersResponse, AdminOrdersResponse } from "@/types/admin";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/+$/, "");

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}/api${endpoint}`, {
    cache: "no-store",
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

// ── Products ────────────────────────────────────────────────────────────────

export async function fetchProducts(
  params?: { page?: number; limit?: number; category?: string; search?: string }
): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);

  const qs = searchParams.toString();
  return fetchAPI<PaginatedResponse<Product>>(`/products${qs ? `?${qs}` : ""}`);
}

export async function fetchProduct(id: string): Promise<Product> {
  return fetchAPI<Product>(`/products/${id}`);
}

export async function fetchCategories(): Promise<Category[]> {
  return fetchAPI<Category[]>(`/categories`);
}

export async function fetchDollarRate(): Promise<DollarRate> {
  return fetchAPI<DollarRate>(`/dollar-rate`);
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function fetchProfile(token: string): Promise<UserProfile> {
  return fetchAPI<UserProfile>("/auth/profile", {
    headers: authHeaders(token),
  });
}

// ── Cart ────────────────────────────────────────────────────────────────────

export async function fetchCart(token: string): Promise<Cart> {
  return fetchAPI<Cart>("/cart", {
    headers: authHeaders(token),
  });
}

export async function addToCart(
  token: string,
  productId: string,
  quantity?: number
): Promise<CartItem> {
  return fetchAPI<CartItem>("/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItem(
  token: string,
  itemId: string,
  quantity: number
): Promise<CartItem> {
  return fetchAPI<CartItem>(`/cart/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ quantity }),
  });
}

export async function removeFromCart(token: string, itemId: string): Promise<void> {
  await fetchAPI(`/cart/items/${itemId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export async function clearCart(token: string): Promise<void> {
  await fetchAPI("/cart", {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

// ── Orders ────────────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  notes?: string;
  status: string;
  created_at: string;
  order_number?: number;
  items?: OrderItem[];
}

export interface OrderResponse {
  message: string;
  order: {
    id: string;
    order_number: number;
    total: number;
    status: string;
  };
}

export interface OrderDetail {
  id: string;
  order_number: number;
  date: string;
  items: OrderItem[];
  total: number;
  tax: number;
  subtotal: number;
  total_paid: number;
  payment_method: string;
  customer_name?: string;
  customer_email?: string;
  created_at: string;
}

export async function createOrder(
  token: string,
  notes?: string
): Promise<OrderResponse> {
  return fetchAPI<OrderResponse>("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ notes }),
  });
}

export async function fetchOrders(
  token: string,
  page?: number,
  limit?: number
): Promise<{ orders: Order[]; pagination: Pagination }> {
  const searchParams = new URLSearchParams();
  if (page) searchParams.set("page", String(page));
  if (limit) searchParams.set("limit", String(limit));
  const qs = searchParams.toString();
  return fetchAPI(`/orders${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(token),
  });
}

export async function fetchOrder(token: string, orderId: string): Promise<Order> {
  return fetchAPI<Order>(`/orders/${orderId}`, {
    headers: authHeaders(token),
  });
}

export async function fetchOrderDetail(token: string, orderId: string): Promise<OrderDetail> {
  return fetchAPI<OrderDetail>(`/orders/${orderId}`, {
    headers: authHeaders(token),
  });
}

// ── Admin ────────────────────────────────────────────────────────────────
export interface UpdateUserRoleDto {
  role: string;
}

export interface UpdateOrderStatusDto {
  status: string;
}



export async function fetchAdminDashboard(token: string): Promise<DashboardStats> {
  return fetchAPI<DashboardStats>("/admin/dashboard", {
    headers: authHeaders(token),
  });
}

export async function fetchAdminUsers(token: string, page = 1, limit = 20): Promise<AdminUsersResponse> {
  return fetchAPI(`/admin/users${page > 1 ? `?page=${page}` : ``}${limit > 20 ? `&limit=${limit}` : ``}`, {
    headers: authHeaders(token),
  });
}

export async function fetchAdminOrders(token: string, page = 1, limit = 20, status?: string): Promise<AdminOrdersResponse> {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (limit > 20) params.set("limit", String(limit));
  if (status) params.set("status", status);
  return fetchAPI(`/admin/orders${params.toString() ? `?${params.toString()}` : ``}`, {
    headers: authHeaders(token),
  });
}

export async function updateUserRole(token: string, userId: string, role: string): Promise<{ role: string }> {
  return fetchAPI<{ role: string }>(`/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ role }),
  });
}

export async function updateOrderStatus(token: string, orderId: string, status: string): Promise<{ status: string }> {
  return fetchAPI<{ status: string }>(`/admin/orders/${orderId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify({ status }),
  });
}

// ── Favorites ──────────────────────────────────────────────────────────

export interface Favorite {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export async function fetchFavorites(token: string): Promise<Favorite[]> {
  return fetchAPI<Favorite[]>("/favorites", {
    headers: authHeaders(token),
  });
}

export async function addFavorite(token: string, productId: string): Promise<{ message: string; favorite: Favorite }> {
  return fetchAPI(`/favorites/${productId}`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export async function removeFavorite(token: string, productId: string): Promise<{ message: string }> {
  return fetchAPI(`/favorites/${productId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}
