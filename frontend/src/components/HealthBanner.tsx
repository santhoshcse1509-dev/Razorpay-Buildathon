import React from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Database, ShieldCheck, Zap, Activity } from 'lucide-react';
import { HealthCheckResponse } from '../types.js';

interface HealthBannerProps {
  health: HealthCheckResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const HealthBanner: React.FC<HealthBannerProps> = ({ health, loading, error, onRefresh }) => {
  const isHealthy = health?.status === 'ok' && health?.database?.status === 'healthy';

  return (
    <section id="health-check-banner" className="bg-neutral-900 text-neutral-100 rounded-xl p-5 border border-neutral-800 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Status and Service Info */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`p-2.5 rounded-lg shrink-0 ${isHealthy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
            {isHealthy ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Backend Service Status
              </h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase ${isHealthy ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                {loading ? 'Checking...' : isHealthy ? 'HTTP 200 OK • Healthy' : 'Degraded'}
              </span>
              <span className="text-xs text-neutral-400 font-mono bg-neutral-800 px-2 py-0.5 rounded">
                v{health?.version || '1.0.0'}
              </span>
            </div>
            <p className="text-sm text-neutral-400 mt-0.5">
              Express API running on port 3000 • Vite Middleware Active
            </p>
          </div>
        </div>

        {/* Right: Quick metrics & Refresh action */}
        <div className="flex items-center gap-3 flex-wrap">
          {health?.database && (
            <div className="flex items-center gap-2 bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/60 text-xs">
              <Database className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="text-neutral-300 font-medium">DB Latency:</span>
              <span className="text-emerald-400 font-mono font-semibold">{health.database.responseTimeMs}ms</span>
            </div>
          )}

          {health?.uptimeSeconds !== undefined && (
            <div className="flex items-center gap-2 bg-neutral-800/80 px-3 py-1.5 rounded-lg border border-neutral-700/60 text-xs">
              <Activity className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-neutral-300 font-medium">Uptime:</span>
              <span className="text-neutral-200 font-mono">{health.uptimeSeconds}s</span>
            </div>
          )}

          <button
            id="btn-refresh-health"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 text-neutral-200 text-xs font-medium rounded-lg border border-neutral-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-test Health
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-xs text-rose-300">
          <strong>Health check error:</strong> {error}
        </div>
      )}

      {/* Database & Environment Overview Grid */}
      {health && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-neutral-800/80 text-xs">
          <div className="bg-neutral-800/40 p-2.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 block mb-0.5">Database Engine</span>
            <span className="text-neutral-200 font-medium">Prisma ORM (SQLite/PG)</span>
          </div>
          <div className="bg-neutral-800/40 p-2.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 block mb-0.5">Seeded Users</span>
            <span className="text-emerald-400 font-semibold font-mono text-sm">{health.database.counts.users} Users</span>
          </div>
          <div className="bg-neutral-800/40 p-2.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 block mb-0.5">Seeded Products</span>
            <span className="text-sky-400 font-semibold font-mono text-sm">{health.database.counts.products} Products</span>
          </div>
          <div className="bg-neutral-800/40 p-2.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 block mb-0.5">Seeded Orders</span>
            <span className="text-amber-400 font-semibold font-mono text-sm">{health.database.counts.orders} Orders</span>
          </div>
          <div className="bg-neutral-800/40 p-2.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 block mb-0.5">Active Cart Items</span>
            <span className="text-indigo-400 font-semibold font-mono text-sm">{health.database.counts.cartItems} Items</span>
          </div>
          <div className="bg-neutral-800/40 p-2.5 rounded-lg border border-neutral-800">
            <span className="text-neutral-400 block mb-0.5">AI Conversations</span>
            <span className="text-purple-400 font-semibold font-mono text-sm">{health.database.counts.conversations} Chats</span>
          </div>
        </div>
      )}
    </section>
  );
};
