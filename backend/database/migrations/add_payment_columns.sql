-- Migration: Add payment columns to app_orders table
-- This adds payment tracking fields for the Payment Reports feature

DO $$
BEGIN
  -- Check if payment_method column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_orders' AND column_name = 'payment_method'
  ) THEN
    -- Add payment_method column
    ALTER TABLE app_orders ADD COLUMN payment_method TEXT
      CHECK (payment_method IN ('cash', 'card', 'transfer', 'mobile', 'other'));
  END IF;

  -- Check if payment_status column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_orders' AND column_name = 'payment_status'
  ) THEN
    -- Add payment_status column
    ALTER TABLE app_orders ADD COLUMN payment_status TEXT DEFAULT 'pending'
      CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));
  END IF;

  -- Check if payment_date column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_orders' AND column_name = 'payment_date'
  ) THEN
    -- Add payment_date column
    ALTER TABLE app_orders ADD COLUMN payment_date TIMESTAMPTZ;
  END IF;

  -- Check if payment_reference column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_orders' AND column_name = 'payment_reference'
  ) THEN
    -- Add payment_reference column for transaction IDs
    ALTER TABLE app_orders ADD COLUMN payment_reference TEXT;
  END IF;

  -- Create indexes for payment queries
  CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON app_orders (payment_status);
  CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON app_orders (payment_method);
  CREATE INDEX IF NOT EXISTS idx_orders_payment_date ON app_orders (payment_date DESC);

  -- Add comments to columns
  COMMENT ON COLUMN app_orders.payment_method IS 'Payment method: cash, card, transfer, mobile, other';
  COMMENT ON COLUMN app_orders.payment_status IS 'Payment status: pending, completed, failed, refunded';
  COMMENT ON COLUMN app_orders.payment_date IS 'Timestamp when payment was processed';
  COMMENT ON COLUMN app_orders.payment_reference IS 'External transaction ID or reference number';
END$$;
