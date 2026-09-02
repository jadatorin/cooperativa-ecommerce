import { CartItem, Product } from "@/types";
import { fetchProduct } from "./api";

export interface EnrichedCartItem extends CartItem {
  product_name?: string;
  product_image?: string;
}

/**
 * Enriches cart items with product details (name, image).
 * Deduplicates product fetches to avoid N+1 queries.
 * Gracefully handles missing products.
 */
export async function enrichCartItems(
  items: CartItem[]
): Promise<EnrichedCartItem[]> {
  if (items.length === 0) return [];

  // Deduplicate product IDs
  const uniqueProductIds = [...new Set(items.map((i) => i.product_id))];
  const productMap = new Map<string, { name: string; image_url?: string }>();

  // Fetch all unique products in parallel
  await Promise.all(
    uniqueProductIds.map(async (pid) => {
      try {
        const product = await fetchProduct(pid);
        productMap.set(pid, { name: product.name, image_url: product.image_url });
      } catch {
        // Gracefully handle missing products
        productMap.set(pid, { name: "Producto desconocido" });
      }
    })
  );

  // Map items with enriched data
  return items.map((item) => ({
    ...item,
    product_name: productMap.get(item.product_id)?.name ?? "Producto",
    product_image: productMap.get(item.product_id)?.image_url,
  }));
}

/**
 * Enriches a single cart item with product details.
 */
export async function enrichCartItem(
  item: CartItem
): Promise<EnrichedCartItem> {
  const enriched = await enrichCartItems([item]);
  return enriched[0];
}
