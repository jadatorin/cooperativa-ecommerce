export interface Product {
  id: string;
  name: string;
  barcode?: string;
  description?: string;
  price: number;
  image_url?: string;
  images?: string[];
  category_id?: string;
  category_slug?: string;
  tags?: string[];
  quantity_stock: number;
  is_available: boolean;
  weight_sold: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export interface DollarRate {
  id?: string;
  rate: number;
  source: string;
  effective_date: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  products: T[];
  pagination: Pagination;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at?: string;
  // Enriched from product data
  product_name?: string;
  product_image?: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  total: number;
  itemCount: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName?: string;
    role?: string;
  };
  token: string;
}
