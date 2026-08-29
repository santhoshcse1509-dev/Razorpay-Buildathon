import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Package,
  Plus,
  Truck,
  ExternalLink,
  X,
  CreditCard,
} from 'lucide-react';
import { apiGetPostPurchaseCrossSell } from '../api.js';
import { Product, PostPurchaseData } from '../types.js';

interface OrderConfirmationModalProps {
  isOpen: boolean;
  order: any | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onOpenProductDetail: (productId: string) => void;
  onViewOrders: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  order,
  onClose,
  onAddToCart,
  onOpenProductDetail,
  onViewOrders,
}) => {
  const [postPurchaseData, setPostPurchaseData] = useState<PostPurchaseData | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [crossSellAdded, setCrossSellAdded] = useState(false);

  useEffect(() => {
    if (isOpen && order?.id) {
      setLoadingAi(true);
      setCrossSellAdded(false);
      apiGetPostPurchaseCrossSell(order.id)
        .then((res) => {
          setPostPurchaseData(res);
        })
        .catch(() => {
          // Gracefully fallback
        })
        .finally(() => {
          setLoadingAi(false);
        });
    }
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const items = order.items || [];
  const shipping = order.shippingAddress;

  const handleAddCrossSell = (product: Product) => {
    onAddToCart(product, 1);
    setCrossSellAdded(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Confetti / Success Header */}
        <div className="bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent p-6 border-b border-emerald-500/20 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                <span>Payment Verified • Razorpay</span>
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                Order Confirmed!
              </h2>
              <p className="text-xs text-neutral-500 font-mono">
                Order #{order.id.slice(-8)} • {new Date(order.createdAt || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Post-Purchase AI Thank You & Cross-Sell Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-200 dark:border-sky-800/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-300">
                  AI Concierge Post-Purchase Recommendation
                </h3>
              </div>
              <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">
                Claude Tool Engine
              </span>
            </div>

            {loadingAi ? (
              <div className="py-4 flex items-center gap-3 text-xs text-neutral-500">
                <div className="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                <span>Agent is analyzing your purchased items for personalized recommendations...</span>
              </div>
            ) : postPurchaseData?.thankYouMessage ? (
              <div className="text-xs text-neutral-700 dark:text-neutral-200 bg-white/80 dark:bg-neutral-950/60 p-3.5 rounded-xl border border-sky-100 dark:border-sky-900/40 leading-relaxed">
                {postPurchaseData.thankYouMessage}
              </div>
            ) : null}

            {/* ONE Tailored Cross-Sell Product */}
            {postPurchaseData?.crossSellProduct && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  Recommended Companion Gear:
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {postPurchaseData.crossSellProduct.imageUrl ? (
                        <img
                          src={postPurchaseData.crossSellProduct.imageUrl}
                          alt={postPurchaseData.crossSellProduct.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {postPurchaseData.crossSellProduct.name}
                      </h4>
                      <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium line-clamp-1">
                        {postPurchaseData.crossSellProduct.recommendationReason ||
                          'Top customer pairing with your recent purchase.'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="font-bold text-neutral-900 dark:text-white font-mono">
                          ${postPurchaseData.crossSellProduct.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          (~₹{Math.round(postPurchaseData.crossSellProduct.price * 83).toLocaleString('en-IN')})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <button
                      onClick={() => onOpenProductDetail(postPurchaseData.crossSellProduct!.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                    >
                      Details
                    </button>

                    <button
                      onClick={() => handleAddCrossSell(postPurchaseData.crossSellProduct!)}
                      disabled={crossSellAdded}
                      className="flex-1 sm:flex-initial py-1.5 px-3 bg-sky-600 hover:bg-sky-500 disabled:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {crossSellAdded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Added to Cart</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Next Order</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Purchased Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-neutral-500" />
                Purchased Items ({items.reduce((s: number, i: any) => s + i.quantity, 0)})
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                Total: ${order.totalAmount.toFixed(2)}
              </span>
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/50 dark:bg-neutral-950/40">
              {items.map((item: any, idx: number) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800 shrink-0 overflow-hidden flex items-center justify-center">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-semibold text-neutral-900 dark:text-white truncate">
                        {item.product?.name || 'Product'}
                      </h5>
                      <span className="text-[11px] text-neutral-500">
                        Qty: {item.quantity} × ${item.priceAtPurchase.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-bold text-neutral-900 dark:text-white shrink-0">
                    ${(item.quantity * item.priceAtPurchase).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Payment Summary */}
          {shipping && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-sky-500" />
                  Delivery Address
                </div>
                <div className="text-neutral-600 dark:text-neutral-400">
                  <p className="font-medium text-neutral-900 dark:text-white">{shipping.name}</p>
                  <p>{shipping.street}</p>
                  <p>
                    {shipping.city}, {shipping.state} {shipping.postalCode}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                  Payment Status
                </div>
                <div className="text-neutral-600 dark:text-neutral-400">
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">PAID (Test Gateway)</p>
                  <p className="font-mono text-[11px]">Payment ID: {order.razorpayPaymentId || 'pay_test'}</p>
                  <p className="text-[11px]">Inventory stock updated automatically</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                onClose();
                onViewOrders();
              }}
              className="px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              View Order History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
