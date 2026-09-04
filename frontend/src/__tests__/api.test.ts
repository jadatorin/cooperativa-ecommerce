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
  fetchAdminDashboard,
  fetchAdminUsers,
  fetchAdminOrders,
  updateUserRole,
  updateOrderStatus,
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

// ── Admin API ──────────────────────────────────────────────────────────────

describe("fetchAdminDashboard", () => {
  it("fetches dashboard stats with auth header", async () => {
    const stats = { users: 10, products: 25, orders: 50, revenue: 1500 };
    mockFetch.mockResolvedValue(jsonResponse(stats));

    const result = await fetchAdminDashboard("admin-token");
    expect(result).toEqual(stats);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/admin/dashboard");
    expect(options.headers.Authorization).toBe("Bearer admin-token");
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, false, 403, "Forbidden"));

    await expect(fetchAdminDashboard("token")).rejects.toThrow("API error: 403 Forbidden");
  });
});

describe("fetchAdminUsers", () => {
  it("fetches users with auth header", async () => {
    const payload = {
      users: [{ id: "u1", email: "a@test.com", role: "user" }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    mockFetch.mockResolvedValue(jsonResponse(payload));

    const result = await fetchAdminUsers("admin-token");
    expect(result).toEqual(payload);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/admin/users");
    expect(options.headers.Authorization).toBe("Bearer admin-token");
  });

  it("passes page and limit params correctly", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ users: [], pagination: { page: 2, limit: 30, total: 0, totalPages: 0 } }));

    await fetchAdminUsers("token", 2, 30);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("page=2");
    expect(calledUrl).toContain("limit=30");
  });

  it("does not send page param when page is 1", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ users: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }));

    await fetchAdminUsers("token", 1, 20);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).not.toContain("page=");
    expect(calledUrl).not.toContain("limit=");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, false, 500, "Internal Server Error"));

    await expect(fetchAdminUsers("token")).rejects.toThrow("API error: 500 Internal Server Error");
  });
});

describe("fetchAdminOrders", () => {
  it("fetches orders with auth header", async () => {
    const payload = {
      orders: [{ id: "o1", user_id: "u1", total: 25, status: "pending" }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    mockFetch.mockResolvedValue(jsonResponse(payload));

    const result = await fetchAdminOrders("admin-token");
    expect(result).toEqual(payload);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/admin/orders");
    expect(options.headers.Authorization).toBe("Bearer admin-token");
  });

  it("passes status filter correctly", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }));

    await fetchAdminOrders("token", 1, 20, "delivered");

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("status=delivered");
  });

  it("does not send status param when not provided", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ orders: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }));

    await fetchAdminOrders("token", 1, 20);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).not.toContain("status=");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, false, 401, "Unauthorized"));

    await expect(fetchAdminOrders("token")).rejects.toThrow("API error: 401 Unauthorized");
  });
});

describe("updateUserRole", () => {
  it("sends PUT with role in body", async () => {
    const response = { role: "admin" };
    mockFetch.mockResolvedValue(jsonResponse(response));

    const result = await updateUserRole("admin-token", "u1", "admin");
    expect(result).toEqual(response);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/admin/users/u1");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body)).toEqual({ role: "admin" });
    expect(options.headers.Authorization).toBe("Bearer admin-token");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, false, 403, "Forbidden"));

    await expect(updateUserRole("token", "u1", "admin")).rejects.toThrow("API error: 403 Forbidden");
  });
});

describe("updateOrderStatus", () => {
  it("sends PUT with status in body", async () => {
    const response = { status: "delivered" };
    mockFetch.mockResolvedValue(jsonResponse(response));

    const result = await updateOrderStatus("admin-token", "o1", "delivered");
    expect(result).toEqual(response);

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain("/api/admin/orders/o1/status");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body)).toEqual({ status: "delivered" });
    expect(options.headers.Authorization).toBe("Bearer admin-token");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValue(jsonResponse(null, false, 400, "Bad Request"));

    await expect(updateOrderStatus("token", "o1", "invalid")).rejects.toThrow("API error: 400 Bad Request");
  });
});
