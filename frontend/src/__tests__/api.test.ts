import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchProducts,
  fetchProduct,
  fetchCategories,
  fetchDollarRate,
  login,
  register,
  fetchCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "@/lib/api";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, ok = true, status = 200, statusText = "OK") {
  return {
    ok,
    status,
    statusText,
    json: () => Promise.resolve(data),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("fetchProducts", () => {
  it("fetches products with no params", async () => {
    const payload = {
      products: [{ id: "1", name: "Test" }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    mockFetch.mockResolvedValue(jsonResponse(payload));

    const result = await fetchProducts();
    expect(result).toEqual(payload);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/products"),
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("passes query params correctly", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ products: [], pagination: { page: 1, limit: 5, total: 0, totalPages: 0 } }));

    await fetchProducts({ page: 2, limit: 5, category: "frutas", search: "manzana" });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("page=2");
    expect(calledUrl).toContain("limit=5");
    expect(calledUrl).toContain("category=frutas");
    expect(calledUrl).toContain("search=manzana");
  });
});

describe("fetchProduct", () => {
  it("fetches a single product by id", async () => {
    const product = { id: "42", name: "Leche", price: 3.5 };
    mockFetch.mockResolvedValue(jsonResponse(product));

    const result = await fetchProduct("42");
    expect(result).toEqual(product);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/products/42"),
      expect.anything()
    );
  });
});

describe("fetchCategories", () => {
  it("fetches category list", async () => {
    const categories = [{ id: "c1", name: "Lácteos", slug: "lacteos" }];
    mockFetch.mockResolvedValue(jsonResponse(categories));

    const result = await fetchCategories();
    expect(result).toEqual(categories);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/categories"),
      expect.anything()
    );
  });
});

describe("fetchDollarRate", () => {
  it("fetches current dollar rate", async () => {
    const rate = { rate: 36.5, source: "bcv", effective_date: "2026-09-01" };
    mockFetch.mockResolvedValue(jsonResponse(rate));

    const result = await fetchDollarRate();
    expect(result).toEqual(rate);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/dollar-rate"),
      expect.anything()
    );
  });
});

describe("login", () => {
  it("sends POST with email and password", async () => {
    const authResponse = { user: { id: "u1", email: "a@b.com" }, token: "jwt-token" };
    mockFetch.mockResolvedValue(jsonResponse(authResponse));

    const result = await login("a@b.com", "pass123");
    expect(result).toEqual(authResponse);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ email: "a@b.com", password: "pass123" });
  });
});

describe("register", () => {
  it("sends POST with registration data", async () => {
    const authResponse = { user: { id: "u2", email: "new@b.com" }, token: "jwt-new" };
    mockFetch.mockResolvedValue(jsonResponse(authResponse));

    const result = await register({ fullName: "Test", email: "new@b.com", phone: "123", password: "pass" });
    expect(result).toEqual(authResponse);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
  });
});

describe("error handling", () => {
  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, false, 404, "Not Found"));

    await expect(fetchProducts()).rejects.toThrow("API error: 404 Not Found");
  });

  it("throws on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));

    await expect(fetchProducts()).rejects.toThrow("Network failure");
  });
});

describe("fetchCart", () => {
  it("fetches cart with auth header", async () => {
    const cart = { id: "c1", items: [], total: 0, itemCount: 0 };
    mockFetch.mockResolvedValue(jsonResponse(cart));

    const result = await fetchCart("test-token");
    expect(result).toEqual(cart);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer test-token");
  });
});

describe("addToCart", () => {
  it("sends POST with product id and quantity", async () => {
    const item = { id: "ci1", product_id: "p1", quantity: 2, unit_price: 5, subtotal: 10 };
    mockFetch.mockResolvedValue(jsonResponse(item));

    const result = await addToCart("token", "p1", 2);
    expect(result).toEqual(item);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ productId: "p1", quantity: 2 });
  });
});

describe("updateCartItem", () => {
  it("sends PUT with new quantity", async () => {
    const updated = { id: "ci1", quantity: 5, unit_price: 5, subtotal: 25 };
    mockFetch.mockResolvedValue(jsonResponse(updated));

    const result = await updateCartItem("token", "ci1", 5);
    expect(result).toEqual(updated);

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("PUT");
  });
});

describe("removeFromCart", () => {
  it("sends DELETE for item", async () => {
    mockFetch.mockResolvedValue(jsonResponse(undefined));

    await removeFromCart("token", "ci1");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("DELETE");
    expect(mockFetch.mock.calls[0][0]).toContain("/cart/items/ci1");
  });
});

describe("clearCart", () => {
  it("sends DELETE to cart endpoint", async () => {
    mockFetch.mockResolvedValue(jsonResponse(undefined));

    await clearCart("token");

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("DELETE");
  });
});
