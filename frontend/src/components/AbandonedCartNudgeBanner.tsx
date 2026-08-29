import React from 'react';
import { Sparkles, ShoppingBag, X, ArrowRight, Tag, Clock } from 'lucide-react';
import { AbandonedCartNudge } from '../types.js';

interface AbandonedCartNudgeBannerProps {
  nudge: AbandonedCartNudge | null;
  isOpen: boolean;
  onDismiss: () => void;
  onProceedToCheckout: (discountCode?: string) => void;
}

export const AbandonedCartNudgeBanner: React.FC<AbandonedCartNudgeBannerProps> = ({
  nudge,
  isOpen,
  onDismiss,
  onProceedToCheckout,
}) => {
  if (!isOpen || !nudge) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-amber-300/80 dark:border-amber-500/40 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent px-4 py-3 border-b border-amber-200/50 dark:border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                {nudge.title || '🛒 Still thinking about your items?'}
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  AI Concierge
                </span>
              </h4>
              <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                Abandoned cart reminder triggered
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-md transition cursor-pointer"
            title="Dismiss reminder"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner Body */}
        <div className="p-4 space-y-3">
          {/* AI Personalized Message */}
          <div className="text-xs text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-950/50 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 leading-relaxed font-sans">
            {nudge.message}
          </div>

          {/* Cart Items Preview */}
          {nudge.items && nudge.items.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {nudge.items.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg text-[11px] shrink-0 max-w-[140px]"
                >
                  <ShoppingBag className="w-3 h-3 text-neutral-500 shrink-0" />
                  <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">
                    {item.name}
                  </span>
                  <span className="font-mono text-neutral-500 shrink-0">
                    ${item.price.toFixed(0)}
                  </span>
                </div>
              ))}
              {nudge.items.length > 3 && (
                <span className="text-[10px] text-neutral-400 shrink-0">
                  +{nudge.items.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Coupon Code Pill & Action Button */}
          <div className="flex items-center gap-2 pt-1">
            {nudge.discountCode && (
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold shrink-0">
                <Tag className="w-3 h-3" />
                <span>{nudge.discountCode} (-10%)</span>
              </div>
            )}

            <button
              onClick={() => onProceedToCheckout(nudge.discountCode || 'CART10')}
              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Complete Order with 10% Off</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-[10px] text-neutral-400 text-center font-mono">
            Logged to Notification audit table • No real email sent
          </div>
        </div>
      </div>
    </div>
  );
};
