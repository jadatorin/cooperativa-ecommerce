import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

// Mock @/lib/api
vi.mock("@/lib/api", () => ({
  fetchProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

import { fetchProfile, login as apiLogin, register as apiRegister } from "@/lib/api";

const mockFetchProfile = vi.mocked(fetchProfile);
const mockApiLogin = vi.mocked(apiLogin);
const mockApiRegister = vi.mocked(apiRegister);

// Helper: a component that exposes auth state for assertions
function AuthConsumer() {
  const { token, user, isAuthenticated, isLoading, login, logout, register } = useAuth();
  return (
    <div>
      <span data-testid="isAuthenticated">{String(isAuthenticated)}</span>
      <span data-testid="isLoading">{String(isLoading)}</span>
      <span data-testid="token">{token ?? ""}</span>
      <span data-testid="userName">{user?.full_name ?? ""}</span>
      <button onClick={() => login("a@b.com", "pass")}>Login</button>
      <button onClick={() => register({ fullName: "Test", email: "a@b.com", phone: "123", password: "pass" })}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // Mock localStorage
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  });
  // Mock atob for JWT expiry check
  vi.stubGlobal("atob", (token: string) => {
    // Return a valid base64 payload with no expiry
    return Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64");
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AuthProvider", () => {
  it("starts with isLoading=true then resolves", async () => {
    renderWithAuth();
    await waitFor(() => {
      expect(screen.getByTestId("isLoading").textContent).toBe("false");
    });
  });

  it("login stores token and fetches profile", async () => {
    mockApiLogin.mockResolvedValue({
      user: { id: "u1", email: "a@b.com", fullName: "Test User" },
      token: "jwt-token-123",
    });
    mockFetchProfile.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      full_name: "Test User",
      role: "customer",
    });

    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"));

    await userEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(screen.getByTestId("token").textContent).toBe("jwt-token-123");
      expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
      expect(screen.getByTestId("userName").textContent).toBe("Test User");
    });
  });

  it("logout clears token and user", async () => {
    mockApiLogin.mockResolvedValue({
      user: { id: "u1", email: "a@b.com" },
      token: "jwt-token",
    });
    mockFetchProfile.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      full_name: "User",
      role: "customer",
    });

    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"));

    // Login first
    await userEvent.click(screen.getByText("Login"));
    await waitFor(() => expect(screen.getByTestId("isAuthenticated").textContent).toBe("true"));

    // Then logout
    await userEvent.click(screen.getByText("Logout"));
    await waitFor(() => {
      expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
      expect(screen.getByTestId("token").textContent).toBe("");
    });
  });

  it("register stores token and fetches profile", async () => {
    mockApiRegister.mockResolvedValue({
      user: { id: "u2", email: "a@b.com", fullName: "New User" },
      token: "jwt-new-token",
    });
    mockFetchProfile.mockResolvedValue({
      id: "u2",
      email: "a@b.com",
      full_name: "New User",
      role: "customer",
    });

    renderWithAuth();
    await waitFor(() => expect(screen.getByTestId("isLoading").textContent).toBe("false"));

    await userEvent.click(screen.getByText("Register"));

    await waitFor(() => {
      expect(screen.getByTestId("token").textContent).toBe("jwt-new-token");
      expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
    });
  });
});
