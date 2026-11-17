import axios from 'axios';
import type {
  AdminDashboardStats,
  CartItem,
  Category,
  CheckoutFormInput,
  Order,
  OrderStatus,
  Product,
  Review,
  User,
  WishlistItem,
} from '../types/index';

export const AUTH_TOKEN_KEY = 'lumi_store_token';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export const authApi = {
  register: async (payload: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
  }) => {
    const { data } = await apiClient.post<{ token: string; user: User }>('/auth/register', payload);
    return data;
  },
  login: async (payload: { email: string; password: string }) => {
    const { data } = await apiClient.post<{ token: string; user: User }>('/auth/login', payload);
    return data;
  },
  me: async () => {
    const { data } = await apiClient.get<{ user: User }>('/auth/me');
    return data.user;
  },
  updateProfile: async (payload: {
    first_name: string;
    last_name: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
  }) => {
    const { data } = await apiClient.put<{ user: User }>('/auth/profile', payload);
    return data.user;
  },
  changePassword: async (payload: { current_password: string; new_password: string }) => {
    const { data } = await apiClient.put<{ message: string }>('/auth/password', payload);
    return data;
  },
  logout: async () => {
    await apiClient.post('/auth/logout');
  },
};

export const categoriesApi = {
  list: async () => {
    const { data } = await apiClient.get<{ categories: Category[] }>('/categories');
    return data.categories;
  },
  create: async (payload: { name: string; description?: string; image_url?: string }) => {
    const { data } = await apiClient.post<{ category: Category }>('/categories', payload);
    return data.category;
  },
  update: async (id: number, payload: { name?: string; description?: string; image_url?: string }) => {
    const { data } = await apiClient.put<{ category: Category }>(`/categories/${id}`, payload);
    return data.category;
  },
  remove: async (id: number) => {
    await apiClient.delete(`/categories/${id}`);
  },
};

export interface ProductQueryParams {
  search?: string;
  category?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  size?: string;
  color?: string;
  sort?: string;
  featured?: boolean;
  newArrival?: boolean;
  onSale?: boolean;
}

export const productsApi = {
  list: async (params?: ProductQueryParams) => {
    const { data } = await apiClient.get<{ products: Product[] }>('/products', { params });
    return data.products;
  },
  getById: async (idOrSlug: string | number) => {
    const { data } = await apiClient.get<{ product: Product }>(`/products/${idOrSlug}`);
    return data.product;
  },
  addReview: async (productId: number, payload: { rating: number; title?: string; comment: string }) => {
    const { data } = await apiClient.post<{ review: Review }>(`/products/${productId}/reviews`, payload);
    return data.review;
  },
  create: async (payload: Record<string, unknown>) => {
    const { data } = await apiClient.post<{ product: Product }>('/products', payload);
    return data.product;
  },
  update: async (id: number, payload: Record<string, unknown>) => {
    const { data } = await apiClient.put<{ product: Product }>(`/products/${id}`, payload);
    return data.product;
  },
  remove: async (id: number) => {
    await apiClient.delete(`/products/${id}`);
  },
};

export const cartApi = {
  get: async () => {
    const { data } = await apiClient.get<{ items: CartItem[] }>('/cart');
    return data.items;
  },
  add: async (payload: { product_id: number; variant_id: number; quantity: number }) => {
    const { data } = await apiClient.post<{ items: CartItem[] }>('/cart', payload);
    return data.items;
  },
  sync: async (items: Array<{ variant_id: number; quantity: number }>) => {
    const { data } = await apiClient.post<{ items: CartItem[] }>('/cart/sync', { items });
    return data.items;
  },
  updateQuantity: async (cartItemId: number, quantity: number) => {
    const { data } = await apiClient.put<{ items: CartItem[] }>(`/cart/${cartItemId}`, { quantity });
    return data.items;
  },
  remove: async (cartItemId: number) => {
    const { data } = await apiClient.delete<{ items: CartItem[] }>(`/cart/${cartItemId}`);
    return data.items;
  },
};

export const wishlistApi = {
  get: async () => {
    const { data } = await apiClient.get<{ items: WishlistItem[] }>('/wishlist');
    return data.items;
  },
  add: async (productId: number) => {
    const { data } = await apiClient.post<{ items: WishlistItem[] }>('/wishlist', { product_id: productId });
    return data.items;
  },
  remove: async (idOrProductId: number) => {
    const { data } = await apiClient.delete<{ items: WishlistItem[] }>(`/wishlist/${idOrProductId}`);
    return data.items;
  },
};

export const ordersApi = {
  create: async (
    payload: CheckoutFormInput & { items?: Array<{ variant_id: number; quantity: number }> }
  ) => {
    const { data } = await apiClient.post<{ order: Order }>('/orders', payload);
    return data.order;
  },
  myOrders: async () => {
    const { data } = await apiClient.get<{ orders: Order[] }>('/orders/my');
    return data.orders;
  },
  getById: async (idOrOrderNumber: string | number) => {
    const { data } = await apiClient.get<{ order: Order }>(`/orders/${idOrOrderNumber}`);
    return data.order;
  },
};

export const adminApi = {
  dashboard: async () => {
    const { data } = await apiClient.get<{ stats: AdminDashboardStats }>('/admin/dashboard');
    return data.stats;
  },
  orders: async () => {
    const { data } = await apiClient.get<{ orders: Order[] }>('/admin/orders');
    return data.orders;
  },
  updateOrderStatus: async (orderId: number, status: OrderStatus) => {
    const { data } = await apiClient.put<{ order: Order }>(`/admin/orders/${orderId}/status`, { status });
    return data.order;
  },
  users: async () => {
    const { data } = await apiClient.get<{
      users: Array<User & { order_count: number; total_spent: number }>;
    }>('/admin/users');
    return data.users;
  },
  userOrders: async (userId: number) => {
    const { data } = await apiClient.get<{ orders: Order[] }>(`/admin/users/${userId}/orders`);
    return data.orders;
  },
  products: async () => {
    const { data } = await apiClient.get<{ products: Product[] }>('/admin/products');
    return data.products;
  },
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await apiClient.post<{ image_url: string }>('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.image_url;
  },
};
