-- Migration: Add payment columns to app_orders table
-- This migration adds payment-specific columns for reporting and reconciliation

-- Add payment columns
ALTER TABLE app_orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax DECIMAL(10,2) DEFAULT 0;

-- Add CHECK constraint for payment_status
ALTER TABLE app_orders
  ADD CONSTRAINT chk_payment_status
  CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed'));

-- Backfill existing orders: set subtotal to total, tax to 0
UPDATE app_orders
SET
  subtotal = COALESCE(total, 0),
  tax = 0
WHERE subtotal = 0 AND tax = 0;

-- Add indexes for payment filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON app_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON app_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON app_orders(paid_at);
