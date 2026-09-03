import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React, { act } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchAutocomplete } from "@/components/layout/search-autocomplete";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock @/lib/api
vi.mock("@/lib/api", () => ({
  fetchProducts: vi.fn(),
}));

import { fetchProducts } from "@/lib/api";
const mockFetchProducts = vi.mocked(fetchProducts);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("SearchAutocomplete", () => {
  it("renders search input with placeholder", () => {
    render(<SearchAutocomplete />);
    expect(screen.getByPlaceholderText("Buscar productos...")).toBeInTheDocument();
  });

  it("shows no results message when search returns empty", async () => {
    mockFetchProducts.mockResolvedValue({
      products: [],
      pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
    });

    render(<SearchAutocomplete />);
    const input = screen.getByPlaceholderText("Buscar productos...");

    await userEvent.type(input, "xyz");

    // Wait for debounce (300ms) + async fetch
    await act(async () => {
      vi.advanceTimersByTime(400);
      // flush microtasks
      await new Promise((r) => setTimeout(r, 0));
    });

    await waitFor(() => {
      expect(screen.getByText("No se encontraron productos")).toBeInTheDocument();
    });
  });

  it("shows product results after debounced search", async () => {
    mockFetchProducts.mockResolvedValue({
      products: [
        { id: "p1", name: "Leche", price: 3.5, quantity_stock: 10, is_available: true, weight_sold: false },
      ],
      pagination: { page: 1, limit: 8, total: 1, totalPages: 1 },
    });

    render(<SearchAutocomplete />);
    const input = screen.getByPlaceholderText("Buscar productos...");

    await userEvent.type(input, "leche");

    await act(async () => {
      vi.advanceTimersByTime(400);
      await new Promise((r) => setTimeout(r, 0));
    });

    await waitFor(() => {
      expect(screen.getByText("Leche")).toBeInTheDocument();
      expect(mockFetchProducts).toHaveBeenCalledWith({ search: "leche", limit: 8 });
    });
  });

  it("navigates to product on result click", async () => {
    mockFetchProducts.mockResolvedValue({
      products: [
        { id: "p1", name: "Leche", price: 3.5, quantity_stock: 10, is_available: true, weight_sold: false },
      ],
      pagination: { page: 1, limit: 8, total: 1, totalPages: 1 },
    });

    render(<SearchAutocomplete />);
    const input = screen.getByPlaceholderText("Buscar productos...");

    await userEvent.type(input, "leche");

    await act(async () => {
      vi.advanceTimersByTime(400);
      await new Promise((r) => setTimeout(r, 0));
    });

    await waitFor(() => {
      expect(screen.getByText("Leche")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Leche"));
    expect(mockPush).toHaveBeenCalledWith("/products/p1");
  });

  it("submits search on form submit", async () => {
    mockFetchProducts.mockResolvedValue({
      products: [],
      pagination: { page: 1, limit: 8, total: 0, totalPages: 0 },
    });

    render(<SearchAutocomplete />);
    const input = screen.getByPlaceholderText("Buscar productos...");

    await userEvent.type(input, "queso");
    await userEvent.keyboard("{Enter}");

    expect(mockPush).toHaveBeenCalledWith("/products?search=queso");
  });

  it("clears input when X button clicked", async () => {
    render(<SearchAutocomplete />);
    const input = screen.getByPlaceholderText("Buscar productos...");

    await userEvent.type(input, "test");
    expect(input).toHaveValue("test");

    // Find the clear button (X icon) and click it
    const clearButton = screen.getByRole("button", { name: "" });
    await userEvent.click(clearButton);

    expect(input).toHaveValue("");
  });

  it("does not search with empty query", async () => {
    render(<SearchAutocomplete />);
    const input = screen.getByPlaceholderText("Buscar productos...");

    // Type and then clear
    await userEvent.type(input, "a");
    await act(async () => {
      vi.advanceTimersByTime(400);
      await new Promise((r) => setTimeout(r, 0));
    });

    // fetchProducts was called once for "a"
    expect(mockFetchProducts).toHaveBeenCalledTimes(1);

    // Now clear the input
    await userEvent.clear(input);
    await act(async () => {
      vi.advanceTimersByTime(400);
      await new Promise((r) => setTimeout(r, 0));
    });

    // Should not have been called again (empty query returns early)
    expect(mockFetchProducts).toHaveBeenCalledTimes(1);
  });
});
