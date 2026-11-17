import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ordersApi } from '../services/api';
import type { Order } from '../types/index';
import { formatPrice } from '../utils/commerce';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const stateOrder = (location.state as { order?: Order } | null)?.order;
  const [order, setOrder] = useState<Order | null>(stateOrder || null);
  const [loading, setLoading] = useState(!stateOrder);

  useEffect(() => {
    if (!stateOrder && id) {
      ordersApi
        .getById(id)
        .then(setOrder)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id, stateOrder]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-sm text-[#52525B]">
        Retrieving order confirmation...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-editorial text-4xl text-[#111111]">Order Receipt Unavailable</h1>
        <p className="mt-3 text-sm text-[#52525B]">
          Sign in to your account to view your complete order history.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-block bg-[#111111] px-7 py-3 text-xs font-semibold tracking-wider uppercase text-white"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="border border-[#E6E2DC] bg-white p-8 sm:p-10">
        <div className="flex items-center gap-3 text-[#166534]">
          <CheckCircle2 className="h-6 w-6" />
          <span className="text-xs font-semibold uppercase tracking-wider">Order Confirmed</span>
        </div>

        <h1 className="mt-3 font-editorial text-4xl text-[#111111]">
          Thank you, {order.first_name}
        </h1>
        <p className="mt-2 text-sm text-[#52525B]">
          Your order <span className="font-mono font-medium text-[#111111]">{order.order_number}</span> has
          been received and is now <span className="font-medium text-[#111111]">{order.status}</span>.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 border-y border-[#E6E2DC] py-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">
              Delivery Recipient
            </p>
            <p className="mt-2 font-medium text-[#111111]">
              {order.first_name} {order.last_name}
            </p>
            <p className="text-[#52525B]">{order.delivery_address}</p>
            <p className="text-[#52525B]">
              {order.city}, {order.country}
            </p>
            <p className="mt-1 text-[#52525B] tabular-nums">{order.phone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">
              Payment &amp; Status
            </p>
            <p className="mt-2 font-medium text-[#111111]">
              {order.payment_method === 'COD' ? 'Cash on Delivery (COD)' : order.payment_method}
            </p>
            <p className="text-[#52525B]">Payment Status: {order.payment_status}</p>
            <p className="text-[#52525B]">Fulfillment: {order.status}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">
            Ordered Items
          </h2>
          <ul className="mt-3 divide-y divide-[#F4F2EE]">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-[#111111]">{item.product_name}</p>
                  <p className="text-xs text-[#71717A] tabular-nums">
                    {item.color} · {item.size} · Qty {item.quantity}
                  </p>
                </div>
                <span className="font-medium text-[#111111] tabular-nums">
                  {formatPrice(item.line_total)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-y-2 border-t border-[#E6E2DC] pt-4 text-sm">
          <div className="flex justify-between text-[#52525B]">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[#52525B]">
            <span>Delivery</span>
            <span className="tabular-nums">
              {order.delivery_cost === 0 ? 'Complimentary' : formatPrice(order.delivery_cost)}
            </span>
          </div>
          <div className="flex justify-between pt-2 text-base font-semibold text-[#111111]">
            <span>Total Due ({order.payment_method})</span>
            <span className="tabular-nums">{formatPrice(order.total_amount)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/shop"
            className="bg-[#111111] px-6 py-3 text-xs font-semibold tracking-wider uppercase text-white hover:bg-[#27272A]"
          >
            Continue Shopping
          </Link>
          <Link
            to="/profile"
            className="border border-[#111111] px-6 py-3 text-xs font-semibold tracking-wider uppercase text-[#111111] hover:bg-[#F4F2EE]"
          >
            View Order History
          </Link>
        </div>
      </div>
    </div>
  );
}
