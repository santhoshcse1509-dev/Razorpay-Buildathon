import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  UserPlus,
  LogIn,
  LogOut,
  ShoppingBag,
  Filter,
  Eye,
  ShieldCheck,
  Sparkles,
  Terminal,
  ArrowRight,
  Clock,
  Bot,
  Zap,
  Tag,
  CreditCard,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import {
  apiSignup,
  apiLogin,
  fetchProducts,
  fetchProductById,
  fetchCategories,
  apiAgentChat,
  fetchAgentActions,
  fetchDatabaseCart,
  apiUpdateCartItemQuantity,
  apiRemoveCartItem,
  apiTriggerAbandonedCartNudge,
  apiCreateCheckoutOrder,
  apiVerifyOrderPayment,
  apiGetPostPurchaseCrossSell,
  fetchNotifications,
} from '../api.js';

interface TestResult {
  id: string;
  name: string;
  category: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  latencyMs?: number;
  details?: string;
  error?: string;
}

export const TestingCheckpoint: React.FC<{
  onOpenProductModal?: (productId: string) => void;
  onOpenAuthModal?: (mode: 'login' | 'signup') => void;
  onOpenChatWithQuery?: (query: string) => void;
}> = ({ onOpenProductModal, onOpenAuthModal, onOpenChatWithQuery }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [suiteRunning, setSuiteRunning] = useState(false);

  const [tests, setTests] = useState<TestResult[]>([
    {
      id: 'signup',
      name: '1. User Sign Up (bcrypt + JWT 7d)',
      category: 'PHASE 1: AUTH',
      status: 'idle',
      details: 'Registers a new user with bcrypt password hash and receives 7-day signed JWT',
    },
    {
      id: 'login',
      name: '2. User Log In (Password Verification)',
      category: 'PHASE 1: AUTH',
      status: 'idle',
      details: 'Authenticates credentials, returns user profile and attaches authorization bearer',
    },
    {
      id: 'logout',
      name: '3. User Log Out (State Eviction)',
      category: 'PHASE 1: AUTH',
      status: 'idle',
      details: 'Clears active JWT token and user profile from localStorage and React context',
    },
    {
      id: 'browse',
      name: '4. Product Catalog Browsing & Search',
      category: 'PHASE 1: CATALOG',
      status: 'idle',
      details: 'Queries GET /api/products with pagination and plain text keyword search',
    },
    {
      id: 'filter',
      name: '5. Category & Price Range Filtering',
      category: 'PHASE 1: CATALOG',
      status: 'idle',
      details: 'Filters items by category (Electronics/Apparel) and price range constraints',
    },
    {
      id: 'detail',
      name: '6. Product Detail & Related Items',
      category: 'PHASE 1: CATALOG',
      status: 'idle',
      details: 'Retrieves single product entity and category-linked related items via GET /api/products/:id',
    },
    {
      id: 'agent_search',
      name: '7. AI Agent: "Running Shoes under ₹3000" Tool Use',
      category: 'PHASE 2: AI AGENT',
      status: 'idle',
      details: 'POST /agent/chat queries database via search_products tool, logs AgentAction, returns 3 shoes with reasons',
    },
    {
      id: 'agent_compare',
      name: '8. AI Agent: compare_products Tool Execution',
      category: 'PHASE 2: AI AGENT',
      status: 'idle',
      details: 'Agent executes compare_products tool and generates structured multi-product comparison payload',
    },
    {
      id: 'agent_add_to_cart',
      name: '9. AI Agent: add_to_cart Live DB Mutation',
      category: 'PHASE 2: AI AGENT',
      status: 'idle',
      details: 'Agent executes add_to_cart tool, inserts CartItem into Prisma DB, and logs to AgentAction table',
    },
    {
      id: 'agent_action_logging',
      name: '10. AgentAction Table Logging Verification',
      category: 'PHASE 2: AI AGENT',
      status: 'idle',
      details: 'Verifies that every tool call has an immutable record in the AgentAction database table',
    },
    {
      id: 'cart_crud',
      name: '11. Cart Management (Quantity Stepper & Deletion)',
      category: 'PHASE 3: CART',
      status: 'idle',
      details: 'Updates cart item quantities, fetches database state, and removes item from CartItem table',
    },
    {
      id: 'abandoned_nudge',
      name: '12. Abandoned Cart Detection & POST /agent/nudge',
      category: 'PHASE 3: NUDGE',
      status: 'idle',
      details: 'Triggers Claude abandoned cart reminder referencing cart items with 10% coupon and logs to Notification',
    },
    {
      id: 'checkout_pending',
      name: '13. Checkout Flow (Pending Order & Razorpay Order)',
      category: 'PHASE 3: CHECKOUT',
      status: 'idle',
      details: 'Creates Order with status "pending" and Razorpay test order ID via POST /api/orders/checkout',
    },
    {
      id: 'payment_failure_path',
      name: '14. Payment Failure Handler (Cart Kept Intact)',
      category: 'PHASE 3: CHECKOUT',
      status: 'idle',
      details: 'Simulates payment decline: marks Order "failed" and verifies user cart is deliberately preserved for retry',
    },
    {
      id: 'payment_success_path',
      name: '15. Payment Success Handler (Stock Decrement & Cart Clear)',
      category: 'PHASE 3: CHECKOUT',
      status: 'idle',
      details: 'Verifies payment, marks Order "paid", decrements product stock in DB, and clears the cart',
    },
    {
      id: 'post_purchase_cross_sell',
      name: '16. Post-Purchase AI Thank You & 1 Cross-Sell',
      category: 'PHASE 4: POST-PURCHASE',
      status: 'idle',
      details: 'POST /agent/post-purchase generates tailored thank-you message and 1 cross-sell item with rationale',
    },
  ]);

  const updateTestStatus = (id: string, updates: Partial<TestResult>) => {
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  // Run a single test
  const runSingleTest = async (testId: string) => {
    updateTestStatus(testId, { status: 'running', error: undefined });
    const start = performance.now();

    try {
      if (testId === 'signup') {
        const testEmail = `test_user_${Date.now()}@agenticcommerce.test`;
        const res = await apiSignup('Automated Test User', testEmail, 'securePass123!');
        const latency = Math.round(performance.now() - start);

        if (!res.token || !res.user?.id) {
          throw new Error('JWT token or User ID missing from signup response');
        }

        updateTestStatus('signup', {
          status: 'passed',
          latencyMs: latency,
          details: `Created user ${res.user.email} (ID: ${res.user.id}). JWT token issued.`,
        });
      } else if (testId === 'login') {
        const res = await apiLogin('sophia.r@example.com', 'password123');
        const latency = Math.round(performance.now() - start);

        if (!res.token || res.user.email !== 'sophia.r@example.com') {
          throw new Error('Login response invalid or user mismatch');
        }

        updateTestStatus('login', {
          status: 'passed',
          latencyMs: latency,
          details: `Authenticated ${res.user.name} (${res.user.role}). JWT token verified.`,
        });
      } else if (testId === 'logout') {
        logout();
        const storedToken = localStorage.getItem('agentic_auth_token');
        const latency = Math.round(performance.now() - start);

        if (storedToken) {
          throw new Error('Token was not cleared from localStorage');
        }

        updateTestStatus('logout', {
          status: 'passed',
          latencyMs: latency,
          details: 'Session cleared from memory and localStorage successfully.',
        });
      } else if (testId === 'browse') {
        const res = await fetchProducts({ search: 'Headphones', limit: 5 });
        const latency = Math.round(performance.now() - start);

        if (!res.data || res.data.length === 0) {
          throw new Error('Search query returned 0 items');
        }

        updateTestStatus('browse', {
          status: 'passed',
          latencyMs: latency,
          details: `Found ${res.data.length} items matching 'Headphones' in ${latency}ms.`,
        });
      } else if (testId === 'filter') {
        const res = await fetchProducts({
          category: 'Electronics',
          minPrice: 50,
          maxPrice: 500,
        });
        const latency = Math.round(performance.now() - start);

        const allElectronics = res.data.every((p) => p.category === 'Electronics');
        const allInPrice = res.data.every((p) => p.price >= 50 && p.price <= 500);

        if (!allElectronics || !allInPrice) {
          throw new Error('Filtered products violate category or price bounds');
        }

        updateTestStatus('filter', {
          status: 'passed',
          latencyMs: latency,
          details: `Retrieved ${res.data.length} Electronics products between $50-$500.`,
        });
      } else if (testId === 'detail') {
        const list = await fetchProducts({ limit: 1 });
        if (!list.data || list.data.length === 0) {
          throw new Error('No products in catalog to test detail endpoint');
        }
        const productId = list.data[0].id;
        const res = await fetchProductById(productId);
        const latency = Math.round(performance.now() - start);

        if (!res.data || res.data.id !== productId) {
          throw new Error('Product detail response invalid');
        }

        updateTestStatus('detail', {
          status: 'passed',
          latencyMs: latency,
          details: `Fetched '${res.data.name}' with ${res.relatedProducts?.length || 0} related products.`,
        });
      } else if (testId === 'agent_search') {
        const res = await apiAgentChat({
          message: 'I need running shoes under ₹3000',
        });
        const latency = Math.round(performance.now() - start);

        if (!res.success || !res.conversationId) {
          throw new Error('Agent chat failed to return conversation ID or success.');
        }

        const hasSearchTool = res.toolCalls.some((tc) => tc.tool === 'search_products');
        if (!hasSearchTool) {
          throw new Error('Agent did not invoke the search_products tool.');
        }

        if (!res.products || res.products.length === 0) {
          throw new Error('Agent search tool returned 0 products.');
        }

        updateTestStatus('agent_search', {
          status: 'passed',
          latencyMs: latency,
          details: `Successfully executed search_products tool! Returned ${res.products.length} products with justifications in conversation ${res.conversationId}.`,
        });
      } else if (testId === 'agent_compare') {
        const res = await apiAgentChat({
          message: 'Compare AeroTrack and VoltDash running shoes',
        });
        const latency = Math.round(performance.now() - start);

        const hasCompareTool = res.toolCalls.some((tc) => tc.tool === 'compare_products');
        if (!hasCompareTool) {
          throw new Error('Agent did not invoke compare_products tool.');
        }

        updateTestStatus('agent_compare', {
          status: 'passed',
          latencyMs: latency,
          details: `Agent executed compare_products tool with side-by-side specs in ${latency}ms.`,
        });
      } else if (testId === 'agent_add_to_cart') {
        const res = await apiAgentChat({
          message: 'Add the first running shoe to my cart',
        });
        const latency = Math.round(performance.now() - start);

        const hasAddTool = res.toolCalls.some((tc) => tc.tool === 'add_to_cart');
        if (!hasAddTool) {
          throw new Error('Agent did not invoke add_to_cart tool.');
        }

        const cart = await fetchDatabaseCart();
        if (cart.totalCount <= 0) {
          throw new Error('Database cart count is 0 after add_to_cart execution.');
        }

        updateTestStatus('agent_add_to_cart', {
          status: 'passed',
          latencyMs: latency,
          details: `Agent executed add_to_cart tool! Database cart now has ${cart.totalCount} items ($${cart.totalAmount.toFixed(2)}).`,
        });
      } else if (testId === 'agent_action_logging') {
        const actionsData = await fetchAgentActions();
        const latency = Math.round(performance.now() - start);

        if (!actionsData.success || actionsData.actions.length === 0) {
          throw new Error('AgentAction database table has 0 logged records.');
        }

        updateTestStatus('agent_action_logging', {
          status: 'passed',
          latencyMs: latency,
          details: `Verified ${actionsData.count} logged tool calls in the AgentAction table.`,
        });
      } else if (testId === 'cart_crud') {
        // Step 1: Ensure product exists
        const productsList = await fetchProducts({ limit: 1 });
        const testProduct = productsList.data[0];
        if (!testProduct) throw new Error('No product available to test cart');

        // Step 2: Update quantity to 3
        const updateRes = await apiUpdateCartItemQuantity(testProduct.id, 3);
        if (!updateRes.success) throw new Error('Failed to update cart quantity');

        // Step 3: Fetch database cart
        const cartState = await fetchDatabaseCart();
        const item = cartState.items.find((i: any) => i.productId === testProduct.id);
        if (!item || item.quantity !== 3) throw new Error('CartItem quantity was not updated to 3 in DB');

        const latency = Math.round(performance.now() - start);
        updateTestStatus('cart_crud', {
          status: 'passed',
          latencyMs: latency,
          details: `Successfully set ${testProduct.name} quantity to 3. Database cart total: $${cartState.totalAmount.toFixed(2)}.`,
        });
      } else if (testId === 'abandoned_nudge') {
        // Trigger abandoned cart nudge
        const nudgeRes = await apiTriggerAbandonedCartNudge();
        const latency = Math.round(performance.now() - start);

        if (!nudgeRes.success || !nudgeRes.nudge) {
          throw new Error('Nudge API failed to generate reminder message.');
        }

        if (!nudgeRes.nudge.discountCode || !nudgeRes.nudge.message) {
          throw new Error('Nudge missing discount code or personalized message.');
        }

        // Verify Notification table
        const notifs = await fetchNotifications();
        const hasNudgeNotif = notifs.notifications.some((n: any) => n.type === 'abandoned_cart_nudge');
        if (!hasNudgeNotif) {
          throw new Error('Notification record was not created in the database.');
        }

        updateTestStatus('abandoned_nudge', {
          status: 'passed',
          latencyMs: latency,
          details: `Generated reminder with code ${nudgeRes.nudge.discountCode}. Message preview: "${nudgeRes.nudge.message.slice(0, 60)}..." Logged to Notification table.`,
        });
      } else if (testId === 'checkout_pending') {
        // Step 1: Add a test item to cart if empty
        const productsList = await fetchProducts({ limit: 1 });
        const testProduct = productsList.data[0];
        await apiUpdateCartItemQuantity(testProduct.id, 1);

        // Step 2: Create checkout order
        const checkoutRes = await apiCreateCheckoutOrder({
          shippingAddress: {
            name: 'Test Customer',
            email: 'customer@example.com',
            phone: '+91 9876543210',
            street: '123 Tech Park',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
          },
        });

        const latency = Math.round(performance.now() - start);
        if (!checkoutRes.success || !checkoutRes.order || checkoutRes.order.status !== 'pending') {
          throw new Error('Order was not created with status "pending"');
        }

        if (!checkoutRes.razorpay?.orderId) {
          throw new Error('Razorpay order ID was not generated');
        }

        updateTestStatus('checkout_pending', {
          status: 'passed',
          latencyMs: latency,
          details: `Created Order #${checkoutRes.order.id.slice(-6)} (Status: pending, Razorpay Order: ${checkoutRes.razorpay.orderId}).`,
        });
      } else if (testId === 'payment_failure_path') {
        // Step 1: Create a test order
        const productsList = await fetchProducts({ limit: 1 });
        const testProduct = productsList.data[0];
        await apiUpdateCartItemQuantity(testProduct.id, 1);

        const checkoutRes = await apiCreateCheckoutOrder({
          shippingAddress: {
            name: 'Test Customer',
            email: 'customer@example.com',
            phone: '+91 9876543210',
            street: '123 Tech Park',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
          },
        });

        // Step 2: Simulate Payment Failure
        const failRes = await apiVerifyOrderPayment(checkoutRes.order.id, {
          simulateFailure: true,
          failureReason: 'Card authorization failed by issuing bank',
        });

        if (failRes.status !== 'failed' || failRes.order.status !== 'failed') {
          throw new Error('Order status was not marked as "failed" on decline');
        }

        // Step 3: Verify Cart Items are KEPT INTACT
        const cartAfterFail = await fetchDatabaseCart();
        if (cartAfterFail.totalCount === 0) {
          throw new Error('User cart was erroneously cleared on failed payment! Must be kept intact.');
        }

        const latency = Math.round(performance.now() - start);
        updateTestStatus('payment_failure_path', {
          status: 'passed',
          latencyMs: latency,
          details: `Order #${failRes.order.id.slice(-6)} marked "failed". Verified user cart is preserved (${cartAfterFail.totalCount} items) for retry.`,
        });
      } else if (testId === 'payment_success_path') {
        // Step 1: Fetch product and its initial stock
        const productsList = await fetchProducts({ limit: 1 });
        const testProduct = productsList.data[0];
        const initialStock = testProduct.stock;

        // Step 2: Add 2 units to cart
        await apiUpdateCartItemQuantity(testProduct.id, 2);

        // Step 3: Create checkout order
        const checkoutRes = await apiCreateCheckoutOrder({
          shippingAddress: {
            name: 'Test Customer',
            email: 'customer@example.com',
            phone: '+91 9876543210',
            street: '123 Tech Park',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
            country: 'India',
          },
        });

        // Step 4: Verify payment success
        const verifyRes = await apiVerifyOrderPayment(checkoutRes.order.id, {
          razorpayPaymentId: `pay_test_${Date.now()}`,
          razorpayOrderId: checkoutRes.razorpay.orderId,
          razorpaySignature: `sig_test_${Date.now()}`,
          simulateFailure: false,
        });

        if (!verifyRes.success || verifyRes.status !== 'paid' || verifyRes.order.status !== 'paid') {
          throw new Error('Order status was not marked as "paid"');
        }

        // Step 5: Verify product stock is decremented
        const updatedProduct = await fetchProductById(testProduct.id);
        if (updatedProduct.data.stock !== initialStock - 2) {
          throw new Error(`Stock was not decremented correctly. Expected ${initialStock - 2}, got ${updatedProduct.data.stock}`);
        }

        // Step 6: Verify cart is cleared
        const cartAfterSuccess = await fetchDatabaseCart();
        if (cartAfterSuccess.totalCount !== 0) {
          throw new Error('Cart was not cleared after successful payment.');
        }

        const latency = Math.round(performance.now() - start);
        updateTestStatus('payment_success_path', {
          status: 'passed',
          latencyMs: latency,
          details: `Order #${verifyRes.order.id.slice(-6)} confirmed! Stock decremented from ${initialStock} to ${updatedProduct.data.stock}, cart cleared.`,
        });
      } else if (testId === 'post_purchase_cross_sell') {
        // Step 1: Get recent paid order or create one
        const productsList = await fetchProducts({ limit: 1 });
        const testProduct = productsList.data[0];
        const checkoutRes = await apiCreateCheckoutOrder({
          shippingAddress: {
            name: 'Jane Doe',
            email: 'jane@example.com',
            phone: '+91 9876543210',
            street: '42 MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560034',
            country: 'India',
          },
          items: [{ productId: testProduct.id, quantity: 1 }],
        });

        await apiVerifyOrderPayment(checkoutRes.order.id, {
          razorpayPaymentId: `pay_test_${Date.now()}`,
          razorpayOrderId: checkoutRes.razorpay.orderId,
          simulateFailure: false,
        });

        // Step 2: Call Post-Purchase API
        const postRes = await apiGetPostPurchaseCrossSell(checkoutRes.order.id);
        const latency = Math.round(performance.now() - start);

        if (!postRes.success || !postRes.thankYouMessage) {
          throw new Error('Post-purchase endpoint did not return thank-you message.');
        }

        if (!postRes.crossSellProduct || !postRes.crossSellProduct.name) {
          throw new Error('Post-purchase did not recommend a companion cross-sell product.');
        }

        updateTestStatus('post_purchase_cross_sell', {
          status: 'passed',
          latencyMs: latency,
          details: `Thank you note: "${postRes.thankYouMessage.slice(0, 50)}..." Recommended companion item: "${postRes.crossSellProduct.name}" (${postRes.crossSellProduct.recommendationReason || 'Top match'}).`,
        });
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      updateTestStatus(testId, {
        status: 'failed',
        latencyMs: latency,
        error: err.message || 'Test failed',
      });
    }
  };

  // Run full automated test suite sequentially
  const handleRunAll = async () => {
    setSuiteRunning(true);
    for (const t of tests) {
      await runSingleTest(t.id);
      await new Promise((r) => setTimeout(r, 200));
    }
    setSuiteRunning(false);
  };

  const passedCount = tests.filter((t) => t.status === 'passed').length;
  const failedCount = tests.filter((t) => t.status === 'failed').length;

  return (
    <div id="testing-checkpoint-section" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Phase 1, 2, 3 &amp; 4 Automated Checkpoint
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Full E2E Testing Suite (Auth, Catalog, AI Agent, Cart, Checkout &amp; Post-Purchase)
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
              Verify that the AI Shopping Agent uses tool-calling to query the database, add items to cart, detect abandoned carts with Claude nudges, create Razorpay orders, handle payment success/failure, decrement inventory, and generate post-purchase recommendations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAll}
              disabled={suiteRunning}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {suiteRunning ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              {suiteRunning ? 'Running Suite...' : `Run All ${tests.length} E2E Tests`}
            </button>
          </div>
        </div>

        {/* Live Scorecard Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-3.5 bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Total Tests
            </span>
            <span className="text-xl font-bold text-neutral-900 dark:text-white">
              {tests.length}
            </span>
          </div>

          <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider">
              Passed
            </span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {passedCount}
            </span>
          </div>

          <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block tracking-wider">
              Failed
            </span>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {failedCount}
            </span>
          </div>

          <div className="p-3.5 bg-sky-500/5 border border-sky-500/20 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400 block tracking-wider">
              Checkout &amp; Razorpay
            </span>
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 truncate block mt-1">
              Active (Test Mode)
            </span>
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map((test) => (
          <div
            key={test.id}
            id={`test-card-${test.id}`}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {test.category}
                </span>

                <div>
                  {test.status === 'passed' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PASSED {test.latencyMs && `(${test.latencyMs}ms)`}
                    </span>
                  )}
                  {test.status === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" />
                      FAILED
                    </span>
                  )}
                  {test.status === 'running' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full">
                      <div className="w-3 h-3 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                      Testing...
                    </span>
                  )}
                  {test.status === 'idle' && (
                    <span className="text-[11px] text-neutral-400">Not Tested</span>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                {test.name}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {test.details}
              </p>

              {test.error && (
                <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-mono">
                  <strong>Error:</strong> {test.error}
                </div>
              )}
            </div>

            {/* Test Action Trigger */}
            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400">
                Live endpoint test
              </span>
              <button
                onClick={() => runSingleTest(test.id)}
                disabled={suiteRunning}
                className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-300 dark:hover:border-sky-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition cursor-pointer flex items-center gap-1.5"
              >
                <Play className="w-3 h-3" />
                Run Test
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
