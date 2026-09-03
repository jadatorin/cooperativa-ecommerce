-- Performance indexes for cooperativa-ecommerce
-- Generated from backend service query pattern analysis
-- Safe for Supabase SQL Editor (no CONCURRENTLY — runs inside transaction)

-- =============================================================================
-- PRODUCTS
-- =============================================================================



-- Performance indexes for cooperativa-ecommerce
-- Safe for Supabase SQL Editor (no CONCURRENTLY — runs inside transaction)

-- PRODUCTS
CREATE INDEX IF NOT EXISTS idx_products_category_slug
  ON app_products (category_slug);

CREATE INDEX IF NOT EXISTS idx_products_available_name
  ON app_products (is_available, name);

CREATE INDEX IF NOT EXISTS idx_products_barcode
  ON app_products (barcode);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON app_products USING gin (name gin_trgm_ops);

-- CATEGORIES
CREATE INDEX IF NOT EXISTS idx_categories_slug
  ON app_categories (slug);

CREATE INDEX IF NOT EXISTS idx_categories_active_sort
  ON app_categories (is_active, sort_order);

-- CARTS & CART ITEMS
CREATE INDEX IF NOT EXISTS idx_carts_user_status
  ON app_carts (user_id, status);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id
  ON app_cart_items (cart_id);

CREATE INDEX IF NOT EXISTS idx_cart_items_product_id
  ON app_cart_items (product_id);

-- ORDERS & ORDER ITEMS
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON app_orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON app_orders (status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON app_order_items (order_id);

-- FAVORITES
CREATE INDEX IF NOT EXISTS idx_favorites_user_id
  ON app_favorites (user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_product
  ON app_favorites (user_id, product_id);

-- DOLLAR RATES
CREATE INDEX IF NOT EXISTS idx_dollar_rates_effective_date
  ON app_dollar_rates (effective_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dollar_rates_effective_source
  ON app_dollar_rates (effective_date, source);