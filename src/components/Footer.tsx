import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-[#E6E2DC] bg-[#111111] text-[#FAFAF8]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link to="/" className="font-editorial text-2xl font-semibold tracking-[0.14em] text-white">
              LUMI STORE
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA]">
              Contemporary minimalism sculpted from Italian wool, mulberry silk, and vegetable-tanned leather.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">Collections</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">
                  All Arrivals
                </Link>
              </li>
              <li>
                <Link to="/shop?category=womens-clothing" className="hover:text-white transition-colors">
                  Women&apos;s Clothing
                </Link>
              </li>
              <li>
                <Link to="/shop?category=mens-clothing" className="hover:text-white transition-colors">
                  Men&apos;s Clothing
                </Link>
              </li>
              <li>
                <Link to="/shop?category=shoes" className="hover:text-white transition-colors">
                  Footwear
                </Link>
              </li>
              <li>
                <Link to="/shop?category=bags" className="hover:text-white transition-colors">
                  Bags &amp; Leather
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">Client Services</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#A1A1AA]">
              <li>
                <Link to="/profile" className="hover:text-white transition-colors">
                  My Account &amp; Orders
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-white transition-colors">
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shopping Bag
                </Link>
              </li>
              <li>
                <Link to="/shop?onSale=true" className="hover:text-white transition-colors">
                  Seasonal Offers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-wider text-white uppercase">Atelier &amp; Contact</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-[#A1A1AA]">
              <li>720 Madison Avenue, New York</li>
              <li>concierge@lumistore.com</li>
              <li className="tabular-nums">+1 (212) 555-0192</li>
              <li className="pt-2 flex items-center gap-4 text-xs text-[#D4D4D8]">
                <a href="#instagram" onClick={(e) => e.preventDefault()} className="hover:text-white">
                  Instagram
                </a>
                <span aria-hidden="true">·</span>
                <a href="#pinterest" onClick={(e) => e.preventDefault()} className="hover:text-white">
                  Pinterest
                </a>
                <span aria-hidden="true">·</span>
                <a href="#journal" onClick={(e) => e.preventDefault()} className="hover:text-white">
                  Journal
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#A1A1AA] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} LUMI STORE. All rights reserved.</p>
          <p>Complimentary express delivery on orders above $250 · Cash on Delivery available</p>
        </div>
      </div>
    </footer>
  );
}
