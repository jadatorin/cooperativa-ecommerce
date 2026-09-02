import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/types";

/**
 * CartItem display component (extracted for testing).
 * Renders product name, quantity, unit price, and subtotal.
 */
function CartItemRow({ item }: { item: CartItem }) {
  return (
    <div data-testid="cart-item">
      <span data-testid="product-name">{item.product_name ?? item.product_id}</span>
      <span data-testid="quantity">{item.quantity}</span>
      <span data-testid="unit-price">{formatPrice(item.unit_price)}</span>
      <span data-testid="subtotal">{formatPrice(item.subtotal)}</span>
    </div>
  );
}

const baseItem: CartItem = {
  id: "ci1",
  cart_id: "c1",
  product_id: "p1",
  quantity: 3,
  unit_price: 2.5,
  subtotal: 7.5,
};

describe("CartItemRow", () => {
  it("renders quantity correctly", () => {
    render(<CartItemRow item={baseItem} />);
    expect(screen.getByTestId("quantity").textContent).toBe("3");
  });

  it("renders unit price formatted", () => {
    render(<CartItemRow item={baseItem} />);
    const priceText = screen.getByTestId("unit-price").textContent ?? "";
    // es-VE locale with USD outputs "USD 2,50"
    expect(priceText).toContain("2");
    expect(priceText).toContain("50");
    expect(priceText).toContain("USD");
  });

  it("renders subtotal formatted", () => {
    render(<CartItemRow item={baseItem} />);
    const subtotalText = screen.getByTestId("subtotal").textContent ?? "";
    expect(subtotalText).toContain("7");
    expect(subtotalText).toContain("50");
    expect(subtotalText).toContain("USD");
  });

  it("renders product_name when available", () => {
    const itemWithName = { ...baseItem, product_name: "Leche Entera" };
    render(<CartItemRow item={itemWithName} />);
    expect(screen.getByTestId("product-name").textContent).toBe("Leche Entera");
  });

  it("falls back to product_id when product_name is missing", () => {
    render(<CartItemRow item={baseItem} />);
    expect(screen.getByTestId("product-name").textContent).toBe("p1");
  });

  it("handles quantity of 1", () => {
    const singleItem = { ...baseItem, quantity: 1, subtotal: 2.5 };
    render(<CartItemRow item={singleItem} />);
    expect(screen.getByTestId("quantity").textContent).toBe("1");
  });

  it("handles zero subtotal", () => {
    const freeItem = { ...baseItem, quantity: 1, unit_price: 0, subtotal: 0 };
    render(<CartItemRow item={freeItem} />);
    const subtotalText = screen.getByTestId("subtotal").textContent ?? "";
    expect(subtotalText).toContain("0");
    expect(subtotalText).toContain("USD");
  });
});
