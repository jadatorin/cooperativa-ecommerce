"use client";

import useSWR, { SWRConfiguration } from "swr";
import { Product, Category, DollarRate, PaginatedResponse } from "@/types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/+$/, "");

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api${endpoint}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

const swrFetcher = <T>(url: string): Promise<T> => fetchAPI<T>(url);

export interface UseApiOptions extends SWRConfiguration {
  // Additional options can be added here
}

/**
 * SWR hook for fetching products with stale-while-revalidate
 */
export function useProducts(
  params?: { page?: number; limit?: number; category?: string; search?: string },
  options?: UseApiOptions
) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);

  const qs = searchParams.toString();
  const url = `/api/products${qs ? `?${qs}` : ""}`;

  return useSWR<PaginatedResponse<Product>>(url, (key) => swrFetcher<PaginatedResponse<Product>>(key), {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    ...options,
  });
}

/**
 * SWR hook for fetching categories with stale-while-revalidate
 */
export function useCategories(options?: UseApiOptions) {
  return useSWR<Category[]>("/api/categories", (key) => swrFetcher<Category[]>(key), {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    ...options,
  });
}

/**
 * SWR hook for fetching dollar rate with stale-while-revalidate
 */
export function useDollarRate(options?: UseApiOptions) {
  return useSWR<DollarRate>("/api/dollar-rate", (key) => swrFetcher<DollarRate>(key), {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 300000, // Refresh every 5 minutes
    ...options,
  });
}
