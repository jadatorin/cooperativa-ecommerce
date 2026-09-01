import { Product, Category, DollarRate, PaginatedResponse, Cart, CartItem, AuthResponse, UserProfile } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
