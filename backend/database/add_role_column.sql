-- Migration: Add role column to app_users table
-- This adds the role enum column for user/admin differentiation

DO $$
BEGIN
  -- Check if role column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'app_users' AND column_name = 'role'
  ) THEN
    -- Add role column with enum type
    ALTER TABLE app_users ADD COLUMN role TEXT DEFAULT 'user'
      CHECK (role IN ('user', 'admin'));
  END IF;

  -- Update existing users without a role to 'customer' (mapping from old 'customer' role)
  UPDATE app_users SET role = 'user' WHERE role IS NULL AND role != 'user';

  -- Create index on role for faster queries
  CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users (role);

  -- Add comment to column
  COMMENT ON COLUMN app_users.role IS 'User role: user or admin';
END$$;