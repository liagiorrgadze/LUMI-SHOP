import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  calculateDiscountPercent,
  canAddToCart,
  validateCheckoutForm,
  slugify,
} from './commerce';

test('calculateDiscountPercent computes integer savings accurately', () => {
  assert.equal(calculateDiscountPercent(180, 240), 25);
  assert.equal(calculateDiscountPercent(200, 200), 0);
  assert.equal(calculateDiscountPercent(150, null), 0);
  assert.equal(calculateDiscountPercent(150, 100), 0);
});

test('calculateCartTotals applies shipping below threshold and free shipping at/above threshold', () => {
  const below = calculateCartTotals([{ price: 120, quantity: 1 }], 250, 18);
  assert.equal(below.subtotal, 120);
  assert.equal(below.deliveryCost, 18);
  assert.equal(below.total, 138);
  assert.equal(below.qualifiesForFreeShipping, false);
  assert.equal(below.amountToFreeShipping, 130);
  assert.equal(below.itemCount, 1);

  const above = calculateCartTotals(
    [
      { price: 150, quantity: 1 },
      { price: 65, quantity: 2 },
    ],
    250,
    18
  );
  assert.equal(above.subtotal, 280);
  assert.equal(above.deliveryCost, 0);
  assert.equal(above.total, 280);
  assert.equal(above.qualifiesForFreeShipping, true);
  assert.equal(above.amountToFreeShipping, 0);
  assert.equal(above.itemCount, 3);

  const empty = calculateCartTotals([], 250, 18);
  assert.equal(empty.subtotal, 0);
  assert.equal(empty.deliveryCost, 0);
  assert.equal(empty.total, 0);
});

test('canAddToCart enforces stock limits cleanly', () => {
  assert.deepEqual(canAddToCart(0, 0, 1), {
    allowed: false,
    reason: 'Selected size and color is currently out of stock.',
    maxAddable: 0,
  });

  assert.deepEqual(canAddToCart(5, 3, 2), {
    allowed: true,
    maxAddable: 2,
  });

  const exceeded = canAddToCart(5, 4, 2);
  assert.equal(exceeded.allowed, false);
  assert.equal(exceeded.maxAddable, 1);
});

test('validateCheckoutForm rejects invalid fields and accepts complete valid payloads', () => {
  const invalid = validateCheckoutForm({
    first_name: 'A',
    last_name: '',
    email: 'bad-email',
    phone: '123',
    country: '',
    city: 'T',
    delivery_address: '123',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.first_name);
  assert.ok(invalid.errors.last_name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.phone);
  assert.ok(invalid.errors.country);
  assert.ok(invalid.errors.city);
  assert.ok(invalid.errors.delivery_address);

  const valid = validateCheckoutForm({
    first_name: 'Claire',
    last_name: 'Laurent',
    email: 'claire@example.com',
    phone: '+1 555 234 5678',
    country: 'United States',
    city: 'New York',
    delivery_address: '412 Mercer Street, Apt 4B',
    delivery_instructions: 'Leave with concierge',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('slugify formats product and category slugs cleanly', () => {
  assert.equal(slugify("Women's Cashmere Trench Coat"), 'women-s-cashmere-trench-coat');
});
