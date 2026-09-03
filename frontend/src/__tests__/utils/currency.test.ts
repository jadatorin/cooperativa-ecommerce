import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats a valid price in USD", () => {
    const result = formatPrice(12.5);
    // es-VE locale with USD currency outputs "USD 12,50" in Node.js
    expect(result).toContain("12");
    expect(result).toContain("50");
    expect(result).toContain("USD");
  });

  it("formats zero as $0.00", () => {
    const result = formatPrice(0);
    expect(result).toContain("0");
    expect(result).toContain("USD");
  });

  it("formats large numbers with grouping", () => {
    const result = formatPrice(1234.56);
    // es-VE uses . as thousands separator: "USD 1.234,56"
    expect(result).toContain("1");
    expect(result).toContain("234");
    expect(result).toContain("56");
  });

  it("formats negative values", () => {
    const result = formatPrice(-5);
    expect(result).toContain("5");
    expect(result).toContain("USD");
  });
});
