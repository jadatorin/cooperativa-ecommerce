import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock @/lib/api
vi.mock("@/lib/api", () => ({
  fetchAdminDashboard: vi.fn(),
  fetchAdminUsers: vi.fn(),
  fetchAdminOrders: vi.fn(),
  updateUserRole: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

// Mock @/contexts/auth-context
vi.mock("@/contexts/auth-context", () => ({
  useAuth: vi.fn(),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock @/components/ui/toast
vi.mock("@/components/ui/toast", () => ({
  useToast: vi.fn(() => ({
    addToast: vi.fn(),
  })),
}));

import AdminPage from "@/app/admin/page";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  fetchAdminDashboard,
  fetchAdminUsers,
  fetchAdminOrders,
  updateUserRole,
  updateOrderStatus,
} from "@/lib/api";

const mockUseAuth = vi.mocked(useAuth);
const mockUseRouter = vi.mocked(useRouter);
const mockUseToast = vi.mocked(useToast);
const mockFetchAdminDashboard = vi.mocked(fetchAdminDashboard);
const mockFetchAdminUsers = vi.mocked(fetchAdminUsers);
const mockFetchAdminOrders = vi.mocked(fetchAdminOrders);
const mockUpdateUserRole = vi.mocked(updateUserRole);
const mockUpdateOrderStatus = vi.mocked(updateOrderStatus);

function renderAdminPage() {
  return render(<AdminPage />);
}

beforeEach(() => {
  vi.clearAllMocks();

  mockUseAuth.mockReturnValue({
    token: "test-token",
    user: { id: "u1", email: "admin@test.com", full_name: "Admin User", role: "admin" },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    handleSessionExpired: vi.fn(),
  });

  mockUseRouter.mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as any);

  mockUseToast.mockReturnValue({
    addToast: vi.fn(),
    toasts: [],
    removeToast: vi.fn(),
  } as any);

  // Default successful API responses
  mockFetchAdminDashboard.mockResolvedValue({
    users: 10,
    products: 25,
    orders: 50,
    revenue: 1500,
  });

  mockFetchAdminUsers.mockResolvedValue({
    users: [
      { id: "u1", email: "user1@test.com", full_name: "User 1", role: "user", created_at: "2026-01-01" },
      { id: "u2", email: "user2@test.com", full_name: "User 2", role: "admin", created_at: "2026-01-02" },
    ],
    pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
  });

  mockFetchAdminOrders.mockResolvedValue({
    orders: [
      { id: "o1", user_id: "u1", total: 25, status: "pending", created_at: "2026-01-01" },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdminPage", () => {
  it("renders loading state when auth is loading", () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      handleSessionExpired: vi.fn(),
    });

    renderAdminPage();

    expect(screen.getByText("Cargando...")).toBeDefined();
  });

  it("redirects non-admin users to login", async () => {
    const mockPush = vi.fn();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);

    mockUseAuth.mockReturnValue({
      token: "test-token",
      user: { id: "u1", email: "user@test.com", full_name: "Regular User", role: "customer" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      handleSessionExpired: vi.fn(),
    });

    renderAdminPage();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects unauthenticated users to login", async () => {
    const mockPush = vi.fn();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);

    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      handleSessionExpired: vi.fn(),
    });

    renderAdminPage();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("displays dashboard stats after loading", async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("10")).toBeDefined();
      expect(screen.getByText("25")).toBeDefined();
      expect(screen.getByText("50")).toBeDefined();
      // Revenue uses toLocaleString which formats as 1.500 in some locales
      expect(screen.getByText((content) => content.includes("1") && content.includes("500"))).toBeDefined();
    });
  });

  it("displays users table after loading", async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("user1@test.com")).toBeDefined();
      expect(screen.getByText("User 1")).toBeDefined();
      expect(screen.getByText("user2@test.com")).toBeDefined();
    });
  });

  it("displays orders table after loading", async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("o1")).toBeDefined();
      expect(screen.getByText("$25")).toBeDefined();
      expect(screen.getByText("pending")).toBeDefined();
    });
  });

  it("shows error state when dashboard fetch fails", async () => {
    mockFetchAdminDashboard.mockRejectedValue(new Error("Network error"));

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Error al cargar las estadísticas del dashboard")).toBeDefined();
    });
  });

  it("shows error state when users fetch fails", async () => {
    mockFetchAdminUsers.mockRejectedValue(new Error("Network error"));

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Error al cargar los usuarios")).toBeDefined();
    });
  });

  it("shows error state when orders fetch fails", async () => {
    mockFetchAdminOrders.mockRejectedValue(new Error("Network error"));

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("Error al cargar los pedidos")).toBeDefined();
    });
  });

  it("shows empty state when no users exist", async () => {
    mockFetchAdminUsers.mockResolvedValue({
      users: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("No hay usuarios registrados")).toBeDefined();
    });
  });

  it("shows empty state when no orders exist", async () => {
    mockFetchAdminOrders.mockResolvedValue({
      orders: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText("No hay pedidos")).toBeDefined();
    });
  });
});
