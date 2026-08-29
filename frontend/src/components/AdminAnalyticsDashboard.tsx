import React, { useState, useEffect, useId } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Bot,
  DollarSign,
  Calendar,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Wrench,
  Sparkles,
  Layers,
  FileText,
  User as UserIcon,
  Shield,
  Lock,
  ArrowUpRight,
  HelpCircle,
  ChevronRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { fetchAdminAnalytics, fetchAdminConversations } from '../api.js';
import { AdminAnalyticsResponse, AdminConversationsResponse } from '../types.js';

interface Props {
  onNavigateToCatalog?: () => void;
  onOpenChatWithProduct?: (productName: string) => void;
}

export const AdminAnalyticsDashboard: React.FC<Props> = ({ onNavigateToCatalog }) => {
  const chartGradId = useId();
  const { user, login } = useAuth();
  const [selectedRange, setSelectedRange] = useState<string>('30d');
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [conversationsData, setConversationsData] = useState<AdminConversationsResponse | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [convSearch, setConvSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'metrics' | 'conversations' | 'security'>('metrics');
  const [chartMetric, setChartMetric] = useState<'conversionRate' | 'viewsAndOrders' | 'revenue'>('conversionRate');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState<boolean>(false);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [recSearch, setRecSearch] = useState<string>('');

  const isAdmin = user?.role === 'admin';

  const loadData = async (range = selectedRange) => {
    setIsLoading(true);
    setError(null);
    setIsForbidden(false);

    try {
      const [analyticsRes, convsRes] = await Promise.all([
        fetchAdminAnalytics(range),
        fetchAdminConversations({ search: convSearch }),
      ]);
      setAnalytics(analyticsRes);
      setConversationsData(convsRes);
      if (convsRes.data.length > 0 && !selectedConversationId) {
        setSelectedConversationId(convsRes.data[0].id);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('403') || msg.includes('Admin privilege required') || msg.includes('Access forbidden')) {
        setIsForbidden(true);
      } else if (msg.includes('401') || msg.includes('Authentication required')) {
        setIsForbidden(true);
      }
      setError(msg || 'Failed to load analytics data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedRange);
  }, [selectedRange, user]);

  const handleSearchConversations = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchAdminConversations({ search: convSearch });
      setConversationsData(res);
      if (res.data.length > 0) {
        setSelectedConversationId(res.data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAdminSwitch = async (email: string) => {
    try {
      setIsLoading(true);
      await login(email, 'demo-password');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to switch admin');
    }
  };

  // -------------------------------------------------------------------------
  // 403 FORBIDDEN SCREEN (NON-ADMINS)
  // -------------------------------------------------------------------------
  if (!isAdmin || isForbidden) {
    return (
      <div id="admin-forbidden-view" className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white border-2 border-red-200 rounded-2xl p-8 sm:p-12 shadow-sm text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-full uppercase tracking-wider mb-4 border border-red-200">
            HTTP 403 Forbidden • Access Control Enforced
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 font-serif">
            Administrator Access Required
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto text-base leading-relaxed mb-6">
            The commerce analytics dashboard and agent telemetry logs are restricted to users with the <code className="bg-gray-100 text-red-700 px-1.5 py-0.5 rounded font-mono text-sm">role = 'admin'</code> property.
            Non-admin requests are strictly blocked at both the API and route level.
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 max-w-lg mx-auto mb-8 text-left text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
              <span className="font-semibold text-gray-700">Current Session State:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${user ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'}`}>
                {user ? `Role: ${user.role}` : 'Unauthenticated'}
              </span>
            </div>
            <p className="text-gray-600 text-xs mb-2">
              <strong className="text-gray-800">User:</strong> {user ? `${user.name} (${user.email})` : 'Anonymous Guest'}
            </p>
            <p className="text-gray-600 text-xs font-mono">
              <strong className="text-gray-800">Target Endpoint:</strong> GET /admin/analytics → 403 Forbidden
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="switch-admin-elena"
              onClick={() => handleAdminSwitch('elena.vance@agenticcommerce.com')}
              className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              Sign in as Admin (Elena Vance)
            </button>
            <button
              id="switch-admin-marcus"
              onClick={() => handleAdminSwitch('marcus.thorne@agenticcommerce.com')}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-indigo-500" />
              Sign in as Ops Admin (Marcus Thorne)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RENDER ADMIN DASHBOARD
  // -------------------------------------------------------------------------
  const headline = analytics?.headlineMetrics;
  const timeSeries = analytics?.conversionOverTime || [];
  const topRecs = (analytics?.topRecommendations || []).filter((r) =>
    recSearch ? r.productName.toLowerCase().includes(recSearch.toLowerCase()) || r.category.toLowerCase().includes(recSearch.toLowerCase()) : true
  );
  const selectedConv = conversationsData?.data.find((c) => c.id === selectedConversationId);

  // SVG Chart Calculations
  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 20, right: 20, bottom: 35, left: 45 };

  let maxVal = 100;
  if (chartMetric === 'conversionRate') {
    maxVal = Math.max(30, ...timeSeries.map((p) => p.conversionRate * 1.25));
  } else if (chartMetric === 'viewsAndOrders') {
    maxVal = Math.max(20, ...timeSeries.map((p) => Math.max(p.views, p.paidOrders * 2)));
  } else if (chartMetric === 'revenue') {
    maxVal = Math.max(500, ...timeSeries.map((p) => p.revenue * 1.2));
  }

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const points = timeSeries.map((point, index) => {
    const x = padding.left + (index / Math.max(1, timeSeries.length - 1)) * innerWidth;
    let val = 0;
    if (chartMetric === 'conversionRate') val = point.conversionRate;
    else if (chartMetric === 'viewsAndOrders') val = point.views;
    else if (chartMetric === 'revenue') val = point.revenue;
    const y = padding.top + innerHeight - (Math.min(val, maxVal) / maxVal) * innerHeight;
    return { x, y, point, index };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${padding.top + innerHeight} L ${points[0].x},${padding.top + innerHeight} Z`
    : '';

  return (
    <div id="admin-analytics-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Shield className="w-3.5 h-3.5" />
              Admin Portal • Verified ({user?.name})
            </span>
            <span className="text-xs text-gray-500 font-mono">
              Role: <strong className="text-gray-800">{user?.role}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 font-serif">
            E-Commerce & Agent Intelligence Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Precise mathematical computation of store conversion, cart abandonment, and AI agent purchasing assistance.
          </p>
        </div>

        {/* Date Range Selector & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl border border-gray-200">
            {[
              { label: '7D', value: '7d' },
              { label: '14D', value: '14d' },
              { label: '30D', value: '30d' },
              { label: '90D', value: '90d' },
              { label: 'All', value: 'all' },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedRange(r.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedRange === r.value
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(selectedRange)}
            disabled={isLoading}
            className="p-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {error && !isForbidden && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadData(selectedRange)}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !analytics ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-gray-200 rounded w-24" />
                  <div className="w-8 h-8 bg-gray-200 rounded-xl" />
                </div>
                <div className="h-8 bg-gray-200 rounded w-16" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="pt-3 border-t border-gray-100 flex justify-between">
                  <div className="h-3 bg-gray-200 rounded w-16" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 h-72 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-xs font-medium">Computing analytics and aggregation metrics...</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Main Tab Navigation */}
          <div className="flex items-center gap-3 my-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'metrics'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Metrics & Recommendations
        </button>
        <button
          onClick={() => setActiveTab('conversations')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'conversations'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Agent Conversation Logs ({conversationsData?.totalCount || 0})
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          403 Role Security Tests
        </button>
      </div>

      {/* TAB 1: METRICS & CHARTS */}
      {activeTab === 'metrics' && (
        <div className="space-y-8">
          {/* Headline Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Conversion Rate */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Conversion Rate
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight font-serif mb-1">
                  {headline?.conversionRate.value || 0}%
                </div>
                <div className="text-xs text-gray-500 mb-3 font-mono bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                  {headline?.conversionRate.formula || 'paid orders / unique viewers'}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 text-xs text-gray-600 flex items-center justify-between">
                <span>
                  <strong className="text-gray-900 font-semibold">{headline?.conversionRate.paidOrders || 0}</strong> paid orders
                </span>
                <span>
                  <strong className="text-gray-900 font-semibold">{headline?.conversionRate.uniqueProductViewers || 0}</strong> unique viewers
                </span>
              </div>
            </div>

            {/* Card 2: Cart Abandonment Rate */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Cart Abandonment
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight font-serif mb-1">
                  {headline?.cartAbandonmentRate.value || 0}%
                </div>
                <div className="text-xs text-gray-500 mb-3 font-mono bg-gray-50 p-1.5 rounded-lg border border-gray-100 truncate" title={headline?.cartAbandonmentRate.formula}>
                  {headline?.cartAbandonmentRate.formula || 'abandoned / total carts (24h)'}
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 text-xs text-gray-600 flex items-center justify-between">
                <span>
                  <strong className="text-amber-700 font-semibold">{headline?.cartAbandonmentRate.abandonedCarts || 0}</strong> abandoned
                </span>
                <span>
                  <strong className="text-emerald-700 font-semibold">{headline?.cartAbandonmentRate.convertedCarts || 0}</strong> converted
                </span>
              </div>
            </div>

            {/* Card 3: Agent-Assisted vs Self-Service Purchase Ratio */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Agent-Assisted Ratio
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight font-serif mb-1">
                  {headline?.agentAssistedRatio.agentAssistedPercentage || 0}%
                  <span className="text-xs font-normal text-gray-500 ml-2 font-sans">
                    vs {headline?.agentAssistedRatio.selfServicePercentage || 0}% Self
                  </span>
                </div>
                {/* Visual Ratio Bar */}
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden my-3 flex">
                  <div
                    className="bg-purple-600 h-full transition-all duration-500"
                    style={{ width: `${headline?.agentAssistedRatio.agentAssistedPercentage || 0}%` }}
                    title={`Agent Assisted: ${headline?.agentAssistedRatio.agentAssistedPercentage}%`}
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${headline?.agentAssistedRatio.selfServicePercentage || 0}%` }}
                    title={`Self-Service: ${headline?.agentAssistedRatio.selfServicePercentage}%`}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 flex items-center justify-between">
                <span className="text-purple-700 font-medium">
                  {headline?.agentAssistedRatio.agentAssistedOrders || 0} Agent (${headline?.agentAssistedRatio.agentAssistedRevenue || 0})
                </span>
                <span className="text-emerald-700 font-medium">
                  {headline?.agentAssistedRatio.selfServiceOrders || 0} Self (${headline?.agentAssistedRatio.selfServiceRevenue || 0})
                </span>
              </div>
            </div>

            {/* Card 4: Total Revenue & Orders */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs hover:border-gray-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Gross GMV & Orders
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-gray-900 tracking-tight font-serif mb-1">
                  ${headline?.totalRevenue?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  Across {headline?.totalOrders || 0} total order lifecycle attempts
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 text-xs text-gray-600 flex items-center justify-between">
                <span className="text-emerald-600 font-medium">
                  ● {headline?.orderStatusBreakdown.paid || 0} Paid
                </span>
                <span className="text-amber-600 font-medium">
                  ● {headline?.orderStatusBreakdown.pending || 0} Pending
                </span>
                <span className="text-red-500 font-medium">
                  ● {headline?.orderStatusBreakdown.failed || 0} Failed
                </span>
              </div>
            </div>
          </div>

          {/* Line Chart Section: Conversion Rate Over Time */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-serif">
                  Conversion Rate Trend Over Time
                </h3>
                <p className="text-xs text-gray-500">
                  Daily tracking of store visitors, viewer conversions, and order volume.
                </p>
              </div>

              {/* Chart Metric Toggle */}
              <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs font-medium">
                <button
                  onClick={() => setChartMetric('conversionRate')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartMetric === 'conversionRate' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600'
                  }`}
                >
                  Conversion Rate %
                </button>
                <button
                  onClick={() => setChartMetric('viewsAndOrders')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartMetric === 'viewsAndOrders' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600'
                  }`}
                >
                  Views & Orders
                </button>
                <button
                  onClick={() => setChartMetric('revenue')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartMetric === 'revenue' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600'
                  }`}
                >
                  Daily Revenue ($)
                </button>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="relative overflow-x-auto">
              {timeSeries.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  No time series records in selected range
                </div>
              ) : (
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-64 overflow-visible"
                >
                  <defs>
                    <linearGradient id={chartGradId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                    const y = padding.top + innerHeight * (1 - ratio);
                    const labelVal = (maxVal * ratio).toFixed(chartMetric === 'conversionRate' ? 0 : 0);
                    return (
                      <g key={i}>
                        <line
                          x1={padding.left}
                          y1={y}
                          x2={chartWidth - padding.right}
                          y2={y}
                          stroke="#f3f4f6"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={padding.left - 8}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="10"
                          fill="#9ca3af"
                          fontFamily="monospace"
                        >
                          {labelVal}{chartMetric === 'conversionRate' ? '%' : chartMetric === 'revenue' ? '$' : ''}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {areaD && (
                    <path d={areaD} fill={`url(#${chartGradId})`} />
                  )}

                  {/* Line stroke */}
                  {pathD && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Points & Hover Interactivity */}
                  {points.map((p, idx) => (
                    <g key={idx} className="cursor-pointer">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={hoveredPointIndex === idx ? 6 : 3.5}
                        fill={hoveredPointIndex === idx ? '#312e81' : '#4f46e5'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      />
                      {/* X-axis labels at intervals */}
                      {(idx % Math.ceil(timeSeries.length / 7) === 0 || idx === timeSeries.length - 1) && (
                        <text
                          x={p.x}
                          y={chartHeight - 8}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#6b7280"
                        >
                          {p.point.label}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>
              )}

              {/* Hover Tooltip display */}
              {hoveredPointIndex !== null && timeSeries[hoveredPointIndex] && (
                <div className="mt-3 p-3 bg-gray-900 text-white rounded-xl text-xs flex items-center justify-between max-w-md mx-auto shadow-lg animate-fadeIn">
                  <div>
                    <span className="text-gray-400 font-mono">{timeSeries[hoveredPointIndex].date}</span>
                    <div className="font-bold text-sm text-indigo-300">
                      Conversion Rate: {timeSeries[hoveredPointIndex].conversionRate}%
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div>Views: <strong className="text-white">{timeSeries[hoveredPointIndex].views}</strong> ({timeSeries[hoveredPointIndex].uniqueViewers} unique)</div>
                    <div>Paid Orders: <strong className="text-emerald-400">{timeSeries[hoveredPointIndex].paidOrders}</strong> (${timeSeries[hoveredPointIndex].revenue.toFixed(2)})</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Agent Recommendations Table */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900 font-serif">
                    Top Agent Recommendations
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Products most frequently recommended by the AI Assistant (<code className="font-mono text-purple-700">AgentAction: recommend</code>) with resulting sales conversions.
                </p>
              </div>

              {/* Search filter for products */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter recommendations..."
                  value={recSearch}
                  onChange={(e) => setRecSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3 text-center">AI Recommendations</th>
                    <th className="py-3 px-3 text-center">Purchases / Conversions</th>
                    <th className="py-3 px-3 text-right">Conversion Rate</th>
                    <th className="py-3 px-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topRecs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No agent recommendations found matching filter.
                      </td>
                    </tr>
                  ) : (
                    topRecs.map((rec, idx) => (
                      <tr key={rec.productId} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <span className="w-5 text-gray-400 font-mono font-bold text-center">
                              #{idx + 1}
                            </span>
                            {rec.imageUrl ? (
                              <img
                                src={rec.imageUrl}
                                alt={rec.productName}
                                className="w-9 h-9 object-cover rounded-lg border border-gray-200 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs shrink-0">
                                PROD
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900">{rec.productName}</div>
                              <div className="text-gray-400 text-[11px] font-mono truncate max-w-xs" title={rec.sampleReason}>
                                Reason: {rec.sampleReason}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-medium">
                            {rec.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-medium text-gray-900">
                          ${rec.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            {rec.recommendationCount}x
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {rec.conversionsCount} sold
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">
                          {rec.conversionRate}%
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                          ${rec.revenueGenerated.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AGENT CONVERSATION LOG VIEWER */}
      {activeTab === 'conversations' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-serif flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                Agent Conversation Logs & Tool Invocations
              </h3>
              <p className="text-xs text-gray-500">
                Inspect live dialogue turns, Claude tool executions (<code className="font-mono text-indigo-600">search_catalog</code>, <code className="font-mono text-indigo-600">compare_products</code>, <code className="font-mono text-indigo-600">add_to_cart</code>), and user actions.
              </p>
            </div>

            <form onSubmit={handleSearchConversations} className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user or message content..."
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-indigo-500"
              />
            </form>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Conversation List (Left Column) */}
            <div className="lg:col-span-5 border-r border-gray-200 divide-y divide-gray-100 overflow-y-auto max-h-[600px]">
              {conversationsData?.data.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No conversation logs found matching search.
                </div>
              ) : (
                conversationsData?.data.map((conv) => {
                  const isSelected = conv.id === selectedConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversationId(conv.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-xs text-gray-900 flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                          {conv.user.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(conv.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 font-medium line-clamp-1 mb-2">
                        "{conv.previewPrompt}"
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md font-medium">
                          {conv.messageCount} messages
                        </span>
                        {conv.toolsCalled.map((tool) => (
                          <span
                            key={tool}
                            className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-mono font-medium flex items-center gap-1"
                          >
                            <Wrench className="w-2.5 h-2.5" />
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Conversation Detail & Thread Viewer (Right Column) */}
            <div className="lg:col-span-7 p-6 overflow-y-auto max-h-[600px] bg-gray-50/50 flex flex-col justify-between">
              {selectedConv ? (
                <div>
                  {/* Thread Header */}
                  <div className="pb-4 mb-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono text-gray-500">Session ID: {selectedConv.id}</div>
                      <div className="font-bold text-sm text-gray-900 mt-0.5">
                        User: {selectedConv.user.name} ({selectedConv.user.email})
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                      {selectedConv.actions.length} Agent Actions Logged
                    </span>
                  </div>

                  {/* Message Stream */}
                  <div className="space-y-4 mb-6">
                    {selectedConv.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-2xl border text-xs ${
                          msg.role === 'user'
                            ? 'bg-white border-gray-200 text-gray-800 max-w-xl'
                            : 'bg-indigo-50/70 border-indigo-100 text-gray-900 ml-auto max-w-xl'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1 text-[11px]">
                          <span className={msg.role === 'user' ? 'text-gray-600' : 'text-indigo-700 flex items-center gap-1'}>
                            {msg.role === 'user' ? '👤 Customer' : '🤖 AI Commerce Assistant'}
                          </span>
                          <span className="text-gray-400 font-mono text-[10px]">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                        {/* Tool Calls Inspector */}
                        {msg.toolCalls && Array.isArray(msg.toolCalls) && msg.toolCalls.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-indigo-200/60">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-1.5 flex items-center gap-1">
                              <Wrench className="w-3 h-3" />
                              AI Tool Executions ({msg.toolCalls.length}):
                            </div>
                            <div className="space-y-1.5">
                              {msg.toolCalls.map((tc: any, i: number) => {
                                const toolName = tc.tool || tc.name || 'Tool';
                                const args = tc.args || tc.arguments || {};
                                return (
                                  <div key={i} className="p-2 bg-white rounded-lg border border-indigo-100 text-xs">
                                    <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
                                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[11px]">
                                        {toolName}
                                      </span>
                                    </div>
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {Object.entries(args).map(([k, v]) => (
                                        <span key={k} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-50 text-gray-700 text-[11px] border border-gray-100">
                                          <span className="font-medium text-gray-500">{k}:</span>
                                          <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* AgentAction Payload Badges */}
                  {selectedConv.actions.length > 0 && (
                    <div className="p-4 bg-white border border-purple-200 rounded-xl">
                      <div className="text-xs font-bold text-purple-900 mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        Persisted AgentAction Records:
                      </div>
                      <div className="space-y-2">
                        {selectedConv.actions.map((act) => {
                          const payload = act.payload || {};
                          return (
                            <div key={act.id} className="p-2.5 bg-purple-50/60 rounded-lg text-xs border border-purple-100">
                              <div className="flex items-center justify-between font-semibold text-purple-900 mb-1">
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px]">
                                  {act.actionType}
                                </span>
                                <span className="text-[10px] text-purple-600">
                                  {new Date(act.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1 bg-white p-2 rounded-lg border border-purple-100">
                                {Object.entries(payload).map(([k, v]) => (
                                  <span key={k} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-900 text-[11px]">
                                    <span className="font-medium text-purple-600">{k}:</span>
                                    <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Select a conversation from the left to inspect full messages and tool calls.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 403 ROLE SECURITY VERIFICATION */}
      {activeTab === 'security' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 font-serif flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Role-Based Access Control (RBAC) & 403 Verification
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Test and verify that non-admin requests receive HTTP 403 Forbidden on both API endpoints and route levels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                1. Test with Regular Customer Account (Expect 403)
              </span>
              <p className="text-xs text-gray-600">
                Signing in as a standard user (<code className="font-mono text-red-600">role: 'user'</code>) will trigger a 403 Forbidden response on <code className="font-mono">GET /admin/analytics</code>.
              </p>
              <button
                onClick={() => handleAdminSwitch('sophia.r@example.com')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Log in as Customer (Sophia Rodriguez) → Test 403
              </button>
            </div>

            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                2. Test with Admin Account (Expect 200 OK)
              </span>
              <p className="text-xs text-gray-600">
                Signing in as Elena Vance or Marcus Thorne (<code className="font-mono text-emerald-600">role: 'admin'</code>) grants complete analytics & conversation log access.
              </p>
              <button
                onClick={() => handleAdminSwitch('elena.vance@agenticcommerce.com')}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Log in as Admin (Elena Vance) → 200 OK
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
