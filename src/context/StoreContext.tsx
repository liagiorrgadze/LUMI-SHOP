import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi, getApiErrorMessage, wishlistApi } from '../services/api';
import type { CartItem, Product, ProductVariant, WishlistItem } from '../types/index';
import { calculateCartTotals, canAddToCart, type CartTotals } from '../utils/commerce';
import { useAuth } from './AuthContext';

const GUEST_CART_KEY = 'lumi_guest_cart';
const GUEST_WISHLIST_KEY = 'lumi_guest_wishlist';

interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error';
}

interface StoreContextValue {
  cartItems: CartItem[];
  cartTotals: CartTotals;
  wishlistItems: WishlistItem[];
  wishlistProductIds: Set<number>;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => Promise<boolean>;
  updateCartQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  clearLocalCartAfterOrder: () => void;
  toggleWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  toast: ToastMessage | null;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function loadGuestWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
    return raw ? (JSON.parse(raw) as WishlistItem[]) : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadGuestCart());
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => loadGuestWishlist());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ id, text, type });
    window.setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3200);
  }, []);

  // Sync guest cart & wishlist with backend when user authenticates
  useEffect(() => {
    let active = true;
    async function hydrateUserStore() {
      if (isAuthenticated && user) {
        try {
          const guestCart = loadGuestCart();
          let serverCart: CartItem[];
          if (guestCart.length > 0) {
            serverCart = await cartApi.sync(
              guestCart.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity }))
            );
            localStorage.removeItem(GUEST_CART_KEY);
          } else {
            serverCart = await cartApi.get();
          }
          const guestWish = loadGuestWishlist();
          if (guestWish.length > 0) {
            for (const w of guestWish) {
              await wishlistApi.add(w.product_id).catch(() => {});
            }
            localStorage.removeItem(GUEST_WISHLIST_KEY);
          }
          const serverWish = await wishlistApi.get();
          if (active) {
            setCartItems(serverCart);
            setWishlistItems(serverWish);
          }
        } catch {
          // fallback silently if token expired
        }
      } else {
        setCartItems(loadGuestCart());
        setWishlistItems(loadGuestWishlist());
      }
    }
    hydrateUserStore();
    return () => {
      active = false;
    };
  }, [isAuthenticated, user]);

  // Persist guest cart & wishlist to localStorage when unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isAuthenticated]);

  const addToCart = async (
    product: Product,
    variant: ProductVariant,
    quantity = 1
  ): Promise<boolean> => {
    const existing = cartItems.find((i) => i.variant_id === variant.id);
    const check = canAddToCart(variant.stock_quantity, existing?.quantity || 0, quantity);
    if (!check.allowed) {
      showToast(check.reason || 'Insufficient stock.', 'error');
      return false;
    }

    if (isAuthenticated) {
      try {
        const updated = await cartApi.add({
          product_id: product.id,
          variant_id: variant.id,
          quantity,
        });
        setCartItems(updated);
        setIsCartOpen(true);
        showToast(`Added ${product.name} to your bag.`);
        return true;
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Could not add item to bag.'), 'error');
        return false;
      }
    }

    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.variant_id === variant.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
        return copy;
      }
      const primaryImg = product.images[0]?.image_url || '';
      return [
        {
          id: variant.id,
          product_id: product.id,
          variant_id: variant.id,
          product_name: product.name,
          product_slug: product.slug,
          price: product.price,
          original_price: product.original_price,
          image_url: primaryImg,
          size: variant.size,
          color: variant.color,
          color_hex: variant.color_hex,
          stock_quantity: variant.stock_quantity,
          quantity,
        },
        ...prev,
      ];
    });
    setIsCartOpen(true);
    showToast(`Added ${product.name} to your bag.`);
    return true;
  };

  const updateCartQuantity = async (cartItemId: number, quantity: number): Promise<void> => {
    const target = cartItems.find((i) => i.id === cartItemId);
    if (!target) return;

    if (quantity > target.stock_quantity) {
      showToast(`Only ${target.stock_quantity} available in stock.`, 'error');
      return;
    }

    if (isAuthenticated) {
      try {
        const updated = await cartApi.updateQuantity(cartItemId, quantity);
        setCartItems(updated);
      } catch (err) {
        showToast(getApiErrorMessage(err, 'Could not update bag.'), 'error');
      }
      return;
    }

    setCartItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.id !== cartItemId)
        : prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i))
    );
  };

  const removeFromCart = async (cartItemId: number): Promise<void> => {
    if (isAuthenticated) {
      try {
        const updated = await cartApi.remove(cartItemId);
        setCartItems(updated);
      } catch (err) {
        showToast(getApiErrorMessage(err), 'error');
      }
      return;
    }
    setCartItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const clearLocalCartAfterOrder = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem(GUEST_CART_KEY);
  }, []);

  const wishlistProductIds = useMemo(
    () => new Set(wishlistItems.map((w) => w.product_id)),
    [wishlistItems]
  );

  const toggleWishlist = async (product: Product): Promise<void> => {
    const exists = wishlistProductIds.has(product.id);
    if (isAuthenticated) {
      try {
        const updated = exists
          ? await wishlistApi.remove(product.id)
          : await wishlistApi.add(product.id);
        setWishlistItems(updated);
        showToast(exists ? 'Removed from wishlist.' : `Saved ${product.name} to wishlist.`);
      } catch (err) {
        showToast(getApiErrorMessage(err), 'error');
      }
      return;
    }

    setWishlistItems((prev) => {
      if (exists) {
        return prev.filter((w) => w.product_id !== product.id);
      }
      return [
        {
          id: product.id,
          product_id: product.id,
          product,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ];
    });
    showToast(exists ? 'Removed from wishlist.' : `Saved ${product.name} to wishlist.`);
  };

  const removeFromWishlist = async (productId: number): Promise<void> => {
    if (isAuthenticated) {
      try {
        const updated = await wishlistApi.remove(productId);
        setWishlistItems(updated);
      } catch (err) {
        showToast(getApiErrorMessage(err), 'error');
      }
      return;
    }
    setWishlistItems((prev) => prev.filter((w) => w.product_id !== productId));
  };

  const cartTotals = useMemo(() => calculateCartTotals(cartItems), [cartItems]);

  return (
    <StoreContext.Provider
      value={{
        cartItems,
        cartTotals,
        wishlistItems,
        wishlistProductIds,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearLocalCartAfterOrder,
        toggleWishlist,
        removeFromWishlist,
        toast,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
