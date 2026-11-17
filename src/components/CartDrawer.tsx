import React from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatPrice, FREE_SHIPPING_THRESHOLD } from '../utils/commerce';
import { ProductImage } from './ProductImage';

export function CartDrawer() {
  const {
    cartItems,
    cartTotals,
    isCartOpen,
    closeCart,
    updateCartQuantity,
    removeFromCart,
  } = useStore();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping bag">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-[#FAFAF8] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E6E2DC] px-6 py-4">
          <h2 className="font-editorial text-2xl font-medium text-[#111111]">
            Shopping Bag <span className="text-base font-sans text-[#71717A] tabular-nums">({cartTotals.itemCount})</span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close shopping bag"
            className="flex h-9 w-9 items-center justify-center text-[#52525B] hover:bg-[#F4F2EE] hover:text-[#111111]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {cartItems.length > 0 && (
          <div className="border-b border-[#E6E2DC] bg-[#F4F2EE] px-6 py-2.5 text-xs text-[#3F3F46]">
            {cartTotals.qualifiesForFreeShipping ? (
              <span>Complimentary express shipping unlocked on your order.</span>
            ) : (
              <span className="tabular-nums">
                Add {formatPrice(cartTotals.amountToFreeShipping)} more for complimentary shipping (orders over{' '}
                {formatPrice(FREE_SHIPPING_THRESHOLD)}).
              </span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="h-10 w-10 stroke-[1.2] text-[#8C7355] mb-3" />
              <p className="font-editorial text-2xl text-[#111111]">Your bag is empty</p>
              <p className="mt-1 text-sm text-[#71717A] max-w-xs">
                Explore our new season tailoring, silk dresses, and Italian leather goods.
              </p>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate('/shop');
                }}
                className="mt-6 bg-[#111111] px-6 py-3 text-xs font-medium tracking-wide text-white transition-colors hover:bg-[#27272A]"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[#E6E2DC]">
              {cartItems.map((item) => (
                <li key={item.id} className="flex gap-4 py-4">
                  <Link
                    to={`/product/${item.product_slug}`}
                    onClick={closeCart}
                    className="h-24 w-20 shrink-0 overflow-hidden bg-[#F4F2EE]"
                  >
                    <ProductImage
                      src={item.image_url}
                      alt={item.product_name}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${item.product_slug}`}
                          onClick={closeCart}
                          className="text-sm font-medium text-[#111111] hover:underline truncate"
                        >
                          {item.product_name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.product_name} from bag`}
                          className="text-[#71717A] hover:text-[#111111] p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-[#71717A]">
                        {item.color} · Size {item.size}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-[#D4D0C8] bg-white">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          aria-label={`Decrease quantity of ${item.product_name}`}
                          className="flex h-8 w-8 items-center justify-center text-[#111111] hover:bg-[#F4F2EE]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock_quantity}
                          aria-label={`Increase quantity of ${item.product_name}`}
                          className="flex h-8 w-8 items-center justify-center text-[#111111] hover:bg-[#F4F2EE] disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-medium text-[#111111] tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-[#E6E2DC] bg-white px-6 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#52525B]">Subtotal</span>
              <span className="font-medium text-[#111111] tabular-nums">
                {formatPrice(cartTotals.subtotal)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs text-[#71717A]">
              <span>Estimated Delivery</span>
              <span className="tabular-nums">
                {cartTotals.deliveryCost === 0 ? 'Complimentary' : formatPrice(cartTotals.deliveryCost)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate('/cart');
                }}
                className="border border-[#111111] bg-white py-3 text-xs font-medium tracking-wide text-[#111111] transition-colors hover:bg-[#F4F2EE]"
              >
                View Bag
              </button>
              <button
                type="button"
                onClick={() => {
                  closeCart();
                  navigate('/checkout');
                }}
                className="bg-[#111111] py-3 text-xs font-medium tracking-wide text-white transition-colors hover:bg-[#27272A]"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
