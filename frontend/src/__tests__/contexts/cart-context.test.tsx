import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { CartProvider, useCart } from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";

// Mock @/lib/api
vi.mock("@/lib/api", () => ({
  fetchCart: vi.fn(),
  fetchProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

import { fetchCart as apiFetchCart, fetchProfile } from "@/lib/api";

const mockFetchCart = vi.mocked(apiFetchCart);
const mockFetchProfile = vi.mocked(fetchProfile);

// Helper: expose cart state for assertions
function CartConsumer() {
  const { itemCount, refreshCart } = useCart();
  return (
    <div>
      <span data-testid="itemCount">{itemCount}</span>
      <button onClick={refreshCart}>Refresh</button>
    </div>
  );
}

function renderWithProviders() {
  return render(
    <AuthProvider>
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Mock localStorage — return no stored token (unauthenticated)
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  });
  vi.stubGlobal("atob", (token: string) => {
    return Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64");
  });
  // Default: fetchCart returns empty cart
  mockFetchCart.mockResolvedValue({ id: "c1", items: [], total: 0, itemCount: 0 });
  mockFetchProfile.mockRejectedValue(new Error("not authenticated"));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CartProvider", () => {
  it("starts with itemCount=0 when unauthenticated", async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByTestId("itemCount").textContent).toBe("0");
    });
    // Should NOT call fetchCart when unauthenticated
    expect(mockFetchCart).not.toHaveBeenCalled();
  });

  it("loads cart with itemCount when authenticated", async () => {
    // Set up stored token
    const store: Record<string, string> = { cooperativa_token: "valid-token" };
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => store[key] ?? null);

    // fetchProfile returns a profile (authenticated)
    mockFetchProfile.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      full_name: "Test",
      role: "customer",
    });
    // fetchCart returns items
    mockFetchCart.mockResolvedValue({
      id: "c1",
      items: [
        { id: "i1", cart_id: "c1", product_id: "p1", quantity: 2, unit_price: 5, subtotal: 10 },
        { id: "i2", cart_id: "c1", product_id: "p2", quantity: 1, unit_price: 3, subtotal: 3 },
      ],
      total: 13,
      itemCount: 3,
    });

    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByTestId("itemCount").textContent).toBe("3");
    });
    expect(mockFetchCart).toHaveBeenCalledWith("valid-token");
  });

  it("refreshCart updates count", async () => {
    const store: Record<string, string> = { cooperativa_token: "valid-token" };
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => store[key] ?? null);
    mockFetchProfile.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      full_name: "Test",
      role: "customer",
    });

    // Initial cart: empty
    mockFetchCart.mockResolvedValueOnce({ id: "c1", items: [], total: 0, itemCount: 0 });

    renderWithProviders();
    await waitFor(() => expect(screen.getByTestId("itemCount").textContent).toBe("0"));

    // After refresh: has items
    mockFetchCart.mockResolvedValueOnce({
      id: "c1",
      items: [{ id: "i1", cart_id: "c1", product_id: "p1", quantity: 3, unit_price: 2, subtotal: 6 }],
      total: 6,
      itemCount: 3,
    });

    await userEvent.click(screen.getByText("Refresh"));

    await waitFor(() => {
      expect(screen.getByTestId("itemCount").textContent).toBe("3");
    });
  });
});

import userEvent from "@testing-library/user-event";
