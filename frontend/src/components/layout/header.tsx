"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X, User, LogOut, Package, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { SearchAutocomplete } from "./search-autocomplete";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isUserMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Cooperativa</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Inicio
          </Link>
          <Link
            href="/products"
            className="text-sm font-medium hover:text-primary"
          >
            Productos
          </Link>
        </nav>

        {/* Search */}
        <SearchAutocomplete className="hidden md:flex flex-1 max-w-sm mx-6" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
              <span className="sr-only">Carrito</span>
            </Button>
          </Link>

          {/* Auth buttons / User menu */}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <User className="h-5 w-5" />
              </Button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-md border bg-background shadow-md z-50">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium">{user?.full_name || "Usuario"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/orders"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Package className="h-4 w-4" />
                      Mis órdenes
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Heart className="h-4 w-4" />
                      Favoritos
                    </Link>
                    <button
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent w-full text-left text-destructive"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <SearchAutocomplete mobile />
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                className="text-sm font-medium hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium hover:text-primary py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Productos
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    href="/orders"
                    className="text-sm font-medium hover:text-primary py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mis órdenes
                  </Link>
                  <Link
                    href="/favorites"
                    className="text-sm font-medium hover:text-primary py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Favoritos
                  </Link>
                  <button
                    className="text-sm font-medium text-destructive hover:text-destructive/80 py-2 text-left"
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium hover:text-primary py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-medium hover:text-primary py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
