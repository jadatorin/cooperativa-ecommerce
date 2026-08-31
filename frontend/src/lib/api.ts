import { Product, Category, DollarRate, PaginatedResponse } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api${endpoint}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

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
