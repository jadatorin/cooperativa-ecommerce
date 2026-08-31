-- =============================================
-- SEED DATA - Categorías y Productos de prueba
-- =============================================

-- Categorías
INSERT INTO app_categories (name, slug, description, image_url, sort_order) VALUES
('Básicos', 'basicos', 'Arroz, aceite, sal y otros productos básicos', 'https://via.placeholder.com/300x200?text=Básicos', 1),
('Lácteos', 'lacteos', 'Leche, queso, mantequilla y productos lácteos', 'https://via.placeholder.com/300x200?text=Lácteos', 2),
('Carnes', 'carnes', 'Res, cerdo, pollo y embutidos', 'https://via.placeholder.com/300x200?text=Carnes', 3),
('Frutas y Verduras', 'frutas-verduras', 'Productos frescos del campo', 'https://via.placeholder.com/300x200?text=Frutas+y+Verduras', 4),
('Bebidas', 'bebidas', 'Agua, jugos, refrescos y cervezas', 'https://via.placeholder.com/300x200?text=Bebidas', 5),
('Higiene', 'higiene', 'Jabón, pasta dental, papel y artículos de higiene', 'https://via.placeholder.com/300x200?text=Higiene', 6);

-- Productos - Básicos
INSERT INTO app_products (name, barcode, description, price, category_slug, quantity_stock, is_available, weight_sold) VALUES
('Arroz Polar 1kg', '7591234567890', 'Arroz de grano largo, ideal para el día a día', 3.50, 'basicos', 200, true, false),
('Aceite Optimus 1L', '7591234567891', 'Aceite vegetal refinado para freír y cocinar', 4.25, 'basicos', 150, true, false),
('Sal Bahamontes 1kg', '7591234567892', 'Sal fina yodificada', 1.20, 'basicos', 300, true, false),
('Azúcar Montalbán 1kg', '7591234567893', 'Azúcar blanca refinada', 2.80, 'basicos', 180, true, false),
('Harina P.A.N. 1kg', '7591234567894', 'Harina de maíz precocida para arepas', 2.50, 'basicos', 250, true, false),
('Pasta Primor 500g', '7591234567895', 'Espaguetis de trigo durazno', 1.90, 'basicos', 200, true, false);

-- Productos - Lácteos
INSERT INTO app_products (name, barcode, description, price, category_slug, quantity_stock, is_available, weight_sold) VALUES
('Leche Completa 1L', '7591234567900', 'Leche entera pasteurizada', 2.80, 'lacteos', 100, true, false),
('Queso Blanco 500g', '7591234567901', 'Queso fresco artesanal', 5.50, 'lacteos', 50, true, false),
('Mantequilla Manicera 500g', '7591234567902', 'Mantequilla con sal', 4.20, 'lacteos', 80, true, false),
('Yogurt Yoka 200g', '7591234567903', 'Yogurt natural con frutas', 1.50, 'lacteos', 120, true, false);

-- Productos - Carnes
INSERT INTO app_products (name, barcode, description, price, category_slug, quantity_stock, is_available, weight_sold) VALUES
('Pollo entero', '7591234567910', 'Pollo entero fresco', 4.50, 'carnes', 40, true, true),
('Carne molida 1kg', '7591234567911', 'Carne de res molida fresca', 8.90, 'carnes', 30, true, true),
('Chorizo criollo 500g', '7591234567912', 'Chorizo artesanal para parrilla', 6.20, 'carnes', 25, true, true),
('Pechuga de pollo 1kg', '7591234567913', 'Pechuga de pollo sin hueso', 6.80, 'carnes', 35, true, true);

-- Productos - Frutas y Verduras
INSERT INTO app_products (name, barcode, description, price, category_slug, quantity_stock, is_available, weight_sold) VALUES
('Plátano', '7591234567920', 'Plátano verde maduro', 0.80, 'frutas-verduras', 100, true, true),
('Tomate', '7591234567921', 'Tomate rojo fresco', 1.20, 'frutas-verduras', 80, true, true),
('Cebolla', '7591234567922', 'Cebolla blanca', 0.90, 'frutas-verduras', 90, true, true),
('Papa', '7591234567923', 'Papa criolla', 1.50, 'frutas-verduras', 70, true, true);

-- Productos - Bebidas
INSERT INTO app_products (name, barcode, description, price, category_slug, quantity_stock, is_available, weight_sold) VALUES
('Agua Minalba 1.5L', '7591234567930', 'Agua purificada sin gas', 0.90, 'bebidas', 200, true, false),
('Jugo Yukery 1L', '7591234567931', 'Jugo de naranja 100% natural', 2.50, 'bebidas', 100, true, false),
('Coca-Cola 2L', '7591234567932', 'Refresco de cola', 3.20, 'bebidas', 150, true, false),
('Cerveza Polar 330ml x6', '7591234567933', 'Pack de 6 cervezas lager', 5.50, 'bebidas', 80, true, false);

-- Productos - Higiene
INSERT INTO app_products (name, barcode, description, price, category_slug, quantity_stock, is_available, weight_sold) VALUES
('Jabón Protex 150g', '7591234567940', 'Jabón antibacterial', 1.80, 'higiene', 120, true, false),
('Pasta Colgate 100ml', '7591234567941', 'Pasta dental con flúor', 2.20, 'higiene', 100, true, false),
('Papel Tocial 4 rollos', '7591234567942', 'Papel higiénico doble hoja', 3.50, 'higiene', 90, true, false),
('Shampoo Sedal 400ml', '7591234567943', 'Shampoo para todo tipo de cabello', 4.80, 'higiene', 60, true, false);

-- Tasa de dólar inicial
INSERT INTO app_dollar_rates (rate, source, effective_date) VALUES
(36.50, 'manual', CURRENT_DATE);
