import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Truck,
  Sparkles,
  ShoppingBag,
  Tag,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { CartItemEntry } from './CartDrawer.js';
import {
  apiCreateCheckoutOrder,
  apiVerifyOrderPayment,
  apiRetryOrderPayment,
} from '../api.js';
import { ShippingAddress, CheckoutResult } from '../types.js';
import { loadRazorpayScript } from '../utils/razorpay.js';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemEntry[];
  initialDiscountCode?: string | null;
  onPaymentSuccess: (order: any) => void;
  onCartCleared: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  initialDiscountCode,
  onPaymentSuccess,
  onCartCleared,
}) => {
  const { user } = useAuth();

  // Step state: 'address' | 'payment' | 'processing' | 'failed'
  const [step, setStep] = useState<'address' | 'payment' | 'processing' | 'failed'>('address');

  // Address Form State
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: user?.name || 'Jane Doe',
    email: user?.email || 'customer@example.com',
    phone: '+91 98765 43210',
    street: '42 MG Road, Koramangala',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560034',
    country: 'India',
  });

  // Discount code state
  const [discountCode, setDiscountCode] = useState(initialDiscountCode || '');
  const [discountApplied, setDiscountApplied] = useState(!!initialDiscountCode);

  // Active Order & Razorpay data
  const [checkoutData, setCheckoutData] = useState<CheckoutResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningRazorpay, setIsOpeningRazorpay] = useState(false);
  const [showTestCards, setShowTestCards] = useState(false);

  useEffect(() => {
    if (initialDiscountCode) {
      setDiscountCode(initialDiscountCode);
      setDiscountApplied(true);
    }
  }, [initialDiscountCode]);

  useEffect(() => {
    if (user) {
      setShippingAddress((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = discountApplied ? subtotal * 0.1 : 0;
  const totalAmount = Math.max(1, subtotal - discountAmount);
  const totalInr = Math.round(totalAmount * 83);

  // Handle Address Submit -> Create Pending Order & Razorpay Order
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await apiCreateCheckoutOrder({
        userId: user?.id || 'usr_cust_01',
        shippingAddress,
        discountCode: discountApplied ? discountCode : undefined,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      });

      setCheckoutData(result as any);
      setStep('payment');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Official Razorpay Checkout Modal (Opens real Razorpay Standard Checkout)
  const handleOpenRazorpayCheckout = async () => {
    if (!checkoutData || !checkoutData.razorpay) return;
    setIsOpeningRazorpay(true);
    setErrorMessage(null);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || typeof (window as any).Razorpay === 'undefined') {
        throw new Error('Razorpay SDK could not be loaded from CDN. Please check network connection or use the test actions below.');
      }

      const rzpOptions = {
        key: checkoutData.razorpay.key,
        amount: checkoutData.razorpay.amount,
        currency: checkoutData.razorpay.currency || 'INR',
        name: checkoutData.razorpay.name || 'Agentic Commerce Store',
        description: checkoutData.razorpay.description || `Order #${checkoutData.order.id.slice(-6)}`,
        order_id: checkoutData.razorpay.orderId,
        prefill: {
          name: shippingAddress.name || checkoutData.razorpay.prefill?.name || user?.name || 'Customer',
          email: shippingAddress.email || checkoutData.razorpay.prefill?.email || user?.email || 'customer@example.com',
          contact: shippingAddress.phone || checkoutData.razorpay.prefill?.contact || '+919876543210',
        },
        notes: {
          orderId: checkoutData.order.id,
          address: `${shippingAddress.street}, ${shippingAddress.city}`,
        },
        theme: {
          color: '#0284c7', // Sky-600
        },
        modal: {
          ondismiss: () => {
            setIsOpeningRazorpay(false);
          },
          escape: true,
          backdropclose: false,
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setStep('processing');
          setIsOpeningRazorpay(false);
          try {
            const verifyResult = await apiVerifyOrderPayment(checkoutData.order.id, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              simulateFailure: false,
            });

            if (verifyResult.success && verifyResult.status === 'paid') {
              onCartCleared();
              onPaymentSuccess(verifyResult.order);
              onClose();
            } else {
              setErrorMessage(verifyResult.error || 'Payment verification failed on server.');
              setStep('failed');
            }
          } catch (verifyErr: any) {
            setErrorMessage(verifyErr.message || 'Payment verification failed.');
            setStep('failed');
          }
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.on('payment.failed', (resp: any) => {
        setIsOpeningRazorpay(false);
        const reason = resp.error?.description || resp.error?.reason || 'Payment failed or declined by issuing bank.';
        handleSimulateFailure(reason);
      });

      rzp.open();
    } catch (err: any) {
      setIsOpeningRazorpay(false);
      setErrorMessage(err.message || 'Could not launch Razorpay Gateway.');
    }
  };

  // Handle Payment Verification (Success Path)
  const handleSimulateSuccess = async () => {
    if (!checkoutData) return;
    setStep('processing');
    setErrorMessage(null);

    try {
      const paymentId = `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const signature = `sig_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

      const verifyResult = await apiVerifyOrderPayment(checkoutData.order.id, {
        razorpayPaymentId: paymentId,
        razorpayOrderId: checkoutData.razorpay.orderId,
        razorpaySignature: signature,
        simulateFailure: false,
      });

      if (verifyResult.success && verifyResult.status === 'paid') {
        onCartCleared();
        onPaymentSuccess(verifyResult.order);
        onClose();
      } else {
        setErrorMessage(verifyResult.error || 'Payment verification failed');
        setStep('failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment verification error');
      setStep('failed');
    }
  };

  // Handle Payment Verification (Failure Path)
  const handleSimulateFailure = async (reason = 'Bank transaction declined: insufficient funds or invalid card details.') => {
    if (!checkoutData) return;
    setStep('processing');

    try {
      const verifyResult = await apiVerifyOrderPayment(checkoutData.order.id, {
        simulateFailure: true,
        failureReason: reason,
      });

      setErrorMessage(reason);
      setStep('failed');
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment declined.');
      setStep('failed');
    }
  };

  // Retry failed payment
  const handleRetryOrder = async () => {
    if (!checkoutData) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const retryResult = await apiRetryOrderPayment(checkoutData.order.id);
      setCheckoutData((prev) => prev ? { ...prev, order: retryResult.order, razorpay: retryResult.razorpay } : null);
      setStep('payment');
    } catch (err: any) {
      setErrorMessage(err.message || 'Retry failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-950/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Express Checkout
              </h2>
              <p className="text-xs text-neutral-500">
                Razorpay Test Mode • Secure 256-bit SSL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Step 1: Address Form */}
          {step === 'address' && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-sky-500" />
                  1. Shipping &amp; Contact Details
                </h3>
                <span className="text-[11px] text-neutral-400">Step 1 of 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.name}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={shippingAddress.email}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.country}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, country: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.street}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, street: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, city: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-neutral-600 dark:text-neutral-400 font-medium mb-1">
                    Postal / PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Coupon / Discount Code Box */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-950/50 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    Promo or Abandoned Cart Coupon
                  </span>
                  {discountApplied && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ 10% Discount Applied
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter CART10 or SAVE10"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold uppercase text-neutral-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (discountCode.trim()) {
                        setDiscountApplied(true);
                      }
                    }}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Order Summary Pill */}
              <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs space-y-1">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Cart Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountApplied && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Discount (10%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-neutral-900 dark:text-white pt-1 border-t border-sky-200/60 dark:border-sky-800/60">
                  <span>Total Amount</span>
                  <span className="font-mono">${totalAmount.toFixed(2)} (~₹{totalInr.toLocaleString('en-IN')})</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                {isSubmitting ? (
                  <span>Initializing Razorpay Order...</span>
                ) : (
                  <>
                    <span>Proceed to Payment Gateway</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Payment Gateway & Interactive Test Simulator */}
          {step === 'payment' && checkoutData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  2. Razorpay Payment Gateway
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  Order #{checkoutData.order.id.slice(-6)}
                </span>
              </div>

              {/* Order Details & Summary Card */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-950/60 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <div>
                    <span className="text-xs text-neutral-500">Payable Amount</span>
                    <div className="text-xl font-bold font-mono text-neutral-900 dark:text-white">
                      ₹{checkoutData.razorpay.amountInr?.toLocaleString('en-IN') || totalInr.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-neutral-500 font-sans">
                        (${checkoutData.order.totalAmount.toFixed(2)} USD)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-400 block">Razorpay Order ID</span>
                    <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                      {checkoutData.razorpay.orderId}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Razorpay Key:</span>
                    <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      {checkoutData.razorpay.key ? `${checkoutData.razorpay.key.slice(0, 12)}... (Connected)` : 'Default Test Key'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {shippingAddress.name} ({shippingAddress.email})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping to:</span>
                    <span className="font-medium text-neutral-900 dark:text-white truncate max-w-[240px]">
                      {shippingAddress.street}, {shippingAddress.city}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Notification if any */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Primary Action: Official Razorpay Checkout Modal */}
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  onClick={handleOpenRazorpayCheckout}
                  disabled={isOpeningRazorpay}
                  className="w-full p-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-between shadow-md group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold flex items-center gap-1.5">
                        Pay ₹{checkoutData.razorpay.amountInr?.toLocaleString('en-IN') || totalInr.toLocaleString('en-IN')} with Razorpay
                        <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <div className="text-[11px] text-sky-100 font-normal">
                        Launch Official Razorpay Modal (UPI, Cards, Netbanking)
                      </div>
                    </div>
                  </div>
                  {isOpeningRazorpay ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>

                {/* Collapsible Test Card Credentials Helper */}
                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/30">
                  <button
                    type="button"
                    onClick={() => setShowTestCards(!showTestCards)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                      <Info className="w-3.5 h-3.5 text-sky-500" />
                      Razorpay Test Mode Credentials Guide
                    </span>
                    {showTestCards ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showTestCards && (
                    <div className="px-3.5 pb-3 pt-1 text-[11px] border-t border-neutral-200 dark:border-neutral-800 space-y-2 text-neutral-600 dark:text-neutral-400">
                      <div className="grid grid-cols-2 gap-2 bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800">
                        <div>
                          <span className="text-[10px] text-neutral-400 block uppercase">Test Card Number</span>
                          <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">4111 1111 1111 1111</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block uppercase">Expiry / CVV</span>
                          <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">12/28 • 123</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block uppercase">OTP (3D Secure)</span>
                          <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">Any (e.g. 123456)</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-neutral-400 block uppercase">Test UPI ID</span>
                          <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">success@razorpay</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        When the Razorpay modal opens, enter the test details above or click "Success" in Razorpay's sandbox emulator.
                      </p>
                    </div>
                  )}
                </div>

                {/* Direct Simulation Options */}
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px bg-neutral-200 dark:border-neutral-800 flex-1"></div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400">or 1-click sandbox actions</span>
                    <div className="h-px bg-neutral-200 dark:border-neutral-800 flex-1"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Option A: Fast Simulate Success */}
                    <button
                      type="button"
                      onClick={handleSimulateSuccess}
                      className="p-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                      <span>Simulate Success</span>
                    </button>

                    {/* Option B: Fast Simulate Failure */}
                    <button
                      type="button"
                      onClick={() =>
                        handleSimulateFailure(
                          'Payment failed: Bank declined authorization (Insufficient funds or 3D Secure failure).'
                        )
                      }
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                      <span>Simulate Decline</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-neutral-400">
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline cursor-pointer"
                >
                  ← Edit Shipping Address
                </button>
                <div className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>Razorpay PCI-DSS Level 1</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Processing State */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full border-3 border-sky-500 border-t-transparent animate-spin" />
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Verifying Razorpay Payment...
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Processing cryptographic HMAC signature &amp; updating inventory database...
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Payment Failure View */}
          {step === 'failed' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2 text-center">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300">
                  Payment Was Not Completed
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 max-w-sm mx-auto">
                  {errorMessage || 'The payment gateway could not process this transaction.'}
                </p>
                <div className="inline-block px-2.5 py-1 rounded-md bg-white dark:bg-neutral-900 text-[11px] font-mono text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800">
                  Order Status: <span className="font-bold text-rose-500">FAILED</span> • Cart items preserved
                </div>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-950/50 rounded-xl text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Your cart is intact!
                </p>
                <p>
                  You can retry payment with another test card or review your shipping details.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRetryOrder}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Payment</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close &amp; Keep Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
