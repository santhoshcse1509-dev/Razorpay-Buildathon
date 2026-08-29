import React from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Product } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

export interface CartItemEntry {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemEntry[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const { isAuthenticated } = useAuth();

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-sky-500" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Your Shopping Cart
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Your cart is currently empty
                </h3>
                <p className="text-xs text-neutral-400 max-w-xs">
                  Browse through our curated catalog and add your favorite electronics, apparel, and lifestyle gear.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 p-3 bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-xl"
                >
                  <div className="w-16 h-16 rounded-lg bg-neutral-200 dark:bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-neutral-400" />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        ${item.product.price.toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity selector */}
                      <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="px-2 py-0.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-neutral-400 hover:text-rose-500 transition cursor-pointer p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 space-y-4 bg-neutral-50/50 dark:bg-neutral-950/40">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Standard Shipping</span>
                  <span className="text-emerald-500 font-medium">FREE</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-neutral-900 dark:text-white pt-2 border-t border-neutral-200 dark:border-neutral-800">
                  <span>Total Amount</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                Proceed to Checkout
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>SSL Encrypted Checkout • Razorpay Test Gateway</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
