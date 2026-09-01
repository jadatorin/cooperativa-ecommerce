"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchProfile, login as apiLogin, register as apiRegister } from "@/lib/api";
import type { UserProfile } from "@/types";

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  handleSessionExpired: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "cooperativa_token";

// Decode JWT to get expiry
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, read token from localStorage and fetch profile
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    // Check if token is expired
    const expiry = getTokenExpiry(stored);
    if (expiry && expiry < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      setIsLoading(false);
      return;
    }

    setToken(stored);
    fetchProfile(stored)
      .then((profile) => setUser(profile))
      .catch(() => {
        // Token invalid/expired — clear it
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Auto-refresh: check every minute if token expires within 1 hour
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      const expiry = getTokenExpiry(token);
      if (expiry && expiry - Date.now() < 60 * 60 * 1000) {
        // Token expires within 1 hour — force re-login
        // In a real app, you'd call a refresh endpoint here
        console.warn("Token expiring soon, please re-login");
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);

    // Fetch full profile
    try {
      const profile = await fetchProfile(res.token);
      setUser(profile);
    } catch {
      // Fallback to login response data
      setUser({
        id: res.user.id,
        email: res.user.email,
        full_name: res.user.fullName,
        role: res.user.role ?? "customer",
      });
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const register = useCallback(
    async (data: { fullName: string; email: string; phone: string; password: string }) => {
      const res = await apiRegister(data);
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);

      try {
        const profile = await fetchProfile(res.token);
        setUser(profile);
      } catch {
        setUser({
          id: res.user.id,
          email: res.user.email,
          full_name: res.user.fullName,
          role: res.user.role ?? "customer",
        });
      }
    },
    []
  );

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      isAuthenticated: !!token,
      isLoading,
      login,
      register,
      logout,
      handleSessionExpired,
    }),
    [token, user, isLoading, login, register, logout, handleSessionExpired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
