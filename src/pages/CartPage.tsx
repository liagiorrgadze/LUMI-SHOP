import React from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';
import { useStore } from '../context/StoreContext';
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '../utils/commerce';

export function CartPage() {
  const { cartItems, cartTotals, updateCartQuantity, removeFromCart } = useStore();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="border-b border-[#E6E2DC] pb-6">
        <p className="text-xs font-medium tracking-[0.16em] uppercase text-[#71717A]">
          Your Selection
        </p>
        <h1 className="mt-1.5 font-editorial text-4xl font-normal text-[#111111]">
          Shopping Bag <span className="text-xl font-sans text-[#71717A] tabular-nums">({cartTotals.itemCount})</span>
        </h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="mt-12 border border-[#E6E2DC] bg-white px-6 py-20 text-center">
          <ShoppingBag className="mx-auto h-10 w-10 stroke-[1.2] text-[#8C7355]" />
          <h2 className="mt-4 font-editorial text-3xl text-[#111111]">Your shopping bag is empty</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#52525B]">
            Explore our seasonal womenswear, menswear tailoring, and handcrafted leather essentials.
          </p>
          <Link
            to="/shop"
            className="mt-7 inline-flex items-center gap-2 bg-[#111111] px-7 py-3.5 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#27272A]"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 items-start">
          {/* Items List */}
          <div className="lg:col-span-8">
            <ul className="divide-y divide-[#E6E2DC] border-t border-b border-[#E6E2DC] bg-white px-6">
              {cartItems.map((item) => (
                <li key={item.id} className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center">
                  <Link
                    to={`/product/${item.product_slug}`}
                    className="h-32 w-24 shrink-0 overflow-hidden bg-[#F4F2EE]"
                  >
                    <ProductImage
                      src={item.image_url}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product_slug}`}
                      className="text-base font-medium text-[#111111] hover:underline"
                    >
                      {item.product_name}
                    </Link>
                    <p className="mt-1 text-xs text-[#71717A]">
                      Color: {item.color} · Size: {item.size}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#111111] tabular-nums">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <div className="flex items-center border border-[#D4D0C8] bg-[#FAFAF8]">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        aria-label={`Decrease quantity for ${item.product_name}`}
                        className="flex h-9 w-9 items-center justify-center hover:bg-[#EFECE4]"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-9 text-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                        aria-label={`Increase quantity for ${item.product_name}`}
                        className="flex h-9 w-9 items-center justify-center hover:bg-[#EFECE4] disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="w-24 text-right text-sm font-semibold text-[#111111] tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.product_name} from shopping bag`}
                      className="p-2 text-[#71717A] hover:text-[#991B1B]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Summary Panel */}
          <aside className="border border-[#E6E2DC] bg-white p-7 lg:col-span-4">
            <h2 className="font-editorial text-2xl text-[#111111]">Order Summary</h2>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#52525B]">Subtotal</span>
                <span className="font-medium text-[#111111] tabular-nums">
                  {formatPrice(cartTotals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52525B]">Delivery</span>
                <span className="font-medium text-[#111111] tabular-nums">
                  {cartTotals.deliveryCost === 0 ? 'Complimentary' : formatPrice(cartTotals.deliveryCost)}
                </span>
              </div>
              {!cartTotals.qualifiesForFreeShipping && (
                <p className="bg-[#F4F2EE] p-3 text-xs text-[#52525B] tabular-nums">
                  Add {formatPrice(cartTotals.amountToFreeShipping)} more for complimentary delivery (over{' '}
                  {formatPrice(FREE_SHIPPING_THRESHOLD)}).
                </p>
              )}
              <div className="flex justify-between border-t border-[#E6E2DC] pt-4 text-base font-semibold text-[#111111]">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(cartTotals.total)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-[#111111] text-xs font-semibold tracking-wider uppercase text-white transition-colors hover:bg-[#27272A]"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-xs text-[#71717A]">
              Cash on Delivery available · Secure order confirmation
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
