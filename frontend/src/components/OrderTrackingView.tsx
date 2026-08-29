import React, { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  CreditCard,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { fetchOrders, apiTrackOrder } from '../api.js';
import { Order, Product } from '../types.js';
import { useAuth } from '../context/AuthContext.js';

interface OrderTrackingViewProps {
  onNavigateToCatalog: () => void;
  onOpenProductDetail: (productId: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onAskAiWithQuery: (query: string) => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  onNavigateToCatalog,
  onOpenProductDetail,
  onAddToCart,
  onAskAiWithQuery,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Processing' | 'Shipped' | 'Delivered' | 'Pending' | 'Failed'>('all');
  const [selectedUserIdFilter, setSelectedUserIdFilter] = useState<string>('all');

  // Direct Track Single Order Lookup Modal/State
  const [singleTrackLoading, setSingleTrackLoading] = useState(false);
  const [singleTrackResult, setSingleTrackResult] = useState<Order | null>(null);
  const [singleTrackError, setSingleTrackError] = useState<string | null>(null);

  // Expanded Timeline Accordion state by Order ID
  const [expandedTimelines, setExpandedTimelines] = useState<Record<string, boolean>>({});

  // Copied tracking number feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reorder added feedback
  const [reorderedOrderId, setReorderedOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      // If user is authenticated and not selecting 'all', or default to all orders
      const targetUserId = selectedUserIdFilter !== 'all' ? selectedUserIdFilter : (isAuthenticated && user?.role !== 'admin' ? user?.id : undefined);
      const res = await fetchOrders(targetUserId);
      setOrders(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [isAuthenticated, user?.id, selectedUserIdFilter]);

  const handleDirectSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setSingleTrackResult(null);
      setSingleTrackError(null);
      return;
    }

    setSingleTrackLoading(true);
    setSingleTrackError(null);
    try {
      const res = await apiTrackOrder(searchQuery.trim());
      setSingleTrackResult(res.order);
      // Auto expand timeline for direct lookup
      setExpandedTimelines((prev) => ({ ...prev, [res.order.id]: true }));
    } catch (err: any) {
      setSingleTrackError(err.message || `No order found matching "${searchQuery}"`);
      setSingleTrackResult(null);
    } finally {
      setSingleTrackLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleTimeline = (orderId: string) => {
    setExpandedTimelines((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleReorder = (order: Order) => {
    let count = 0;
    order.items.forEach((item) => {
      if (item.product) {
        onAddToCart(item.product as Product, item.quantity);
        count++;
      }
    });
    setReorderedOrderId(order.id);
    setTimeout(() => setReorderedOrderId(null), 2500);
  };

  // Filter orders by status and text query
  const filteredOrders = orders.filter((o) => {
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'Pending' && o.status !== 'pending') return false;
      if (statusFilter === 'Failed' && o.status !== 'failed') return false;
      if (['Processing', 'Shipped', 'Delivered'].includes(statusFilter)) {
        if (o.fulfillmentStatus !== statusFilter) return false;
      }
    }

    // Text Search filter (if not using single direct track view)
    if (searchQuery.trim() && !singleTrackResult) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = o.id.toLowerCase().includes(q);
      const matchTrk = o.trackingNumber ? o.trackingNumber.toLowerCase().includes(q) : false;
      const matchUser = o.user?.name.toLowerCase().includes(q) || o.user?.email.toLowerCase().includes(q);
      const matchProduct = o.items.some((item) => item.product?.name.toLowerCase().includes(q));
      return matchId || matchTrk || matchUser || matchProduct;
    }

    return true;
  });

  // Calculate status counts for filter badges
  const counts = {
    all: orders.length,
    processing: orders.filter((o) => o.fulfillmentStatus === 'Processing').length,
    shipped: orders.filter((o) => o.fulfillmentStatus === 'Shipped').length,
    delivered: orders.filter((o) => o.fulfillmentStatus === 'Delivered').length,
    pendingOrFailed: orders.filter((o) => o.status === 'pending' || o.status === 'failed').length,
  };

  const getStatusBadge = (order: Order) => {
    const status = order.fulfillmentStatus || (order.status === 'paid' ? 'Delivered' : order.status === 'pending' ? 'Payment Pending' : 'Payment Failed');

    switch (status) {
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Delivered
          </span>
        );
      case 'Shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <Truck className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
            In Transit / Shipped
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Processing & Packing
          </span>
        );
      case 'Payment Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">
            <Clock className="w-3.5 h-3.5 text-yellow-600" />
            Awaiting Payment
          </span>
        );
      case 'Payment Failed':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Payment Failed
          </span>
        );
    }
  };

  const getStepProgressPercentage = (order: Order): number => {
    if (order.status === 'failed') return 25;
    if (order.status === 'pending') return 25;
    if (order.fulfillmentStatus === 'Processing') return 50;
    if (order.fulfillmentStatus === 'Shipped') return 75;
    if (order.fulfillmentStatus === 'Delivered') return 100;
    return 100;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  Order Tracking & Shipment History
                </h1>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Real-time status, timeline milestones, carrier tracking, and past purchases
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setSingleTrackResult(null);
                setSingleTrackError(null);
                loadOrders();
              }}
              disabled={loading}
              className="px-3 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition cursor-pointer flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onNavigateToCatalog}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 transition shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Browse Catalog
            </button>
          </div>
        </div>

        {/* Search Bar & Direct Tracking Lookup */}
        <form onSubmit={handleDirectSearch} className="mt-5 flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by Order ID (e.g. ord_hist_01), Tracking # (e.g. TRK-HIST01), or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSingleTrackResult(null);
                  setSingleTrackError(null);
                }}
                className="absolute right-2.5 top-2 text-[11px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 bg-neutral-200 dark:bg-neutral-700 px-2 py-0.5 rounded cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={singleTrackLoading || !searchQuery.trim()}
            className="px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-xs rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {singleTrackLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            Track Specific Order
          </button>
        </form>

        {/* Auth prompt banner if not logged in */}
        {!isAuthenticated && (
          <div className="mt-4 p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-sky-800 dark:text-sky-300">
              <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>
                Viewing all store demonstration orders. <strong>Sign in</strong> to filter to your personal order history.
              </span>
            </div>
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-semibold text-sky-700 dark:text-sky-300 hover:underline cursor-pointer flex items-center gap-1"
            >
              Sign In to Your Account <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Demo Account Switcher */}
        <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filter by Customer:</span>
            <select
              value={selectedUserIdFilter}
              onChange={(e) => setSelectedUserIdFilter(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All Customers (Store View)</option>
              <option value="usr_cust_01">Alice Customer (AcousticPro & Merino)</option>
              <option value="usr_cust_02">Bob Customer (AeroTrack Runner)</option>
              <option value="usr_cust_05">Eva Customer (TheraPulse & Yoga)</option>
              <option value="usr_cust_08">Hannah Customer (Chronos Keyboard)</option>
              <option value="usr_cust_10">Julia Customer (AcousticPro & MagSafe)</option>
              <option value="usr_cust_15">Olivia Customer (Failed Order Demo)</option>
            </select>
          </div>

          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Showing <strong>{filteredOrders.length}</strong> orders
          </div>
        </div>
      </div>

      {/* Filter Tabs by Fulfillment Status */}
      {!singleTrackResult && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs font-semibold'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            All Orders
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('Processing')}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'Processing'
                ? 'bg-amber-500 text-white shadow-2xs font-semibold'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-500" />
            Processing
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {counts.processing}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('Shipped')}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'Shipped'
                ? 'bg-sky-600 text-white shadow-2xs font-semibold'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <Truck className="w-3 h-3 text-sky-500" />
            Shipped / In Transit
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-800 font-bold">
              {counts.shipped}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('Delivered')}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'Delivered'
                ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Delivered
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
              {counts.delivered}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'Pending'
                ? 'bg-yellow-600 text-white shadow-2xs font-semibold'
                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-yellow-500" />
            Payment Pending / Failed
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-yellow-100 text-yellow-800 font-bold">
              {counts.pendingOrFailed}
            </span>
          </button>
        </div>
      )}

      {/* Direct Search Single Order Result Banner (if tracked specifically) */}
      {singleTrackResult && (
        <div className="bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center font-bold text-xs">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-sky-900 dark:text-sky-200">
                Direct Tracking Result for: <code className="font-mono">{searchQuery}</code>
              </p>
              <p className="text-[11px] text-sky-700 dark:text-sky-400">
                Order ID: {singleTrackResult.id} • Status: {singleTrackResult.fulfillmentStatus}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSingleTrackResult(null);
              setSearchQuery('');
            }}
            className="text-xs font-medium text-sky-700 dark:text-sky-300 hover:underline cursor-pointer"
          >
            Show All Orders
          </button>
        </div>
      )}

      {/* Direct Search Error */}
      {singleTrackError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{singleTrackError}</span>
          </div>
          <button
            onClick={() => setSingleTrackError(null)}
            className="font-medium underline hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
          <RefreshCw className="w-8 h-8 mx-auto text-sky-500 animate-spin mb-3" />
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Fetching order tracking telemetry...
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Loading real-time status and fulfillment milestones from database.
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-8 text-center">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500 mb-2" />
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
          <button
            onClick={loadOrders}
            className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-medium hover:bg-rose-500 transition cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && (singleTrackResult ? [singleTrackResult] : filteredOrders).length === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">No Orders Found</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mt-1 mb-4">
            {searchQuery
              ? `No orders matched your search "${searchQuery}". Try clearing filters or entering a different Order ID.`
              : 'There are no orders matching the selected status filter.'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setSelectedUserIdFilter('all');
            }}
            className="px-4 py-2 bg-sky-600 text-white text-xs font-medium rounded-xl hover:bg-sky-500 transition cursor-pointer"
          >
            Reset Filters & View All
          </button>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && (
        <div className="space-y-4">
          {(singleTrackResult ? [singleTrackResult] : filteredOrders).map((order) => {
            const isTimelineExpanded = Boolean(expandedTimelines[order.id]);
            const progressPercentage = getStepProgressPercentage(order);

            return (
              <div
                key={order.id}
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 transition"
              >
                {/* Order Top Card Header */}
                <div className="p-5 bg-neutral-50/60 dark:bg-neutral-800/40 border-b border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          #{order.id}
                        </span>
                        <button
                          onClick={() => handleCopyText(order.id, `id_${order.id}`)}
                          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer p-0.5 rounded"
                          title="Copy Order ID"
                        >
                          {copiedId === `id_${order.id}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Ordered on{' '}
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {order.user && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">
                              {order.user.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                    {getStatusBadge(order)}
                  </div>
                </div>

                {/* Tracking & Milestone Progress Bar */}
                <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold">
                        <Truck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                          <span>Carrier Tracking:</span>
                          <span className="font-mono text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                            {order.trackingNumber || `TRK-${order.id.slice(-8).toUpperCase()}`}
                          </span>
                          <button
                            onClick={() =>
                              handleCopyText(
                                order.trackingNumber || `TRK-${order.id.slice(-8).toUpperCase()}`,
                                `trk_${order.id}`
                              )
                            }
                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer p-0.5"
                            title="Copy Tracking Number"
                          >
                            {copiedId === `trk_${order.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {order.carrier || 'Express Logistics Service'} • Estimated Delivery:{' '}
                          <strong className="text-neutral-800 dark:text-neutral-200 font-semibold">
                            {order.estimatedDelivery
                              ? new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : '3-5 Business Days'}
                          </strong>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        onAskAiWithQuery(
                          `What is the live tracking status, estimated delivery, and items for order #${order.id}?`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Ask AI about Order
                    </button>
                  </div>

                  {/* 4-Step Milestone Stepper */}
                  <div className="relative pt-2 pb-2">
                    {/* Background line */}
                    <div className="absolute top-5 left-6 right-6 h-1 bg-neutral-200 dark:bg-neutral-800 -z-0 rounded-full" />
                    {/* Active progress line */}
                    <div
                      className={`absolute top-5 left-6 h-1 transition-all duration-500 -z-0 rounded-full ${
                        order.status === 'failed' ? 'bg-rose-500' : 'bg-sky-500'
                      }`}
                      style={{ width: `calc(${progressPercentage}% - 3rem)` }}
                    />

                    <div className="grid grid-cols-4 gap-2 text-center relative z-10">
                      {/* Step 1: Placed */}
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                          <Check className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 mt-1.5">
                          Order Placed
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Confirmed</span>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                            order.status === 'failed'
                              ? 'bg-rose-500 text-white'
                              : order.status === 'pending'
                              ? 'bg-yellow-500 text-white animate-pulse'
                              : progressPercentage >= 50
                              ? 'bg-emerald-500 text-white'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {order.status === 'failed' ? (
                            <AlertCircle className="w-4 h-4" />
                          ) : progressPercentage > 50 ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 mt-1.5">
                          {order.status === 'failed'
                            ? 'Payment Failed'
                            : order.status === 'pending'
                            ? 'Awaiting Pay'
                            : 'Processing'}
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {order.status === 'failed'
                            ? 'Requires Retry'
                            : order.status === 'pending'
                            ? 'Pre-auth'
                            : 'Fulfillment Hub'}
                        </span>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                            progressPercentage >= 75
                              ? progressPercentage > 75
                                ? 'bg-emerald-500 text-white'
                                : 'bg-sky-500 text-white animate-pulse'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
                          }`}
                        >
                          {progressPercentage > 75 ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Truck className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 mt-1.5">
                          Shipped
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">In Transit</span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                            progressPercentage === 100
                              ? 'bg-emerald-500 text-white'
                              : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-900 dark:text-neutral-100 mt-1.5">
                          Delivered
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Completed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Purchased List */}
                <div className="p-5">
                  <h4 className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
                    Purchased Items ({order.items.length})
                  </h4>

                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700 shrink-0 cursor-pointer hover:opacity-90"
                              onClick={() => item.productId && onOpenProductDetail(item.productId)}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                              <Package className="w-5 h-5" />
                            </div>
                          )}

                          <div>
                            <button
                              onClick={() => item.productId && onOpenProductDetail(item.productId)}
                              className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer text-left line-clamp-1"
                            >
                              {item.product?.name || `Product #${item.productId}`}
                            </button>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                              <span>Qty: {item.quantity}</span>
                              <span>•</span>
                              <span>${item.priceAtPurchase.toFixed(2)} each</span>
                              {item.product?.category && (
                                <>
                                  <span>•</span>
                                  <span className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded text-[10px]">
                                    {item.product.category}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            ${(item.priceAtPurchase * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address Note */}
                  {order.shippingAddress && (
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-xs flex items-start gap-2 text-neutral-600 dark:text-neutral-300">
                      <MapPin className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          Delivery Destination:{' '}
                        </span>
                        <span>
                          {order.shippingAddress.name} — {order.shippingAddress.street},{' '}
                          {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                          {order.shippingAddress.postalCode}, {order.shippingAddress.country || 'India'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expandable Step-by-Step Audit Timeline Log */}
                {isTimelineExpanded && order.timeline && order.timeline.length > 0 && (
                  <div className="px-5 pb-5 pt-2 bg-neutral-50/40 dark:bg-neutral-800/20 border-t border-neutral-100 dark:border-neutral-800 animate-in fade-in duration-150">
                    <h5 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      Detailed Carrier Activity Log
                    </h5>

                    <div className="space-y-3 pl-2 border-l-2 border-neutral-200 dark:border-neutral-700 ml-2">
                      {order.timeline.map((step, idx) => (
                        <div key={idx} className="relative pl-4">
                          <div
                            className={`absolute -left-[17px] top-0.5 w-3 h-3 rounded-full border-2 bg-white dark:bg-neutral-900 ${
                              step.status === 'completed'
                                ? 'border-emerald-500 bg-emerald-500'
                                : step.status === 'current'
                                ? 'border-sky-500 bg-sky-500 animate-pulse'
                                : step.status === 'failed'
                                ? 'border-rose-500 bg-rose-500'
                                : 'border-neutral-300 dark:border-neutral-700'
                            }`}
                          />
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                              {step.title}
                            </span>
                            {step.timestamp && (
                              <span className="text-[10px] text-neutral-400">
                                {new Date(step.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {step.description}
                          </p>
                          {step.location && (
                            <span className="inline-block mt-1 text-[10px] text-neutral-400 bg-neutral-200/60 dark:bg-neutral-800 px-1.5 py-0.2 rounded">
                              📍 {step.location}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Footer Actions */}
                <div className="px-5 py-3.5 bg-neutral-50/80 dark:bg-neutral-800/60 border-t border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => toggleTimeline(order.id)}
                    className="text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:text-sky-600 dark:hover:text-sky-400 transition cursor-pointer flex items-center gap-1"
                  >
                    {isTimelineExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Hide Activity Timeline
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        View Detailed Activity Timeline
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorder(order)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition cursor-pointer flex items-center gap-1.5"
                    >
                      {reorderedOrderId === order.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Added to Cart!
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reorder Items
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        onAskAiWithQuery(
                          `Can you help me with questions regarding order #${order.id}? Total: $${order.totalAmount}`
                        )
                      }
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Order Support
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
