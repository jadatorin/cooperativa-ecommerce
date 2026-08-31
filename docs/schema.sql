-- =============================================
-- COOPERATIVA E-COMMERCE DATABASE SCHEMA
-- For Supabase (PostgreSQL 16)
-- =============================================

-- =============================================
-- CATEGORIES
-- =============================================
CREATE TABLE app_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE app_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    barcode VARCHAR(100),
    description TEXT,
    image_url VARCHAR(500),
    images JSONB DEFAULT '[]',
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES app_categories(id),
    category_slug VARCHAR(255),
    tags TEXT[] DEFAULT '{}',
    quantity_stock INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    weight_sold BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_barcode ON app_products(barcode);
CREATE INDEX idx_products_name ON app_products USING gin(to_tsvector('spanish', name));
CREATE INDEX idx_products_category ON app_products(category_id);
CREATE INDEX idx_products_tags ON app_products USING gin(tags);
CREATE INDEX idx_products_category_slug ON app_products(category_slug);

-- =============================================
-- DOLLAR RATES
-- =============================================
CREATE TABLE app_dollar_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate DECIMAL(10,4) NOT NULL,
    source VARCHAR(50) DEFAULT 'manual',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(effective_date, source)
);

-- =============================================
-- USERS (managed by Supabase Auth, we add profile data)
-- =============================================
CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer'
        CHECK (role IN ('customer', 'admin', 'superadmin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SHOPPING CART
-- =============================================
CREATE TABLE app_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active', 'ordered', 'abandoned')),
    total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES app_carts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES app_products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FAVORITES
-- =============================================
CREATE TABLE app_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES app_products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE app_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number SERIAL UNIQUE,
    user_id UUID REFERENCES app_users(id),
    status VARCHAR(30) DEFAULT 'pending'
        CHECK (status IN (
            'pending', 'confirmed', 'processing',
            'ready', 'delivered', 'cancelled'
        )),
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES app_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES app_products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- =============================================
-- AUDIT LOG
-- =============================================
CREATE TABLE app_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES app_users(id),
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON app_audit_logs(user_id);
CREATE INDEX idx_audit_entity ON app_audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created ON app_audit_logs(created_at);

-- =============================================
-- SYNC LOG (for future Kana integration)
-- =============================================
CREATE TABLE app_sync_logs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    records_synced INTEGER DEFAULT 0,
    status VARCHAR(20),
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_order_items ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON app_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON app_users
    FOR UPDATE USING (auth.uid() = id);

-- Carts: users can only see/modify their own
CREATE POLICY "Users can view own cart" ON app_carts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart" ON app_carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" ON app_carts
    FOR UPDATE USING (auth.uid() = user_id);

-- Cart items: through cart ownership
CREATE POLICY "Users can view own cart items" ON app_cart_items
    FOR SELECT USING (
        cart_id IN (SELECT id FROM app_carts WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own cart items" ON app_cart_items
    FOR INSERT WITH CHECK (
        cart_id IN (SELECT id FROM app_carts WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own cart items" ON app_cart_items
    FOR UPDATE USING (
        cart_id IN (SELECT id FROM app_carts WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own cart items" ON app_cart_items
    FOR DELETE USING (
        cart_id IN (SELECT id FROM app_carts WHERE user_id = auth.uid())
    );

-- Favorites: users can only see/modify their own
CREATE POLICY "Users can view own favorites" ON app_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites" ON app_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON app_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Orders: users can only see their own
CREATE POLICY "Users can view own orders" ON app_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON app_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order items: through order ownership
CREATE POLICY "Users can view own order items" ON app_order_items
    FOR SELECT USING (
        order_id IN (SELECT id FROM app_orders WHERE user_id = auth.uid())
    );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_app_users_updated_at BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_categories_updated_at BEFORE UPDATE ON app_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_products_updated_at BEFORE UPDATE ON app_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_carts_updated_at BEFORE UPDATE ON app_carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_orders_updated_at BEFORE UPDATE ON app_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
