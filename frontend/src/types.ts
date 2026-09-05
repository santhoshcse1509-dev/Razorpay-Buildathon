export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  database: {
    status: string;
    type: string;
    responseTimeMs: number;
    error: string | null;
    counts: {
      users: number;
      products: number;
      orders: number;
      cartItems: number;
      conversations: number;
    };
  };
  secretsConfigured: {
    databaseUrlConfigured: boolean;
    jwtSecretConfigured: boolean;
    anthropicApiKeyConfigured: boolean;
    razorpayKeyIdConfigured: boolean;
    razorpayKeySecretConfigured: boolean;
    googleClientIdConfigured: boolean;
    googleClientSecretConfigured: boolean;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  googleId?: string | null;
  createdAt?: string;
  _count?: {
    cartItems?: number;
    orders?: number;
    conversations?: number;
  };
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: AuthUser;
  token: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'name_asc' | 'name_desc' | 'stock_desc';
  search?: string;
  inStockOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface CategoryInfo {
  name: string;
  count: number;
  minPrice?: number;
  maxPrice?: number;
  totalStock?: number;
}

export interface SingleProductResponse {
  success: boolean;
  data: Product;
  relatedProducts: Product[];
}

export interface ProductReview {
  id: string;
  productId: string;
  author: string;
  avatarColor?: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
}

export interface ProductReviewsResponse {
  success: boolean;
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: ProductReview[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  googleId?: string | null;
  createdAt: string;
  _count?: {
    orders: number;
    cartItems: number;
    conversations: number;
  };
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product?: {
    id: string;
    name: string;
    category: string;
    imageUrl?: string;
  };
}

export interface OrderTimelineStep {
  step: string;
  status: 'completed' | 'current' | 'upcoming' | 'failed';
  title: string;
  description: string;
  timestamp?: string;
  location?: string;
}

export interface Order {
  id: string;
  userId: string;
  status: 'paid' | 'pending' | 'failed';
  fulfillmentStatus?: 'Processing' | 'Shipped' | 'Delivered' | 'Payment Pending' | 'Payment Failed';
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  shippingAddress?: {
    name?: string;
    email?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
  timeline?: OrderTimelineStep[];
  totalAmount: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
}

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  toolCalls?: any;
  createdAt: string;
}

export interface AgentAction {
  id: string;
  actionType: 'recommend' | 'add_to_cart' | 'compare';
  payload: any;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  messages: Message[];
  actions: AgentAction[];
}

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface RazorpayCheckoutData {
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
}

export interface CheckoutResult {
  success: boolean;
  message?: string;
  order: Order;
  razorpay: RazorpayCheckoutData;
}

export interface AbandonedCartNudge {
  title: string;
  message: string;
  discountCode: string;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    category?: string;
  }>;
  totalAmount: number;
  totalCount: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  read: boolean;
  sentAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PostPurchaseData {
  success: boolean;
  order?: {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    itemCount: number;
  };
  thankYouMessage?: string;
  crossSellProduct?: Product & {
    recommendationReason?: string;
  };
  error?: string;
}

export interface AdminHeadlineMetrics {
  conversionRate: {
    value: number;
    paidOrders: number;
    uniqueProductViewers: number;
    totalProductViews: number;
    definition: string;
    formula: string;
  };
  cartAbandonmentRate: {
    value: number;
    abandonedCarts: number;
    convertedCarts: number;
    totalCartsCreated: number;
    definition: string;
    formula: string;
  };
  agentAssistedRatio: {
    agentAssistedOrders: number;
    selfServiceOrders: number;
    totalPaidOrders: number;
    agentAssistedPercentage: number;
    selfServicePercentage: number;
    agentAssistedRevenue: number;
    selfServiceRevenue: number;
    ratioFormatted: string;
    definition: string;
  };
  totalRevenue: number;
  totalOrders: number;
  orderStatusBreakdown: {
    paid: number;
    pending: number;
    failed: number;
  };
  totalConversations: number;
  totalAgentActions: number;
  totalUsers: number;
}

export interface AdminTimeSeriesPoint {
  date: string;
  label: string;
  views: number;
  uniqueViewers: number;
  paidOrders: number;
  revenue: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  agentAssistedOrders: number;
  selfServiceOrders: number;
}

export interface TopRecommendationItem {
  productId: string;
  productName: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string | null;
  recommendationCount: number;
  sampleReason: string;
  conversionsCount: number;
  revenueGenerated: number;
  conversionRate: number;
}

export interface AdminAnalyticsResponse {
  success: boolean;
  role?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  dateRange: {
    range: string;
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  headlineMetrics: AdminHeadlineMetrics;
  conversionOverTime: AdminTimeSeriesPoint[];
  topRecommendations: TopRecommendationItem[];
  recentClassifiedOrders: Array<{
    id: string;
    userId: string;
    userName: string;
    totalAmount: number;
    createdAt: string;
    isAgentAssisted: boolean;
    itemsCount: number;
  }>;
  error?: string;
}

export interface AdminConversationsResponse {
  success: boolean;
  totalCount: number;
  count: number;
  page: number;
  totalPages: number;
  data: Array<{
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    messageCount: number;
    actionCount: number;
    toolsCalled: string[];
    previewPrompt: string;
    previewResponse: string;
    messages: Array<{
      id: string;
      role: 'user' | 'agent';
      content: string;
      toolCalls?: any;
      createdAt: string;
    }>;
    actions: Array<{
      id: string;
      actionType: string;
      payload?: any;
      createdAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
  }>;
  error?: string;
}

