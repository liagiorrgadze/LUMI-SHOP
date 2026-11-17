export type UserRole = 'USER' | 'ADMIN';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  product_count?: number;
  created_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  size: string;
  color: string;
  color_hex: string;
  stock_quantity: number;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title?: string | null;
  comment: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price?: number | null;
  category_id: number;
  category_name: string;
  category_slug: string;
  sku: string;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  total_stock: number;
  average_rating?: number;
  review_count?: number;
  reviews?: Review[];
  related_products?: Product[];
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  product_slug: string;
  price: number;
  original_price?: number | null;
  image_url: string;
  size: string;
  color: string;
  color_hex: string;
  stock_quantity: number;
  quantity: number;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  product: Product;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  variant_id: number | null;
  product_name: string;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  image_url?: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  delivery_address: string;
  delivery_instructions?: string | null;
  payment_method: string;
  payment_status: string;
  status: OrderStatus;
  subtotal: number;
  delivery_cost: number;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}

export interface CheckoutFormInput {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  delivery_address: string;
  delivery_instructions?: string;
  payment_method?: string;
}

export interface AdminDashboardStats {
  total_revenue: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  recent_orders: Order[];
  best_selling_products: Array<{
    product_id: number;
    product_name: string;
    sku: string;
    image_url: string;
    units_sold: number;
    revenue: number;
  }>;
  orders_by_status: Record<string, number>;
}
