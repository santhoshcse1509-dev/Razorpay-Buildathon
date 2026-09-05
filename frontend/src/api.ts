import {
  HealthCheckResponse,
  Product,
  User,
  Order,
  Conversation,
  AuthResponse,
  AuthUser,
  ProductFilters,
  CategoryInfo,
  SingleProductResponse,
  AdminAnalyticsResponse,
  AdminConversationsResponse,
  ProductReview,
  ProductReviewsResponse,
} from './types.js';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('agentic_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// AUTH API
// ---------------------------------------------------------------------------

export async function apiSignup(name: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Registration failed');
  }
  return data;
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Login failed');
  }
  return data;
}

export async function apiGoogleLogin(payload: { googleId?: string; email: string; name?: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Google login failed');
  }
  return data;
}

export async function apiForgotPassword(email: string): Promise<{ success: boolean; message: string; resetToken?: string; expiresAt?: string }> {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Password reset request failed');
  }
  return data;
}

export async function apiResetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Password reset failed');
  }
  return data;
}

export async function apiGetMe(): Promise<{ success: boolean; user: AuthUser }> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      ...getAuthHeader(),
    },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Session expired. Please log in again.');
  }
  return data;
}

// ---------------------------------------------------------------------------
// PRODUCT CATALOG API
// ---------------------------------------------------------------------------

export async function fetchProducts(filters: ProductFilters = {}): Promise<{
  data: Product[];
  count: number;
  totalCount: number;
  page: number;
  totalPages: number;
}> {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'All' && filters.category !== 'all') {
    params.append('category', filters.category);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }
  if (filters.minPrice !== undefined && filters.minPrice !== null) {
    params.append('minPrice', String(filters.minPrice));
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
    params.append('maxPrice', String(filters.maxPrice));
  }
  if (filters.sortBy) {
    params.append('sortBy', filters.sortBy);
  }
  if (filters.inStockOnly) {
    params.append('inStockOnly', 'true');
  }
  if (filters.limit) {
    params.append('limit', String(filters.limit));
  }
  if (filters.page) {
    params.append('page', String(filters.page));
  }

  const queryStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/products${queryStr}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }
  return res.json();
}

export async function fetchProductById(id: string): Promise<SingleProductResponse> {
  const res = await fetch(`${API_BASE}/products/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Product not found' }));
    throw new Error(err.error || `Failed to fetch product (${res.status})`);
  }
  return res.json();
}

export async function fetchCategories(): Promise<{ categories: CategoryInfo[]; totalProducts: number }> {
  const res = await fetch(`${API_BASE}/products/categories`);
  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.status}`);
  }
  return res.json();
}

export async function fetchProductReviews(productId: string): Promise<ProductReviewsResponse> {
  const res = await fetch(`${API_BASE}/products/${productId}/reviews`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to fetch reviews' }));
    throw new Error(err.error || `Failed to fetch reviews (${res.status})`);
  }
  return res.json();
}

export async function submitProductReview(
  productId: string,
  review: { author: string; rating: number; title: string; comment: string }
): Promise<{
  success: boolean;
  review: ProductReview;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { 5: number; 4: number; 3: number; 2: number; 1: number };
}> {
  const res = await fetch(`${API_BASE}/products/${productId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(review),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to submit review');
  }
  return data;
}

export async function voteHelpfulReview(
  productId: string,
  reviewId: string
): Promise<{ success: boolean; helpfulCount: number }> {
  const res = await fetch(`${API_BASE}/products/${productId}/reviews/${reviewId}/helpful`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to mark review helpful');
  }
  return data;
}

// ---------------------------------------------------------------------------
// ADMIN & DEMO APIS
// ---------------------------------------------------------------------------

export async function fetchHealth(): Promise<HealthCheckResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed with status: ${res.status}`);
  }
  return res.json();
}

export async function fetchHello(): Promise<{ message: string; timestamp: string; status: string }> {
  const res = await fetch(`${API_BASE}/hello`);
  if (!res.ok) {
    throw new Error(`Hello endpoint failed with status: ${res.status}`);
  }
  return res.json();
}

export async function fetchUsers(): Promise<{ data: User[]; count: number }> {
  const res = await fetch(`${API_BASE}/users`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.status}`);
  }
  return res.json();
}

export async function fetchOrders(userId?: string): Promise<{
  data: Order[];
  count: number;
  statusCounts: {
    paid: number;
    pending: number;
    failed: number;
    processing?: number;
    shipped?: number;
    delivered?: number;
  };
}> {
  const url = userId ? `${API_BASE}/orders?userId=${encodeURIComponent(userId)}` : `${API_BASE}/orders`;
  const res = await fetch(url, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.status}`);
  }
  return res.json();
}

export async function fetchOrderById(orderId: string): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch order details');
  }
  return data;
}

export async function apiTrackOrder(query: string): Promise<{ success: boolean; order: Order }> {
  const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(query.trim())}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Order not found for "${query}"`);
  }
  return data;
}

export async function fetchConversations(): Promise<{ data: Conversation[]; count: number }> {
  const res = await fetch(`${API_BASE}/conversations`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch conversations: ${res.status}`);
  }
  return res.json();
}

export async function fetchOverview(): Promise<{
  entities: any;
  schemaPrisma: string;
}> {
  const res = await fetch(`${API_BASE}/stats/overview`);
  if (!res.ok) {
    throw new Error(`Failed to fetch stats overview: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// AI SHOPPING AGENT API (PHASE 2)
// ---------------------------------------------------------------------------

export async function apiAgentChat(params: {
  conversationId?: string | null;
  userId?: string | null;
  message: string;
}): Promise<{
  success: boolean;
  conversationId: string;
  response: string;
  toolCalls: any[];
  products: Product[];
  cartUpdated: boolean;
  cartItemCount?: number;
  cartTotal?: number;
  turnsRemaining: number;
  turnCount: number;
  error?: string;
}> {
  // Direct /agent/chat spec support with /api/agent/chat fallback
  const res = await fetch(`/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to communicate with AI Shopping Agent');
  }
  return data;
}

export async function fetchAgentConversation(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/agent/conversations/${id}`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch agent conversation: ${res.status}`);
  }
  return res.json();
}

export async function fetchAgentActions(): Promise<{ success: boolean; count: number; actions: any[] }> {
  const res = await fetch(`${API_BASE}/agent/actions`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch agent actions: ${res.status}`);
  }
  return res.json();
}

export async function fetchDatabaseCart(userId?: string): Promise<{
  success: boolean;
  userId: string;
  items: any[];
  totalAmount: number;
  totalCount: number;
}> {
  const url = userId ? `${API_BASE}/agent/cart/${userId}` : `${API_BASE}/agent/cart`;
  const res = await fetch(url, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch cart: ${res.status}`);
  }
  return res.json();
}

export async function apiUpdateCartItemQuantity(
  productId: string,
  quantity: number,
  userId?: string
): Promise<{ success: boolean; message: string; totalCount: number; totalAmount: number }> {
  const res = await fetch(`${API_BASE}/agent/cart/item`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ productId, quantity, userId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update cart quantity');
  }
  return data;
}

export async function apiRemoveCartItem(productId: string, userId?: string): Promise<{ success: boolean }> {
  const url = `${API_BASE}/agent/cart/item/${productId}${userId ? `?userId=${userId}` : ''}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to remove item from cart');
  }
  return data;
}

export async function apiClearCart(userId?: string): Promise<{ success: boolean }> {
  const url = `${API_BASE}/agent/cart/clear${userId ? `?userId=${userId}` : ''}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to clear cart');
  }
  return data;
}

// ---------------------------------------------------------------------------
// ABANDONED CART NUDGE API (PHASE 3)
// ---------------------------------------------------------------------------

export async function apiTriggerAbandonedCartNudge(userId?: string): Promise<{
  success: boolean;
  nudge: {
    title: string;
    message: string;
    discountCode: string;
    items: any[];
    totalAmount: number;
    totalCount: number;
  };
  notificationId?: string;
  error?: string;
}> {
  // Support POST /agent/nudge specification
  const res = await fetch('/agent/nudge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to trigger abandoned cart reminder');
  }
  return data;
}

// ---------------------------------------------------------------------------
// CHECKOUT & RAZORPAY API (PHASE 3)
// ---------------------------------------------------------------------------

export async function apiCreateCheckoutOrder(payload: {
  userId?: string;
  shippingAddress: any;
  items?: any[];
  discountCode?: string;
}): Promise<{
  success: boolean;
  message?: string;
  order: any;
  razorpay: {
    orderId: string;
    key: string;
    amount: number;
    amountInr: number;
    amountUsd: number;
    currency: string;
    name: string;
    description: string;
    prefill: {
      name: string;
      email: string;
      contact: string;
    };
  };
}> {
  const res = await fetch(`${API_BASE}/orders/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to initialize checkout');
  }
  return data;
}

export async function apiVerifyOrderPayment(
  orderId: string,
  payload: {
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
    simulateFailure?: boolean;
    failureReason?: string;
  }
): Promise<{
  success: boolean;
  status: 'paid' | 'failed';
  message?: string;
  error?: string;
  order: any;
}> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data;
}

export async function apiRetryOrderPayment(orderId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/retry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to retry order');
  }
  return data;
}

// ---------------------------------------------------------------------------
// POST-PURCHASE CROSS-SELL & NOTIFICATIONS (PHASE 4)
// ---------------------------------------------------------------------------

export async function apiGetPostPurchaseCrossSell(orderId: string): Promise<{
  success: boolean;
  order?: any;
  thankYouMessage?: string;
  crossSellProduct?: any;
  error?: string;
}> {
  const res = await fetch('/agent/post-purchase', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ orderId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch post-purchase recommendations');
  }
  return data;
}

export async function fetchNotifications(userId?: string): Promise<{
  success: boolean;
  count: number;
  notifications: any[];
}> {
  const url = userId ? `${API_BASE}/agent/notifications?userId=${userId}` : `${API_BASE}/agent/notifications`;
  const res = await fetch(url, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch notifications: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// ADMIN ANALYTICS & CONVERSATION LOGS API (PHASE 4)
// ---------------------------------------------------------------------------

export async function fetchAdminAnalytics(range = '30d'): Promise<AdminAnalyticsResponse> {
  const res = await fetch(`/admin/analytics?range=${encodeURIComponent(range)}`, {
    headers: {
      ...getAuthHeader(),
    },
  });
  
  const data = await res.json();
  if (res.status === 403) {
    throw new Error(data.error || 'Access forbidden: 403 Admin privilege required.');
  }
  if (res.status === 401) {
    throw new Error(data.error || 'Authentication required: 401 Please log in as an administrator.');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to fetch admin analytics (${res.status})`);
  }
  return data;
}

export async function fetchAdminConversations(params: {
  search?: string;
  limit?: number;
  page?: number;
} = {}): Promise<AdminConversationsResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.limit) query.append('limit', String(params.limit));
  if (params.page) query.append('page', String(params.page));

  const queryStr = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`/admin/conversations${queryStr}`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  const data = await res.json();
  if (res.status === 403) {
    throw new Error(data.error || 'Access forbidden: 403 Admin privilege required.');
  }
  if (res.status === 401) {
    throw new Error(data.error || 'Authentication required: 401 Please log in as an administrator.');
  }
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to fetch admin conversations (${res.status})`);
  }
  return data;
}


