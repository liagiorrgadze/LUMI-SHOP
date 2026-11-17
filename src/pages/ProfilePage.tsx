import React, { useEffect, useState } from 'react';
import { LogOut, Package, ShieldCheck, User as UserIcon, KeyRound } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { authApi, getApiErrorMessage, ordersApi } from '../services/api';
import type { Order } from '../types/index';
import { formatPrice } from '../utils/commerce';

type ProfileTab = 'orders' | 'details' | 'password';

export function ProfilePage() {
  const { user, loading, isAdmin, logout, setUser } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ProfileTab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    city: user?.city || '',
    address: user?.address || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        country: user.country || '',
        city: user.city || '',
        address: user.address || '',
      });
      setOrdersLoading(true);
      ordersApi
        .myOrders()
        .then(setOrders)
        .catch(() => {})
        .finally(() => setOrdersLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-[#52525B]">
        Loading your account...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: '/profile' }} replace />;
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await authApi.updateProfile(profileForm);
      setUser(updated);
      showToast('Profile information updated.');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update profile.'), 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.new_password.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match.');
      return;
    }
    setSavingPw(true);
    try {
      await authApi.changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      showToast('Password updated successfully.');
    } catch (err) {
      setPwError(getApiErrorMessage(err, 'Unable to update password.'));
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('Signed out.');
    navigate('/');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-[#E6E2DC] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#71717A]">
            Client Account
          </p>
          <h1 className="mt-1.5 font-editorial text-4xl font-normal text-[#111111]">
            {user.first_name} {user.last_name}
          </h1>
          <p className="mt-1 text-sm text-[#52525B]">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex h-10 items-center gap-2 bg-[#111111] px-4 text-xs font-medium tracking-wide text-white hover:bg-[#27272A]"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Dashboard</span>
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-10 items-center gap-2 border border-[#D4D0C8] bg-white px-4 text-xs font-medium text-[#111111] hover:border-[#111111]"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-[#E6E2DC] pb-4" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'orders'
              ? 'bg-[#111111] text-white'
              : 'bg-[#F4F2EE] text-[#3F3F46] hover:bg-[#E6E2DC]'
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Order History ({orders.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'details'
              ? 'bg-[#111111] text-white'
              : 'bg-[#F4F2EE] text-[#3F3F46] hover:bg-[#E6E2DC]'
          }`}
        >
          <UserIcon className="h-3.5 w-3.5" />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'password'}
          onClick={() => setActiveTab('password')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
            activeTab === 'password'
              ? 'bg-[#111111] text-white'
              : 'bg-[#F4F2EE] text-[#3F3F46] hover:bg-[#E6E2DC]'
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          <span>Change Password</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'orders' && (
          <div>
            {ordersLoading ? (
              <p className="text-sm text-[#52525B]">Loading order history...</p>
            ) : orders.length === 0 ? (
              <div className="border border-[#E6E2DC] bg-white p-12 text-center">
                <p className="font-editorial text-2xl text-[#111111]">No orders placed yet</p>
                <p className="mt-1 text-sm text-[#52525B]">
                  When you complete a purchase, your itemized receipts and delivery status will appear here.
                </p>
                <Link
                  to="/shop"
                  className="mt-6 inline-block bg-[#111111] px-6 py-3 text-xs font-medium uppercase tracking-wider text-white"
                >
                  Explore Store
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border border-[#E6E2DC] bg-white p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F4F2EE] pb-4">
                      <div>
                        <p className="font-mono text-sm font-medium text-[#111111]">
                          {order.order_number}
                        </p>
                        <p className="mt-0.5 text-xs text-[#71717A] tabular-nums">
                          Placed on{' '}
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}{' '}
                          · {order.payment_method}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="border border-[#E6E2DC] bg-[#FAFAF8] px-3 py-1 text-xs font-medium text-[#111111]">
                          {order.status}
                        </span>
                        <span className="text-base font-semibold text-[#111111] tabular-nums">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </div>

                    <ul className="mt-4 divide-y divide-[#F4F2EE]">
                      {order.items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="text-[#111111]">
                            {item.product_name}{' '}
                            <span className="text-xs text-[#71717A]">
                              ({item.color}, {item.size} × {item.quantity})
                            </span>
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatPrice(item.line_total)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex items-center justify-between border-t border-[#F4F2EE] pt-3 text-xs text-[#52525B]">
                      <span>
                        Ship to: {order.delivery_address}, {order.city}, {order.country}
                      </span>
                      <Link
                        to={`/order-confirmation/${order.order_number}`}
                        className="font-medium text-[#111111] underline underline-offset-4"
                      >
                        View Receipt
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'details' && (
          <form onSubmit={handleProfileSave} className="max-w-2xl border border-[#E6E2DC] bg-white p-6 sm:p-8 space-y-5">
            <h2 className="font-editorial text-2xl text-[#111111]">Personal &amp; Shipping Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="prof-first" className="block text-xs font-medium text-[#3F3F46]">
                  First Name *
                </label>
                <input
                  id="prof-first"
                  type="text"
                  required
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="prof-last" className="block text-xs font-medium text-[#3F3F46]">
                  Last Name *
                </label>
                <input
                  id="prof-last"
                  type="text"
                  required
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="prof-phone" className="block text-xs font-medium text-[#3F3F46]">
                  Phone
                </label>
                <input
                  id="prof-phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="prof-country" className="block text-xs font-medium text-[#3F3F46]">
                  Country
                </label>
                <input
                  id="prof-country"
                  type="text"
                  value={profileForm.country}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="prof-city" className="block text-xs font-medium text-[#3F3F46]">
                  City
                </label>
                <input
                  id="prof-city"
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="prof-address" className="block text-xs font-medium text-[#3F3F46]">
                  Default Delivery Address
                </label>
                <input
                  id="prof-address"
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="h-11 bg-[#111111] px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#27272A] disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form onSubmit={handlePasswordChange} className="max-w-md border border-[#E6E2DC] bg-white p-6 sm:p-8 space-y-4">
            <h2 className="font-editorial text-2xl text-[#111111]">Change Password</h2>
            {pwError && (
              <div role="alert" className="border border-[#991B1B] bg-[#FEF2F2] px-4 py-3 text-xs text-[#991B1B]">
                {pwError}
              </div>
            )}
            <div>
              <label htmlFor="pw-current" className="block text-xs font-medium text-[#3F3F46]">
                Current Password
              </label>
              <input
                id="pw-current"
                type="password"
                required
                value={pwForm.current_password}
                onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="pw-new" className="block text-xs font-medium text-[#3F3F46]">
                New Password (min 6 chars)
              </label>
              <input
                id="pw-new"
                type="password"
                required
                minLength={6}
                value={pwForm.new_password}
                onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="pw-confirm" className="block text-xs font-medium text-[#3F3F46]">
                Confirm New Password
              </label>
              <input
                id="pw-confirm"
                type="password"
                required
                value={pwForm.confirm_password}
                onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
                className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={savingPw}
              className="h-11 bg-[#111111] px-6 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#27272A] disabled:opacity-50"
            >
              {savingPw ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
