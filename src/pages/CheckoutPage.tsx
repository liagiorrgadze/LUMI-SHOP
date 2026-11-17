import React, { useEffect, useState } from 'react';
import { Lock, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { getApiErrorMessage, ordersApi } from '../services/api';
import type { CheckoutFormInput } from '../types/index';
import { formatPrice, validateCheckoutForm } from '../utils/commerce';

export function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems, cartTotals, clearLocalCartAfterOrder, showToast } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState<CheckoutFormInput>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || 'United States',
    city: user?.city || '',
    delivery_address: user?.address || '',
    delivery_instructions: '',
    payment_method: 'COD',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormInput, string>>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        first_name: prev.first_name || user.first_name || '',
        last_name: prev.last_name || user.last_name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        country: prev.country || user.country || 'United States',
        city: prev.city || user.city || '',
        delivery_address: prev.delivery_address || user.address || '',
      }));
    }
  }, [user]);

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-editorial text-4xl text-[#111111]">No Items to Checkout</h1>
        <p className="mt-3 text-sm text-[#52525B]">
          Add items from our collection before proceeding to checkout.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-block bg-[#111111] px-7 py-3.5 text-xs font-semibold tracking-wider uppercase text-white"
        >
          Browse Collection
        </Link>
      </div>
    );
  }

  const handleChange = (field: keyof CheckoutFormInput, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const validation = validateCheckoutForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const order = await ordersApi.create({
        ...form,
        items: cartItems.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
      });
      clearLocalCartAfterOrder();
      showToast(`Order ${order.order_number} confirmed.`);
      navigate(`/order-confirmation/${order.order_number}`, { state: { order } });
    } catch (err) {
      setServerError(getApiErrorMessage(err, 'Unable to complete checkout.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="border-b border-[#E6E2DC] pb-6">
        <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#71717A]">
          LUMI Checkout
        </p>
        <h1 className="mt-1.5 font-editorial text-4xl font-normal text-[#111111]">
          Shipping &amp; Delivery
        </h1>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
        <form onSubmit={handleSubmit} noValidate className="space-y-8 lg:col-span-7">
          {serverError && (
            <div role="alert" className="border border-[#991B1B] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
              {serverError}
            </div>
          )}

          <div className="border border-[#E6E2DC] bg-white p-6 sm:p-8">
            <h2 className="font-editorial text-2xl text-[#111111]">Recipient Details</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="checkout-first-name" className="block text-xs font-medium text-[#3F3F46]">
                  First Name *
                </label>
                <input
                  id="checkout-first-name"
                  type="text"
                  required
                  value={form.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-[#991B1B]">{errors.first_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="checkout-last-name" className="block text-xs font-medium text-[#3F3F46]">
                  Last Name *
                </label>
                <input
                  id="checkout-last-name"
                  type="text"
                  required
                  value={form.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-[#991B1B]">{errors.last_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="checkout-email" className="block text-xs font-medium text-[#3F3F46]">
                  Email Address *
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
                />
                {errors.email && <p className="mt-1 text-xs text-[#991B1B]">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="checkout-phone" className="block text-xs font-medium text-[#3F3F46]">
                  Phone Number *
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+1 212 555 0148"
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
                />
                {errors.phone && <p className="mt-1 text-xs text-[#991B1B]">{errors.phone}</p>}
              </div>
            </div>
          </div>

          <div className="border border-[#E6E2DC] bg-white p-6 sm:p-8">
            <h2 className="font-editorial text-2xl text-[#111111]">Delivery Address</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="checkout-country" className="block text-xs font-medium text-[#3F3F46]">
                  Country *
                </label>
                <input
                  id="checkout-country"
                  type="text"
                  required
                  value={form.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
                />
                {errors.country && <p className="mt-1 text-xs text-[#991B1B]">{errors.country}</p>}
              </div>

              <div>
                <label htmlFor="checkout-city" className="block text-xs font-medium text-[#3F3F46]">
                  City *
                </label>
                <input
                  id="checkout-city"
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
                />
                {errors.city && <p className="mt-1 text-xs text-[#991B1B]">{errors.city}</p>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="checkout-address" className="block text-xs font-medium text-[#3F3F46]">
                  Street Address &amp; Apartment *
                </label>
                <input
                  id="checkout-address"
                  type="text"
                  required
                  value={form.delivery_address}
                  onChange={(e) => handleChange('delivery_address', e.target.value)}
                  placeholder="412 Mercer Street, Apt 4B"
                  className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
                />
                {errors.delivery_address && (
                  <p className="mt-1 text-xs text-[#991B1B]">{errors.delivery_address}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="checkout-notes" className="block text-xs font-medium text-[#3F3F46]">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  id="checkout-notes"
                  rows={2}
                  value={form.delivery_instructions || ''}
                  onChange={(e) => handleChange('delivery_instructions', e.target.value)}
                  placeholder="Concierge drop-off, gate code, or preferred courier window..."
                  className="mt-1.5 w-full border border-[#D4D0C8] bg-[#FAFAF8] p-3.5 text-sm focus:border-[#111111] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="border border-[#E6E2DC] bg-white p-6 sm:p-8">
            <h2 className="font-editorial text-2xl text-[#111111]">Payment Method</h2>
            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 border border-[#111111] bg-[#FAFAF8] p-4">
                <input
                  type="radio"
                  name="payment_method"
                  value="COD"
                  checked={form.payment_method === 'COD'}
                  onChange={() => handleChange('payment_method', 'COD')}
                  className="mt-1 accent-[#111111]"
                />
                <div>
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#111111]">
                    <Truck className="h-4 w-4" /> Cash on Delivery (COD)
                  </span>
                  <p className="mt-1 text-xs text-[#52525B]">
                    Pay in cash or mobile terminal upon courier delivery to your address.
                  </p>
                </div>
              </label>

              <div className="flex items-start gap-3 border border-[#E6E2DC] bg-[#F4F2EE]/60 p-4 opacity-70">
                <input type="radio" name="payment_method" disabled className="mt-1" />
                <div>
                  <span className="flex items-center gap-2 text-sm font-medium text-[#52525B]">
                    <Lock className="h-4 w-4" /> Credit / Debit Card via Stripe (Coming Soon)
                  </span>
                  <p className="mt-1 text-xs text-[#71717A]">
                    Online card processing gateway integration scheduled for next release.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="h-13 w-full bg-[#111111] text-xs font-semibold tracking-wider uppercase text-white transition-colors hover:bg-[#27272A] disabled:opacity-50"
          >
            {submitting
              ? 'Confirming Order...'
              : `Place Order — ${formatPrice(cartTotals.total)} (Cash on Delivery)`}
          </button>
        </form>

        {/* Order Summary Sidebar */}
        <aside className="border border-[#E6E2DC] bg-white p-6 sm:p-8 lg:col-span-5 lg:sticky lg:top-24">
          <h2 className="font-editorial text-2xl text-[#111111]">Order Summary</h2>
          <ul className="mt-5 divide-y divide-[#E6E2DC]">
            {cartItems.map((item) => (
              <li key={item.id} className="flex items-center gap-4 py-4">
                <div className="h-18 w-14 shrink-0 overflow-hidden bg-[#F4F2EE]">
                  <ProductImage
                    src={item.image_url}
                    alt={item.product_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111111] truncate">{item.product_name}</p>
                  <p className="text-xs text-[#71717A] tabular-nums">
                    {item.color} · {item.size} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-medium text-[#111111] tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2.5 border-t border-[#E6E2DC] pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-[#52525B]">Subtotal</span>
              <span className="font-medium tabular-nums">{formatPrice(cartTotals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#52525B]">Delivery Cost</span>
              <span className="font-medium tabular-nums">
                {cartTotals.deliveryCost === 0 ? 'Complimentary' : formatPrice(cartTotals.deliveryCost)}
              </span>
            </div>
            <div className="flex justify-between border-t border-[#E6E2DC] pt-3 text-base font-semibold text-[#111111]">
              <span>Final Total</span>
              <span className="tabular-nums">{formatPrice(cartTotals.total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
