import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "@/components/products/product-card";
import type { Product } from "@/types";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; sizes?: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        alt={props.alt}
        src={props.src}
        data-testid="next-image"
        sizes={props.sizes}
      />
    );
  },
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock contexts and API
vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({
    token: "test-token",
    isAuthenticated: true,
  }),
}));

vi.mock("@/contexts/cart-context", () => ({
  useCart: () => ({
    refreshCart: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/lib/api", () => ({
  addToCart: vi.fn().mockResolvedValue({}),
  fetchFavorites: vi.fn().mockResolvedValue([]),
  addFavorite: vi.fn().mockResolvedValue({}),
  removeFavorite: vi.fn().mockResolvedValue({}),
}));

const mockProduct: Product = {
  id: "p1",
  name: "Leche Entera",
  description: "Leche fresca de vaca",
  price: 3.5,
  image_url: "/images/leche.jpg",
  category_slug: "lacteos",
  quantity_stock: 10,
  is_available: true,
  weight_sold: false,
};

const outOfStockProduct: Product = {
  ...mockProduct,
  id: "p2",
  name: "Pan Integral",
  quantity_stock: 0,
};

const weightProduct: Product = {
  ...mockProduct,
  id: "p3",
  name: "Queso",
  weight_sold: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ProductCard", () => {
  it("renders product name and price", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("Leche Entera")).toBeInTheDocument();
    // es-VE locale formats as "USD 3,50"
    const priceEl = screen.getByText(/3[.,]50/);
    expect(priceEl).toBeInTheDocument();
    expect(priceEl.textContent).toContain("USD");
  });

  it("renders product image when image_url is provided", () => {
    render(<ProductCard product={mockProduct} />);
    const img = screen.getByTestId("next-image");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/images/leche.jpg");
    expect(img).toHaveAttribute("alt", "Leche Entera");
  });

  it("renders image with sizes prop for responsive loading", () => {
    render(<ProductCard product={mockProduct} />);
    const img = screen.getByTestId("next-image");
    expect(img).toHaveAttribute("sizes");
  });

  it("shows product name as fallback when no image_url", () => {
    const noImageProduct = { ...mockProduct, image_url: undefined };
    render(<ProductCard product={noImageProduct} />);
    // Name appears twice: once in fallback div, once in CardTitle
    const nameElements = screen.getAllByText("Leche Entera");
    expect(nameElements.length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
  });

  it("shows 'Disponible' badge when in stock", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("Disponible")).toBeInTheDocument();
  });

  it("shows 'Agotado' badge when out of stock", () => {
    render(<ProductCard product={outOfStockProduct} />);
    expect(screen.getByText("Agotado")).toBeInTheDocument();
  });

  it("disables add-to-cart button when out of stock", () => {
    render(<ProductCard product={outOfStockProduct} />);
    const button = screen.getByRole("button", { name: /agregar al carrito/i });
    expect(button).toBeDisabled();
  });

  it("shows 'Por peso' badge for weight-sold products", () => {
    render(<ProductCard product={weightProduct} />);
    expect(screen.getByText("Por peso")).toBeInTheDocument();
  });

  it("does not show 'Por peso' badge for non-weight products", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.queryByText("Por peso")).not.toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("Leche fresca de vaca")).toBeInTheDocument();
  });

  it("links to product detail page", () => {
    render(<ProductCard product={mockProduct} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/products/p1");
  });
});
