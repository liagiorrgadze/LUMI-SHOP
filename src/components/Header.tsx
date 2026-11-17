import React, { useState } from 'react';
import { Heart, Menu, Search, ShieldCheck, ShoppingBag, User, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export function Header() {
  const { user, isAdmin } = useAuth();
  const { cartTotals, wishlistItems, openCart } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    setSearchOpen(false);
    navigate(q ? `/shop?search=${encodeURIComponent(q)}` : '/shop');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E6E2DC] bg-[#FAFAF8]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Brand Wordmark + Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="flex h-9 w-9 items-center justify-center text-[#111111] lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link
            to="/"
            className="font-editorial text-lg font-semibold tracking-[0.1em] text-[#111111] whitespace-nowrap shrink-0 sm:text-2xl sm:tracking-[0.14em]"
          >
            LUMI STORE
          </Link>
        </div>

        {/* Zone 2: Primary Navigation Links */}
        <nav
          aria-label="Main navigation"
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#3F3F46]"
        >
          <Link
            to="/shop"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#111111] hover:underline underline-offset-4"
          >
            Shop All
          </Link>
          <Link
            to="/shop?category=womens-clothing"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#111111] hover:underline underline-offset-4"
          >
            Women
          </Link>
          <Link
            to="/shop?category=mens-clothing"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#111111] hover:underline underline-offset-4"
          >
            Men
          </Link>
          <Link
            to="/shop?category=shoes"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#111111] hover:underline underline-offset-4"
          >
            Shoes
          </Link>
          <Link
            to="/shop?category=bags"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#111111] hover:underline underline-offset-4"
          >
            Bags &amp; More
          </Link>
        </nav>

        {/* Zone 3: Account, Wishlist, Search & Shopping Bag */}
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search catalog"
            aria-expanded={searchOpen}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-[#111111] transition-colors hover:bg-[#F4F2EE]"
          >
            <Search className="h-[18px] w-[18px] stroke-[1.6]" />
          </button>

          {isAdmin && (
            <Link
              to="/admin"
              aria-label="Admin dashboard"
              className="hidden sm:flex h-10 items-center gap-1.5 px-2.5 text-xs font-medium text-[#111111] transition-colors hover:bg-[#F4F2EE] whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="h-4 w-4 stroke-[1.6]" />
              <span>Admin</span>
            </Link>
          )}

          <Link
            to={user ? '/profile' : '/login'}
            aria-label={user ? `Account for ${user.first_name}` : 'Sign in to account'}
            className="flex h-9 w-9 sm:h-10 sm:w-auto items-center justify-center sm:gap-1.5 sm:px-2 text-sm text-[#111111] transition-colors hover:bg-[#F4F2EE] whitespace-nowrap shrink-0"
          >
            <User className="h-[18px] w-[18px] stroke-[1.6]" />
            <span className="hidden md:inline text-xs font-medium">
              {user ? user.first_name : 'Account'}
            </span>
          </Link>

          <Link
            to="/wishlist"
            aria-label={`Wishlist (${wishlistItems.length} saved)`}
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center text-[#111111] transition-colors hover:bg-[#F4F2EE]"
          >
            <Heart className="h-[18px] w-[18px] stroke-[1.6]" />
            {wishlistItems.length > 0 && (
              <span className="absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center bg-[#111111] px-1 text-[10px] font-medium text-white tabular-nums">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={openCart}
            aria-label={`Shopping bag (${cartTotals.itemCount} items)`}
            data-testid="header-bag-button"
            className="relative flex h-9 w-9 sm:h-10 sm:w-auto items-center justify-center sm:gap-1.5 sm:px-2.5 text-sm font-medium text-[#111111] transition-colors hover:bg-[#F4F2EE] whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="h-[18px] w-[18px] stroke-[1.6]" />
            <span className="hidden sm:inline text-xs tabular-nums" data-testid="header-bag-count">
              Bag ({cartTotals.itemCount})
            </span>
            {cartTotals.itemCount > 0 && (
              <span className="sm:hidden absolute top-1 right-0.5 flex h-4 min-w-4 items-center justify-center bg-[#111111] px-1 text-[10px] font-medium text-white tabular-nums">
                {cartTotals.itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-[#E6E2DC] bg-white px-4 py-3 sm:px-6 lg:px-8">
          <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-2xl items-center gap-3">
            <label htmlFor="header-search-input" className="sr-only">
              Search LUMI STORE products
            </label>
            <input
              id="header-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coats, silk dresses, loafers, totes..."
              autoFocus
              className="h-10 flex-1 border border-[#D4D0C8] bg-[#FAFAF8] px-3.5 text-sm text-[#111111] placeholder:text-[#71717A] focus:border-[#111111] focus:outline-none"
            />
            <button
              type="submit"
              className="h-10 bg-[#111111] px-5 text-xs font-medium tracking-wide text-white transition-colors hover:bg-[#27272A] whitespace-nowrap shrink-0"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="flex h-10 w-10 items-center justify-center text-[#52525B] hover:text-[#111111]"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-[#E6E2DC] bg-white px-4 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {[
              { label: 'Shop All', to: '/shop' },
              { label: "Women's Clothing", to: '/shop?category=womens-clothing' },
              { label: "Men's Clothing", to: '/shop?category=mens-clothing' },
              { label: 'Shoes', to: '/shop?category=shoes' },
              { label: 'Bags', to: '/shop?category=bags' },
              { label: 'Accessories', to: '/shop?category=accessories' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-sm font-medium text-[#111111] border-b border-[#F4F2EE]"
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-sm font-medium text-[#111111]"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
