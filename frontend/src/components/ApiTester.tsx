import React, { useState } from 'react';
import { Play, CheckCircle2, AlertCircle, Copy, Check, Terminal } from 'lucide-react';

interface Endpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  body?: any;
}

export const ApiTester: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [responsePayload, setResponsePayload] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const endpoints: Endpoint[] = [
    {
      id: 'health',
      name: 'Backend Health Check',
      method: 'GET',
      path: '/api/health',
      description: 'Verifies database connection, ORM status, system uptime, and secret state.',
    },
    {
      id: 'login',
      name: 'User Login (POST /api/auth/login)',
      method: 'POST',
      path: '/api/auth/login',
      description: 'Verifies credentials, bcrypt compare, and generates 7-day signed JWT token.',
      body: {
        email: 'sophia.r@example.com',
        password: 'password123',
      },
    },
    {
      id: 'signup',
      name: 'User Sign Up (POST /api/auth/signup)',
      method: 'POST',
      path: '/api/auth/signup',
      description: 'Hashes password with bcrypt and creates a new user record with role: user.',
      body: {
        name: 'Alex Rivera',
        email: `alex_${Math.floor(Math.random() * 10000)}@example.com`,
        password: 'securePassword123!',
      },
    },
    {
      id: 'forgot',
      name: 'Forgot Password (POST /api/auth/forgot-password)',
      method: 'POST',
      path: '/api/auth/forgot-password',
      description: 'Generates secure 1-hour password reset token and instructions.',
      body: {
        email: 'sophia.r@example.com',
      },
    },
    {
      id: 'products_filter',
      name: 'Products Filter & Search (GET /api/products)',
      method: 'GET',
      path: '/api/products?category=Electronics&minPrice=50&maxPrice=500&sortBy=price_asc',
      description: 'Queries products with category, price range, and sort order.',
    },
    {
      id: 'product_detail',
      name: 'Product Details (GET /api/products/prod_elec_01)',
      method: 'GET',
      path: '/api/products/prod_elec_01',
      description: 'Returns single product details and related products in same category.',
    },
    {
      id: 'agent_chat_shoes',
      name: 'Agent Chat: Shoes Query (POST /agent/chat)',
      method: 'POST',
      path: '/agent/chat',
      description: 'Executes Claude tool-use search_products for running shoes under ₹3000.',
      body: {
        message: 'I need running shoes under ₹3000',
      },
    },
    {
      id: 'agent_actions',
      name: 'Agent Actions Audit (GET /agent/actions)',
      method: 'GET',
      path: '/agent/actions',
      description: 'Returns all tool-use invocations and database mutations logged to AgentAction table.',
    },
    {
      id: 'categories',
      name: 'Product Categories & Stats',
      method: 'GET',
      path: '/api/products/categories',
      description: 'Returns category counts, min/max price spans, and inventory stock.',
    },
    {
      id: 'users',
      name: 'List Users (GET /api/users)',
      method: 'GET',
      path: '/api/users',
      description: 'Returns all 8 seeded users with role and relationship counts.',
    },
  ];

  const executeApiCall = async (ep: Endpoint) => {
    setLoading(true);
    setError(null);
    setSelectedEndpoint(ep);
    const start = performance.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      const token = localStorage.getItem('agentic_auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options: RequestInit = {
        method: ep.method,
        headers,
      };
      if (ep.method === 'POST' && ep.body) {
        options.body = JSON.stringify(ep.body);
      }

      const res = await fetch(ep.path, options);
      const latency = Math.round(performance.now() - start);
      setResponseStatus(res.status);
      setResponseTime(latency);
      const data = await res.json();
      setResponsePayload(data);
    } catch (err: any) {
      setResponseStatus(500);
      setError(err.message || 'API request failed');
      setResponsePayload(null);
    } finally {
      setLoading(false);
    }
  };

  const copyPayload = () => {
    if (!responsePayload) return;
    navigator.clipboard.writeText(JSON.stringify(responsePayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="api-tester-section" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-500" />
            Live Endpoint Testing &amp; REST Inspector
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Test backend auth endpoints, filtered product queries, and inspect JSON payloads in real time
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Endpoint List */}
        <div className="lg:col-span-5 space-y-2">
          {endpoints.map((ep) => (
            <button
              key={ep.id}
              onClick={() => executeApiCall(ep)}
              className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                selectedEndpoint?.id === ep.id
                  ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700/60 shadow-2xs'
                  : 'bg-neutral-50/70 dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
            >
              <div className="truncate pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`px-1.5 py-0.5 font-mono font-bold text-[10px] rounded border ${
                      ep.method === 'GET'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {ep.path}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {ep.description}
                </p>
              </div>

              <div className="shrink-0">
                <span className="p-1.5 bg-white dark:bg-neutral-800 rounded-lg text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                  <Play className="w-3 h-3 text-sky-500 fill-sky-500" />
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Response Viewer */}
        <div className="lg:col-span-7 flex flex-col bg-neutral-950 text-neutral-200 rounded-xl border border-neutral-800 overflow-hidden min-h-[380px]">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-neutral-400 truncate max-w-[200px]">
                {selectedEndpoint ? selectedEndpoint.path : '/api/health'}
              </span>
              {responseStatus !== null && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {responseStatus >= 200 && responseStatus < 300 ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {responseStatus}
                </span>
              )}
              {responseTime !== null && (
                <span className="text-[10px] font-mono text-neutral-400">
                  {responseTime}ms
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  executeApiCall(selectedEndpoint || endpoints[0])
                }
                disabled={loading}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white rounded text-xs font-medium transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>

              {responsePayload && (
                <button
                  onClick={copyPayload}
                  className="p-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition cursor-pointer"
                  title="Copy JSON Payload"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-4 flex-1 overflow-auto font-mono text-xs max-h-[350px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-neutral-500 text-xs animate-pulse">
                Fetching response from Express backend...
              </div>
            ) : error ? (
              <div className="text-rose-400 text-xs">
                <strong>Request Failed:</strong> {error}
              </div>
            ) : responsePayload ? (
              <pre className="text-emerald-400/90 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(responsePayload, null, 2)}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs space-y-2">
                <Terminal className="w-8 h-8 text-neutral-700" />
                <span>Select an endpoint or click &ldquo;Send Request&rdquo; to test</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
