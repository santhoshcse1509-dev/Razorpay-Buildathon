import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Tag,
  Plus,
  Minus,
  Sparkles,
  ArrowLeft,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { CartItemEntry } from './CartDrawer.js';
import { Product } from '../types.js';

interface CartPageProps {
  items: CartItemEntry[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: (discountCode?: string) => void;
  onBackToShopping: () => void;
  onOpenProductDetail: (productId: string) => void;
  onTriggerIdleNudgeManual: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onBackToShopping,
  onOpenProductDetail,
  onTriggerIdleNudgeManual,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const discountAmount = appliedCoupon ? subtotal * 0.1 : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const finalTotalInr = Math.round(finalTotal * 83);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    if (code === 'CART10' || code === 'SAVE10') {
      setAppliedCoupon(code);
    } else {
      setCouponError('Invalid coupon code. Try "CART10" for 10% off.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <button
            onClick={onBackToShopping}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-sky-500" />
            Shopping Cart
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </span>
          </h1>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerIdleNudgeManual}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Simulates 2-minute idle detection to trigger Claude Abandoned Cart Nudge instantly"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulate Idle Nudge</span>
            </button>

            <button
              onClick={onClearCart}
              className="px-3 py-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Your cart is currently empty
            </h3>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Explore our tech gear, smart gadgets, and lifestyle catalog or chat with the AI shopping concierge!
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onBackToShopping}
              className="py-2.5 px-6 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-2"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Cart Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800 shadow-xs">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition"
                >
                  {/* Image & Product Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      onClick={() => onOpenProductDetail(item.product.id)}
                      className="w-20 h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 cursor-pointer flex items-center justify-center border border-neutral-200 dark:border-neutral-700"
                    >
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover hover:scale-105 transition"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-neutral-400" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {item.product.category}
                      </div>
                      <h3
                        onClick={() => onOpenProductDetail(item.product.id)}
                        className="text-sm font-bold text-neutral-900 dark:text-white truncate cursor-pointer hover:text-sky-500"
                      >
                        {item.product.name}
                      </h3>
                      <div className="text-xs text-neutral-500 font-mono">
                        ${item.product.price.toFixed(2)} each •{' '}
                        <span className={item.product.stock > 5 ? 'text-emerald-500' : 'text-amber-500'}>
                          {item.product.stock > 0 ? `${item.product.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Price Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
                    {/* Stepper */}
                    <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="p-1.5 px-2.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold font-mono min-w-[28px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="p-1.5 px-2.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Total Price */}
                    <div className="text-right min-w-[80px]">
                      <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        ~₹{Math.round(item.product.price * item.quantity * 83).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-2 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Promise Badge */}
            <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 rounded-2xl flex items-center gap-3 text-xs text-sky-800 dark:text-sky-300">
              <Truck className="w-4 h-4 shrink-0 text-sky-500" />
              <span>
                <strong className="font-bold">Fast &amp; Free Express Delivery</strong> — Orders placed today ship within 24 hours with complete tracking.
              </span>
            </div>
          </div>

          {/* Right Col: Order Summary & Coupon */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-5 shadow-xs">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Order Summary
              </h2>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  Have a Promo Code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. CART10"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span>✓ Coupon {appliedCoupon} applied (10% OFF)</span>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      className="text-neutral-400 hover:text-rose-500 text-[11px] underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-xs text-rose-500 font-medium">{couponError}</p>
                )}
              </form>

              {/* Cost Calculations */}
              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal ({totalCount} items)</span>
                  <span className="font-mono">${subtotal.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Promo Discount (10%)</span>
                    <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Standard Shipping</span>
                  <span className="font-medium text-emerald-500">FREE</span>
                </div>

                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Taxes &amp; Duties</span>
                  <span>Calculated at Checkout</span>
                </div>

                <div className="flex justify-between font-bold text-base text-neutral-900 dark:text-white pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <span>Estimated Total</span>
                  <div className="text-right">
                    <div className="font-mono">${finalTotal.toFixed(2)}</div>
                    <div className="text-[11px] text-neutral-500 font-normal">
                      (~₹{finalTotalInr.toLocaleString('en-IN')})
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkout CTA */}
              <button
                onClick={() => onCheckout(appliedCoupon || undefined)}
                className="w-full py-3.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Proceed to Razorpay Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Test Mode Enabled • Safe &amp; Fast</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
