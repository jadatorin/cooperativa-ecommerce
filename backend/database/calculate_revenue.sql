-- RPC function to calculate total revenue from delivered orders
-- Run this in Supabase SQL Editor or via migration
-- Safe for Supabase SQL Editor (no CONCURRENTLY — runs inside transaction)

CREATE OR REPLACE FUNCTION calculate_revenue()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(total), 0) FROM app_orders WHERE status = 'delivered';
$$ LANGUAGE sql;
