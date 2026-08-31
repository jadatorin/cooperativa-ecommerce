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
