import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { getApiErrorMessage } from '../services/api';

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      showToast(`Welcome back, ${user.first_name}.`);
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:py-20">
      <div className="border border-[#E6E2DC] bg-white p-8 sm:p-10">
        <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#71717A]">
          Client Portal
        </p>
        <h1 className="mt-1.5 font-editorial text-4xl font-normal text-[#111111]">Sign In</h1>
        <p className="mt-2 text-sm text-[#52525B]">
          Access your saved bag, wishlist, and order history.
        </p>

        {error && (
          <div role="alert" className="mt-5 border border-[#991B1B] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-[#3F3F46]">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-medium text-[#3F3F46]">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-11 w-full border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm focus:border-[#111111] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="h-12 w-full bg-[#111111] text-xs font-semibold tracking-wider uppercase text-white transition-colors hover:bg-[#27272A] disabled:opacity-50"
          >
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 border-t border-[#E6E2DC] pt-5">
          <p className="text-xs font-medium text-[#71717A]">Quick Demo Access</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('claire@example.com');
                setPassword('LumiPass2026!');
              }}
              className="border border-[#D4D0C8] bg-[#FAFAF8] py-2 text-xs font-medium text-[#111111] hover:border-[#111111]"
            >
              Customer Account
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@lumistore.com');
                setPassword('LumiAdmin2026!');
              }}
              className="border border-[#D4D0C8] bg-[#FAFAF8] py-2 text-xs font-medium text-[#111111] hover:border-[#111111]"
            >
              Admin Account
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-[#52525B]">
          New to LUMI STORE?{' '}
          <Link to="/register" className="font-medium text-[#111111] underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
