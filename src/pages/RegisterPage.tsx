import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { getApiErrorMessage } from '../services/api';

export function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    country: 'United States',
    city: '',
    address: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        country: form.country.trim() || undefined,
        city: form.city.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      showToast(`Welcome to LUMI STORE, ${user.first_name}.`);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to create account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:py-16">
      <div className="border border-[#E6E2DC] bg-white p-8 sm:p-10">
        <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#71717A]">
          Membership
        </p>
        <h1 className="mt-1.5 font-editorial text-4xl font-normal text-[#111111]">
          Create Account
        </h1>
        <p className="mt-2 text-sm text-[#52525B]">
          Save your wardrobe wishlist, sync your shopping bag, and track deliveries.
        </p>

        {error && (
          <div role="alert" className="mt-5 border border-[#991B1B] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-first-name" className="block text-xs font-medium text-[#3F3F46]">
                First Name *
              </label>
              <input
                id="reg-first-name"
                type="text"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="reg-last-name" className="block text-xs font-medium text-[#3F3F46]">
                Last Name *
              </label>
              <input
                id="reg-last-name"
                type="text"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-medium text-[#3F3F46]">
              Email Address *
            </label>
            <input
              id="reg-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-password" className="block text-xs font-medium text-[#3F3F46]">
                Password (min 6 chars) *
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-medium text-[#3F3F46]">
                Confirm Password *
              </label>
              <input
                id="reg-confirm"
                type="password"
                required
                value={form.confirm_password}
                onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-medium text-[#3F3F46]">
                Phone (Optional)
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="reg-city" className="block text-xs font-medium text-[#3F3F46]">
                City (Optional)
              </label>
              <input
                id="reg-city"
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 h-12 w-full bg-[#111111] text-xs font-semibold tracking-wider uppercase text-white transition-colors hover:bg-[#27272A] disabled:opacity-50"
          >
            {submitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#52525B]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#111111] underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
