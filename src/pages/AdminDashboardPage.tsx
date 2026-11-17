import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Edit2,
  FolderTree,
  LayoutDashboard,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { AdminProductModal } from '../components/AdminProductModal';
import { ProductImage } from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { adminApi, categoriesApi, getApiErrorMessage, productsApi } from '../services/api';
import type {
  AdminDashboardStats,
  Category,
  Order,
  OrderStatus,
  Product,
  User,
} from '../types/index';
import { formatPrice } from '../utils/commerce';

type AdminTab = 'overview' | 'products' | 'orders' | 'customers' | 'categories';

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export function AdminDashboardPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const { showToast } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<
    Array<User & { order_count: number; total_spent: number }>
  >([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Modals
  const [productSearch, setProductSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null | undefined>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    customer: User;
    orders: Order[];
  } | null>(null);

  // Category Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashData, prodData, ordData, userData, catData] = await Promise.all([
        adminApi.dashboard(),
        adminApi.products(),
        adminApi.orders(),
        adminApi.users(),
        categoriesApi.list(),
      ]);
      setStats(dashData);
      setProducts(prodData);
      setOrders(ordData);
      setCustomers(userData);
      setCategories(catData);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load admin data.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin, loadAllAdminData]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category_name.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  if (authLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-sm">Verifying permissions...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#991B1B]">
          403 Forbidden
        </p>
        <h1 className="mt-2 font-editorial text-4xl text-[#111111]">Administrator Access Only</h1>
        <p className="mt-3 text-sm text-[#52525B]">
          Your account ({user.email}) does not have administrator privileges for this console.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block bg-[#111111] px-7 py-3 text-xs font-semibold uppercase tracking-wider text-white"
        >
          Return to Storefront
        </Link>
      </div>
    );
  }

  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, status);
      showToast(`Order status updated to ${status}.`);
      await loadAllAdminData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update status.'), 'error');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await productsApi.remove(product.id);
      showToast(`Deleted ${product.name}.`);
      await loadAllAdminData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to delete product.'), 'error');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      if (editingCat) {
        await categoriesApi.update(editingCat.id, {
          name: catName.trim(),
          description: catDesc.trim(),
        });
        showToast('Category updated.');
      } else {
        await categoriesApi.create({
          name: catName.trim(),
          description: catDesc.trim(),
        });
        showToast('Category created.');
      }
      setCatName('');
      setCatDesc('');
      setEditingCat(null);
      await loadAllAdminData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to save category.'), 'error');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    try {
      await categoriesApi.remove(cat.id);
      showToast(`Deleted category ${cat.name}.`);
      await loadAllAdminData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Cannot delete category.'), 'error');
    }
  };

  const handleInspectCustomer = async (customer: User) => {
    try {
      const custOrders = await adminApi.userOrders(customer.id);
      setSelectedCustomer({ customer, orders: custOrders });
    } catch (err) {
      showToast(getApiErrorMessage(err), 'error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row items-start">
        {/* Sidebar Navigation */}
        <aside className="w-full shrink-0 border border-[#E6E2DC] bg-white p-4 lg:w-60">
          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-[#71717A] border-b border-[#F4F2EE]">
            LUMI Admin
          </p>
          <nav aria-label="Admin sections" className="mt-3 flex flex-row flex-wrap gap-1 lg:flex-col">
            {[
              { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
              { id: 'products' as const, label: 'Products', icon: Package },
              { id: 'orders' as const, label: 'Orders', icon: ShoppingCart },
              { id: 'customers' as const, label: 'Customers', icon: Users },
              { id: 'categories' as const, label: 'Categories', icon: FolderTree },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors text-left ${
                    active
                      ? 'bg-[#111111] text-white'
                      : 'text-[#3F3F46] hover:bg-[#F4F2EE] hover:text-[#111111]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Workspace */}
        <div className="flex-1 min-w-0 w-full">
          {loading && !stats ? (
            <div className="border border-[#E6E2DC] bg-white p-12 text-sm text-[#52525B]">
              Loading store telemetry...
            </div>
          ) : null}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-editorial text-3xl text-[#111111]">Store Overview</h1>
                  <p className="text-xs text-[#71717A]">Live sales, inventory, and fulfillment overview</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="inline-flex h-10 items-center gap-2 bg-[#111111] px-4 text-xs font-medium text-white hover:bg-[#27272A]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="border border-[#E6E2DC] bg-white p-5">
                  <p className="text-xs text-[#71717A]">Total Revenue</p>
                  <p className="mt-2 font-mono text-2xl font-medium text-[#111111] tabular-nums">
                    {formatPrice(stats.total_revenue)}
                  </p>
                </div>
                <div className="border border-[#E6E2DC] bg-white p-5">
                  <p className="text-xs text-[#71717A]">Total Orders</p>
                  <p className="mt-2 font-mono text-2xl font-medium text-[#111111] tabular-nums">
                    {stats.total_orders}
                  </p>
                </div>
                <div className="border border-[#E6E2DC] bg-white p-5">
                  <p className="text-xs text-[#71717A]">Registered Customers</p>
                  <p className="mt-2 font-mono text-2xl font-medium text-[#111111] tabular-nums">
                    {stats.total_customers}
                  </p>
                </div>
                <div className="border border-[#E6E2DC] bg-white p-5">
                  <p className="text-xs text-[#71717A]">Active Products</p>
                  <p className="mt-2 font-mono text-2xl font-medium text-[#111111] tabular-nums">
                    {stats.total_products}
                  </p>
                </div>
              </div>

              {/* Recent Orders & Best Sellers */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="border border-[#E6E2DC] bg-white p-6 lg:col-span-7">
                  <div className="flex items-center justify-between pb-4 border-b border-[#F4F2EE]">
                    <h2 className="font-editorial text-xl text-[#111111]">Recent Orders</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-medium text-[#111111] underline underline-offset-4"
                    >
                      Manage All
                    </button>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E6E2DC] text-[#71717A]">
                          <th className="py-2.5 font-medium">Order #</th>
                          <th className="py-2.5 font-medium">Client</th>
                          <th className="py-2.5 font-medium">Status</th>
                          <th className="py-2.5 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F4F2EE]">
                        {stats.recent_orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#FAFAF8]">
                            <td className="py-3 font-mono font-medium text-[#111111]">
                              {ord.order_number}
                            </td>
                            <td className="py-3 text-[#3F3F46]">
                              {ord.first_name} {ord.last_name}
                            </td>
                            <td className="py-3 text-[#111111]">{ord.status}</td>
                            <td className="py-3 text-right font-medium tabular-nums">
                              {formatPrice(ord.total_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-[#E6E2DC] bg-white p-6 lg:col-span-5">
                  <h2 className="font-editorial text-xl text-[#111111] pb-4 border-b border-[#F4F2EE]">
                    Best-Selling Pieces
                  </h2>
                  <ul className="mt-3 divide-y divide-[#F4F2EE]">
                    {stats.best_selling_products.map((bp, idx) => (
                      <li key={`${bp.product_name}-${idx}`} className="flex items-center justify-between gap-3 py-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-medium text-[#111111] truncate">{bp.product_name}</p>
                          <p className="font-mono text-[11px] text-[#71717A]">
                            {bp.sku} · {bp.units_sold} sold
                          </p>
                        </div>
                        <span className="font-medium text-[#111111] tabular-nums shrink-0">
                          {formatPrice(bp.revenue)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="font-editorial text-3xl text-[#111111]">
                  Product Management ({products.length})
                </h1>
                <div className="flex items-center gap-3">
                  <input
                    type="search"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Filter by name, SKU, category..."
                    aria-label="Filter admin products"
                    className="h-10 border border-[#D4D0C8] bg-white px-3 text-xs w-56"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="inline-flex h-10 items-center gap-1.5 bg-[#111111] px-4 text-xs font-medium text-white hover:bg-[#27272A] whitespace-nowrap shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Product</span>
                  </button>
                </div>
              </div>

              <div className="border border-[#E6E2DC] bg-white overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E2DC] bg-[#FAFAF8] text-[#52525B]">
                      <th className="px-4 py-3 font-medium">Piece</th>
                      <th className="px-4 py-3 font-medium">SKU</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 text-right font-medium">Price</th>
                      <th className="px-4 py-3 text-right font-medium">Stock</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F2EE]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAFAF8]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-9 shrink-0 overflow-hidden bg-[#F4F2EE]">
                              <ProductImage
                                src={p.images[0]?.image_url}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-medium text-[#111111]">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[#52525B]">{p.sku}</td>
                        <td className="px-4 py-3 text-[#52525B]">{p.category_name}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatPrice(p.price)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={p.total_stock === 0 ? 'text-[#991B1B] font-medium' : ''}>
                            {p.total_stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(p)}
                              aria-label={`Edit ${p.name}`}
                              className="p-1.5 text-[#3F3F46] hover:text-[#111111]"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              aria-label={`Delete ${p.name}`}
                              className="p-1.5 text-[#71717A] hover:text-[#991B1B]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="font-editorial text-3xl text-[#111111]">
                  Order Management ({filteredOrders.length})
                </h1>
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  aria-label="Filter orders by status"
                  className="h-10 border border-[#D4D0C8] bg-white px-3 text-xs font-medium"
                >
                  <option value="all">All Statuses</option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border border-[#E6E2DC] bg-white overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E2DC] bg-[#FAFAF8] text-[#52525B]">
                      <th className="px-4 py-3 font-medium">Order #</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Destination</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 text-right font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F2EE]">
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#FAFAF8]">
                        <td className="px-4 py-3 font-mono font-medium text-[#111111]">
                          {ord.order_number}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#111111]">
                            {ord.first_name} {ord.last_name}
                          </p>
                          <p className="text-[#71717A]">{ord.email}</p>
                        </td>
                        <td className="px-4 py-3 text-[#52525B]">
                          {ord.city}, {ord.country}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={ord.status}
                            onChange={(e) =>
                              handleStatusChange(ord.id, e.target.value as OrderStatus)
                            }
                            aria-label={`Update status for order ${ord.order_number}`}
                            className="h-8 border border-[#D4D0C8] bg-white px-2 text-xs font-medium"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatPrice(ord.total_amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="font-medium text-[#111111] underline underline-offset-4"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CUSTOMERS TAB */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <h1 className="font-editorial text-3xl text-[#111111]">
                Registered Accounts ({customers.length})
              </h1>

              <div className="border border-[#E6E2DC] bg-white overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E2DC] bg-[#FAFAF8] text-[#52525B]">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 text-right font-medium">Orders</th>
                      <th className="px-4 py-3 text-right font-medium">Total Spent</th>
                      <th className="px-4 py-3 text-right font-medium">History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F2EE]">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FAFAF8]">
                        <td className="px-4 py-3 font-medium text-[#111111]">
                          {c.first_name} {c.last_name}
                        </td>
                        <td className="px-4 py-3 text-[#52525B]">{c.email}</td>
                        <td className="px-4 py-3 font-mono text-[11px]">{c.role}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{c.order_count}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatPrice(c.total_spent)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleInspectCustomer(c)}
                            className="font-medium text-[#111111] underline underline-offset-4"
                          >
                            View Orders
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
              <form
                onSubmit={handleSaveCategory}
                className="border border-[#E6E2DC] bg-white p-6 space-y-4 lg:col-span-5"
              >
                <h2 className="font-editorial text-2xl text-[#111111]">
                  {editingCat ? `Edit ${editingCat.name}` : 'Create Category'}
                </h2>
                <div>
                  <label htmlFor="cat-name" className="block text-xs font-medium text-[#3F3F46]">
                    Category Name *
                  </label>
                  <input
                    id="cat-name"
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. Outerwear"
                    className="mt-1 h-10 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="cat-desc" className="block text-xs font-medium text-[#3F3F46]">
                    Description
                  </label>
                  <textarea
                    id="cat-desc"
                    rows={3}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="mt-1 w-full border border-[#D4D0C8] bg-[#FAFAF8] p-3 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="h-10 bg-[#111111] px-5 text-xs font-medium text-white hover:bg-[#27272A]"
                  >
                    {editingCat ? 'Update Category' : 'Add Category'}
                  </button>
                  {editingCat && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCat(null);
                        setCatName('');
                        setCatDesc('');
                      }}
                      className="h-10 border border-[#D4D0C8] px-4 text-xs"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="border border-[#E6E2DC] bg-white lg:col-span-7">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E6E2DC] bg-[#FAFAF8] text-[#52525B]">
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Slug</th>
                      <th className="px-4 py-3 text-right font-medium">Products</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F2EE]">
                    {categories.map((cat) => (
                      <tr key={cat.id}>
                        <td className="px-4 py-3 font-medium text-[#111111]">{cat.name}</td>
                        <td className="px-4 py-3 font-mono text-[#71717A]">{cat.slug}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {cat.product_count ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCat(cat);
                                setCatName(cat.name);
                                setCatDesc(cat.description || '');
                              }}
                              aria-label={`Edit ${cat.name}`}
                              className="p-1 text-[#3F3F46] hover:text-[#111111]"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              aria-label={`Delete ${cat.name}`}
                              className="p-1 text-[#71717A] hover:text-[#991B1B]"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Create/Edit Modal */}
      {editingProduct !== undefined && (
        <AdminProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(undefined)}
          onSaved={() => {
            setEditingProduct(undefined);
            loadAllAdminData();
          }}
          onToast={showToast}
        />
      )}

      {/* Order Inspection Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Order ${selectedOrder.order_number} details`}
        >
          <div className="w-full max-w-xl border border-[#E6E2DC] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-3">
              <h2 className="font-mono text-base font-semibold text-[#111111]">
                {selectedOrder.order_number}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close order details"
                className="p-1 text-[#52525B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-2 text-xs text-[#3F3F46]">
              <p>
                <strong className="text-[#111111]">Client:</strong> {selectedOrder.first_name}{' '}
                {selectedOrder.last_name} ({selectedOrder.email})
              </p>
              <p>
                <strong className="text-[#111111]">Phone:</strong> {selectedOrder.phone}
              </p>
              <p>
                <strong className="text-[#111111]">Address:</strong> {selectedOrder.delivery_address},{' '}
                {selectedOrder.city}, {selectedOrder.country}
              </p>
              {selectedOrder.delivery_instructions && (
                <p>
                  <strong className="text-[#111111]">Notes:</strong>{' '}
                  {selectedOrder.delivery_instructions}
                </p>
              )}
            </div>
            <ul className="mt-4 divide-y divide-[#F4F2EE] border-y border-[#E6E2DC]">
              {selectedOrder.items.map((item) => (
                <li key={item.id} className="flex justify-between py-2.5 text-xs">
                  <span>
                    {item.product_name} ({item.color}, {item.size} × {item.quantity})
                  </span>
                  <span className="font-medium tabular-nums">{formatPrice(item.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between text-sm font-semibold text-[#111111]">
              <span>Total ({selectedOrder.payment_method})</span>
              <span className="tabular-nums">{formatPrice(selectedOrder.total_amount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Orders for ${selectedCustomer.customer.first_name}`}
        >
          <div className="w-full max-w-xl border border-[#E6E2DC] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6E2DC] pb-3">
              <h2 className="font-editorial text-2xl text-[#111111]">
                {selectedCustomer.customer.first_name} {selectedCustomer.customer.last_name} — Orders
              </h2>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close customer orders"
                className="p-1 text-[#52525B]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {selectedCustomer.orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#71717A]">
                This customer has not placed any orders yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-[#F4F2EE] max-h-80 overflow-y-auto">
                {selectedCustomer.orders.map((ord) => (
                  <li key={ord.id} className="flex items-center justify-between py-3 text-xs">
                    <div>
                      <p className="font-mono font-medium text-[#111111]">{ord.order_number}</p>
                      <p className="text-[#71717A]">{ord.status}</p>
                    </div>
                    <span className="font-semibold tabular-nums">
                      {formatPrice(ord.total_amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
