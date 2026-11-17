import type { CheckoutFormInput } from '../types/index';

export interface CartCalculationItem {
  price: number;
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  deliveryCost: number;
  total: number;
  itemCount: number;
  qualifiesForFreeShipping: boolean;
  amountToFreeShipping: number;
}

export const FREE_SHIPPING_THRESHOLD = 250;
export const STANDARD_DELIVERY_COST = 18;

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatPrice(amount: number): string {
  return `$${roundCurrency(amount).toLocaleString('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateDiscountPercent(
  price: number,
  originalPrice?: number | null
): number {
  if (!originalPrice || originalPrice <= price || originalPrice <= 0) {
    return 0;
  }
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function calculateCartTotals(
  items: CartCalculationItem[],
  freeShippingThreshold: number = FREE_SHIPPING_THRESHOLD,
  flatShipping: number = STANDARD_DELIVERY_COST
): CartTotals {
  let subtotal = 0;
  let itemCount = 0;

  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    const unitPrice = Math.max(0, item.price);
    subtotal += unitPrice * qty;
    itemCount += qty;
  }

  subtotal = roundCurrency(subtotal);
  const qualifiesForFreeShipping = subtotal >= freeShippingThreshold || subtotal === 0;
  const deliveryCost = subtotal === 0 ? 0 : qualifiesForFreeShipping ? 0 : flatShipping;
  const total = roundCurrency(subtotal + deliveryCost);
  const amountToFreeShipping =
    subtotal >= freeShippingThreshold
      ? 0
      : roundCurrency(freeShippingThreshold - subtotal);

  return {
    subtotal,
    deliveryCost,
    total,
    itemCount,
    qualifiesForFreeShipping,
    amountToFreeShipping,
  };
}

export function canAddToCart(
  variantStock: number,
  currentInCart: number,
  requestedQty: number
): { allowed: boolean; reason?: string; maxAddable: number } {
  const safeStock = Math.max(0, Math.floor(variantStock));
  const safeCurrent = Math.max(0, Math.floor(currentInCart));
  const safeRequested = Math.floor(requestedQty);

  if (safeStock <= 0) {
    return {
      allowed: false,
      reason: 'Selected size and color is currently out of stock.',
      maxAddable: 0,
    };
  }

  if (safeRequested <= 0) {
    return {
      allowed: false,
      reason: 'Quantity must be at least 1.',
      maxAddable: Math.max(0, safeStock - safeCurrent),
    };
  }

  const maxAddable = Math.max(0, safeStock - safeCurrent);
  if (safeCurrent + safeRequested > safeStock) {
    return {
      allowed: false,
      reason:
        maxAddable > 0
          ? `Only ${maxAddable} more available in stock.`
          : `Maximum available stock (${safeStock}) already in bag.`,
      maxAddable,
    };
  }

  return { allowed: true, maxAddable };
}

export function validateCheckoutForm(
  input: CheckoutFormInput
): { valid: boolean; errors: Partial<Record<keyof CheckoutFormInput, string>> } {
  const errors: Partial<Record<keyof CheckoutFormInput, string>> = {};

  if (!input.first_name || input.first_name.trim().length < 2) {
    errors.first_name = 'First name must be at least 2 characters.';
  }
  if (!input.last_name || input.last_name.trim().length < 2) {
    errors.last_name = 'Last name must be at least 2 characters.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  const phoneDigits = (input.phone || '').replace(/\D/g, '');
  if (phoneDigits.length < 7) {
    errors.phone = 'Please enter a valid phone number.';
  }
  if (!input.country || input.country.trim().length < 2) {
    errors.country = 'Country is required.';
  }
  if (!input.city || input.city.trim().length < 2) {
    errors.city = 'City is required.';
  }
  if (!input.delivery_address || input.delivery_address.trim().length < 5) {
    errors.delivery_address = 'Please enter your complete street address.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
