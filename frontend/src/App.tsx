import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Bot,
  ShoppingCart,
  CheckCircle2,
  ShieldCheck,
  Database,
  Layers,
  Sparkles,
  Terminal,
  ShoppingBag,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { ProductCatalog } from './components/ProductCatalog.js';
import { ProductDetailModal } from './components/ProductDetailModal.js';
import { AuthModal } from './components/AuthModal.js';
import { TestingCheckpoint } from './components/TestingCheckpoint.js';
import { CartDrawer, CartItemEntry } from './components/CartDrawer.js';
import { CartPage } from './components/CartPage.js';
import { AbandonedCartNudgeBanner } from './components/AbandonedCartNudgeBanner.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { OrderConfirmationModal } from './components/OrderConfirmationModal.js';
import { HealthBanner } from './components/HealthBanner.js';
import { FolderStructureViewer } from './components/FolderStructureViewer.js';
import { SchemaViewer } from './components/SchemaViewer.js';
import { SeedDataExplorer } from './components/SeedDataExplorer.js';
import { ApiTester } from './components/ApiTester.js';
import { ChatWidget } from './components/ChatWidget.js';
import { AdminAnalyticsDashboard } from './components/AdminAnalyticsDashboard.js';
import { OrderTrackingView } from './components/OrderTrackingView.js';
import {
  fetchHealth,
  fetchProducts,
  fetchUsers,
  fetchOrders,
  fetchConversations,
  fetchOverview,
  fetchDatabaseCart,
  apiTriggerAbandonedCartNudge,
  apiUpdateCartItemQuantity,
  apiRemoveCartItem,
  apiClearCart,
} from './api.js';
import {
  HealthCheckResponse,
  Product,
  User,
  Order,
  Conversation,
  AbandonedCartNudge,
} from './types.js';

function MainApp() {
  const { user, isAuthenticated } = useAuth();

  // Navigation & View Mode: 'catalog' | 'cart' | 'orders' | 'checkpoint' | 'architecture' | 'admin'
  const [activeView, setActiveView] = useState<'catalog' | 'cart' | 'orders' | 'checkpoint' | 'architecture' | 'admin'>('catalog');

  // Search state across navbar and catalog
  const [searchQuery, setSearchQuery] = useState('');

  // Selected product for modal view
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Auth modal controls
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // AI Chat Widget state
  const [chatWidgetOpen, setChatWidgetOpen] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string | null>(null);

  // Cart Drawer & Items state
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItemEntry[]>(() => {
    try {
      const saved = localStorage.getItem('agentic_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Abandoned Cart Nudge state
  const [nudgeBannerOpen, setNudgeBannerOpen] = useState(false);
  const [nudgeData, setNudgeData] = useState<AbandonedCartNudge | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const idleCheckIntervalRef = useRef<any>(null);

  // Checkout & Order Confirmation modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutDiscountCode, setCheckoutDiscountCode] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);

  // Health and architecture data states
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [schemaPrisma, setSchemaPrisma] = useState<string>('');
  const [dataLoading, setDataLoading] = useState(true);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('agentic_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  const loadHealth = async () => {
    setHealthLoading(true);
    setHealthError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err: any) {
      setHealthError(err.message || 'Failed to connect to backend service');
    } finally {
      setHealthLoading(false);
    }
  };

  const loadAllData = async () => {
    setDataLoading(true);
    try {
      const [prodRes, userRes, orderRes, convRes, overviewRes] = await Promise.all([
        fetchProducts().catch(() => ({ data: [] })),
        fetchUsers().catch(() => ({ data: [] })),
        fetchOrders().catch(() => ({ data: [] })),
        fetchConversations().catch(() => ({ data: [] })),
        fetchOverview().catch(() => ({ schemaPrisma: '' })),
      ]);

      setProducts(prodRes.data || []);
      setUsers(userRes.data || []);
      setOrders(orderRes.data || []);
      setConversations(convRes.data || []);
      if (overviewRes.schemaPrisma) {
        setSchemaPrisma(overviewRes.schemaPrisma);
      }
    } catch {
      // Handled silently
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    loadAllData();
  }, []);

  // Sync database cart on startup or login
  useEffect(() => {
    fetchDatabaseCart(user?.id)
      .then((res) => {
        if (res.items && res.items.length > 0 && cartItems.length === 0) {
          const dbEntries: CartItemEntry[] = res.items.map((i) => ({
            product: i.product,
            quantity: i.quantity,
          }));
          setCartItems(dbEntries);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // -------------------------------------------------------------------------
  // ABANDONED CART IDLE DETECTION (>2 MINUTES)
  // -------------------------------------------------------------------------
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, resetActivity, { passive: true }));

    // Check idle status every 5 seconds
    idleCheckIntervalRef.current = setInterval(async () => {
      const idleTimeMs = Date.now() - lastActivityRef.current;
      const TWO_MINUTES_MS = 120 * 1000; // 2 minutes

      if (
        idleTimeMs >= TWO_MINUTES_MS &&
        cartItems.length > 0 &&
        !nudgeBannerOpen &&
        !nudgeDismissed &&
        !checkoutModalOpen &&
        !confirmationModalOpen
      ) {
        try {
          const res = await apiTriggerAbandonedCartNudge(user?.id);
          if (res.success && res.nudge) {
            setNudgeData(res.nudge);
            setNudgeBannerOpen(true);
          }
        } catch {
          // Handled silently
        }
      }
    }, 5000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetActivity));
      if (idleCheckIntervalRef.current) clearInterval(idleCheckIntervalRef.current);
    };
  }, [cartItems.length, nudgeBannerOpen, nudgeDismissed, checkoutModalOpen, confirmationModalOpen, user?.id, resetActivity]);

  // Manual Idle Nudge simulation trigger for rapid testing without waiting 2 min
  const handleTriggerIdleNudgeManual = async () => {
    try {
      const res = await apiTriggerAbandonedCartNudge(user?.id);
      if (res.success && res.nudge) {
        setNudgeData(res.nudge);
        setNudgeBannerOpen(true);
      }
    } catch (err: any) {
      alert(`Nudge generation failed: ${err.message}`);
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      let updated: CartItemEntry[];
      if (existing) {
        updated = prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [...prev, { product, quantity }];
      }
      return updated;
    });

    // Also sync to DB
    apiUpdateCartItemQuantity(product.id, quantity, user?.id).catch(() => {});
    setNudgeDismissed(false);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) => {
      const target = prev.find((i) => i.product.id === productId);
      const newQty = target ? target.quantity + delta : 1;

      if (newQty <= 0) {
        apiRemoveCartItem(productId, user?.id).catch(() => {});
        return prev.filter((i) => i.product.id !== productId);
      } else {
        apiUpdateCartItemQuantity(productId, newQty, user?.id).catch(() => {});
        return prev.map((i) =>
          i.product.id === productId ? { ...i, quantity: newQty } : i
        );
      }
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    apiRemoveCartItem(productId, user?.id).catch(() => {});
  };

  const handleClearCart = () => {
    setCartItems([]);
    apiClearCart(user?.id).catch(() => {});
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleInitiateCheckout = (discountCode?: string) => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Add items before proceeding to checkout.');
      return;
    }
    setCheckoutDiscountCode(discountCode || null);
    setCartDrawerOpen(false);
    setNudgeBannerOpen(false);
    setCheckoutModalOpen(true);
  };

  const handlePaymentSuccess = (order: any) => {
    setCartItems([]);
    setConfirmedOrder(order);
    setCheckoutModalOpen(false);
    setConfirmationModalOpen(true);
    loadAllData();
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans antialiased">
      {/* 1. Global Navigation Bar */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        activeView={activeView}
        setActiveView={setActiveView}
        cartCount={totalCartCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCart={() => setCartDrawerOpen(true)}
        onSelectProduct={(p) => {
          setSelectedProductId(p.id);
          setActiveView('catalog');
        }}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Active View: Product Catalog (Storefront) */}
        {activeView === 'catalog' && (
          <ProductCatalog
            onSelectProduct={(p) => setSelectedProductId(p.id)}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {/* Active View: Dedicated Cart Page (Phase 3) */}
        {activeView === 'cart' && (
          <CartPage
            items={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onCheckout={handleInitiateCheckout}
            onBackToShopping={() => setActiveView('catalog')}
            onOpenProductDetail={(pid) => setSelectedProductId(pid)}
            onTriggerIdleNudgeManual={handleTriggerIdleNudgeManual}
          />
        )}

        {/* Active View: Testing Checkpoint */}
        {activeView === 'checkpoint' && (
          <TestingCheckpoint
            onOpenProductModal={(pid) => setSelectedProductId(pid)}
            onOpenAuthModal={handleOpenAuth}
            onOpenChatWithQuery={(q) => {
              setChatInitialQuery(q);
              setChatWidgetOpen(true);
            }}
          />
        )}

        {/* Active View: Architecture & DB Inspector */}
        {activeView === 'architecture' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Backend Health Banner */}
            <HealthBanner
              health={health}
              loading={healthLoading}
              error={healthError}
              onRefresh={() => {
                loadHealth();
                loadAllData();
              }}
            />

            {/* Folder Structure Overview */}
            <FolderStructureViewer />

            {/* Prisma Schema Models */}
            <SchemaViewer rawPrismaSchema={schemaPrisma} />

            {/* Seed Data Table */}
            <SeedDataExplorer
              products={products}
              users={users}
              orders={orders}
              conversations={conversations}
              loading={dataLoading}
            />

            {/* Live REST API Tester */}
            <ApiTester />
          </div>
        )}

        {/* Active View: Order Tracking & Shipment Status View */}
        {activeView === 'orders' && (
          <OrderTrackingView
            onNavigateToCatalog={() => setActiveView('catalog')}
            onOpenProductDetail={(pid) => setSelectedProductId(pid)}
            onAddToCart={(prod, qty) => {
              handleAddToCart(prod, qty);
              setCartDrawerOpen(true);
            }}
            onAskAiWithQuery={(q) => {
              setChatInitialQuery(q);
              setChatWidgetOpen(true);
            }}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {/* Active View: Admin Analytics & Telemetry Dashboard (Phase 4) */}
        {activeView === 'admin' && (
          <AdminAnalyticsDashboard
            onNavigateToCatalog={() => setActiveView('catalog')}
            onOpenChatWithProduct={(pName) => {
              setChatInitialQuery(`Tell me about ${pName} and recommend accessories.`);
              setChatWidgetOpen(true);
            }}
          />
        )}
      </main>

      {/* 3. Product Detail Modal */}
      <ProductDetailModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onSelectProduct={(p) => setSelectedProductId(p.id)}
        onAddToCart={handleAddToCart}
        onAskAi={(q) => {
          setChatInitialQuery(q);
          setChatWidgetOpen(true);
        }}
      />

      {/* 4. Auth Modal (Sign in, Sign up, Google, Forgot/Reset) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* 5. Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => handleInitiateCheckout()}
      />

      {/* 6. Abandoned Cart In-App Nudge Banner (Triggered on >2 min idle or manual test) */}
      <AbandonedCartNudgeBanner
        isOpen={nudgeBannerOpen}
        nudge={nudgeData}
        onDismiss={() => {
          setNudgeBannerOpen(false);
          setNudgeDismissed(true);
        }}
        onProceedToCheckout={(coupon) => {
          setNudgeBannerOpen(false);
          handleInitiateCheckout(coupon);
        }}
      />

      {/* 7. Checkout Modal (Address form -> Review -> Razorpay Test Gateway Simulation) */}
      <CheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        items={cartItems}
        initialDiscountCode={checkoutDiscountCode}
        onPaymentSuccess={handlePaymentSuccess}
        onCartCleared={() => setCartItems([])}
      />

      {/* 8. Order Confirmation Modal (Post-Purchase AI Thank-You & Cross-Sell) */}
      <OrderConfirmationModal
        isOpen={confirmationModalOpen}
        order={confirmedOrder}
        onClose={() => setConfirmationModalOpen(false)}
        onAddToCart={(prod) => {
          handleAddToCart(prod, 1);
          setCartDrawerOpen(true);
        }}
        onOpenProductDetail={(pid) => setSelectedProductId(pid)}
        onViewOrders={() => setActiveView('orders')}
      />

      {/* 9. AI Shopping Agent Floating Chat Widget */}
      <ChatWidget
        isOpen={chatWidgetOpen}
        onToggle={() => setChatWidgetOpen((prev) => !prev)}
        onOpenProductDetail={(pid) => setSelectedProductId(pid)}
        onAddToCart={handleAddToCart}
        initialQuery={chatInitialQuery}
        onClearInitialQuery={() => setChatInitialQuery(null)}
      />

      {/* 10. Footer */}
      <footer className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 py-4 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Agentic Commerce Assistant • Conversational AI Shopping Platform</span>
          <span className="text-[11px] text-neutral-400">
            Smart Recommendations • Cart Retention • Instant Checkout • Real-Time Inventory
          </span>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
